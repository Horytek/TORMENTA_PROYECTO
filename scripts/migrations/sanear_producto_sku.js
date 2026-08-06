import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";
import {
  construirIndiceValores,
  planificarNormalizacion,
} from "../../src/services/inventario/normalizacionSku.js";

/**
 * Saneamiento de `producto_sku.attrs_key`.
 *
 * `resolveSku` busca una variante por la clave canónica `id_atributo:id_valor|…`.
 * Todo lo que no esté en ese formato es invisible para él: no encuentra el SKU
 * y **crea uno nuevo**, dispersando el stock entre duplicados.
 *
 * ⚠️ Este script SOLO reescribe `attrs_key`. No fusiona, no borra y no toca
 * stock. Si la clave nueva ya la ocupa otro SKU del mismo producto, el caso
 * queda reportado para revisión humana: dos variantes con stock real no se
 * unen por una coincidencia de clave sin que alguien confirme que son la misma
 * prenda.
 *
 * La fuente de verdad es `attributes_json`, NO `sku_atributo_valor` — se
 * verificó que esta última está corrupta (usa `id_valor = 1` para todos los
 * atributos, o sea afirma "Talla = Azul"). Ver `normalizacionSku.js`.
 *
 * Uso:
 *   npm run db:sanear:sku            → solo reporte, no escribe nada
 *   npm run db:sanear:sku -- --aplicar → aplica los cambios sin conflicto
 */

const HOSTS_LOCALES = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"]);
const esHostLocal = (host) => HOSTS_LOCALES.has(String(host).trim().toLowerCase());

const APLICAR = process.argv.includes("--aplicar");

const csvEscapar = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const escribirCsv = (nombre, cabeceras, filas) => {
  const destino = path.resolve(process.cwd(), nombre);
  const contenido = [cabeceras.join(","), ...filas.map((f) => f.map(csvEscapar).join(","))].join("\n");
  fs.writeFileSync(destino, contenido, "utf8");
  return destino;
};

const totalStock = async (cx, id_tenant) => {
  const [[r]] = await cx.query("SELECT COALESCE(SUM(stock),0) t FROM inventario_stock WHERE id_tenant = ?", [id_tenant]);
  return Number(r.t);
};

const sanearTenant = async (cx, id_tenant) => {
  const [valores] = await cx.query(
    "SELECT id_valor, id_atributo, valor FROM atributo_valor WHERE id_tenant = ?",
    [id_tenant]
  );
  const [skus] = await cx.query(
    "SELECT id_sku, id_producto, attrs_key, attributes_json FROM producto_sku WHERE id_tenant = ?",
    [id_tenant]
  );
  if (skus.length === 0) return null;

  const plan = planificarNormalizacion(skus, construirIndiceValores(valores));

  console.log(`\n── tenant ${id_tenant} · ${skus.length} SKU`);
  console.log(`   ya canónicos            : ${plan.yaCanonicos.length}`);
  console.log(`   normalizables           : ${plan.actualizar.length}`);
  console.log(`   conflictos (revisión)   : ${plan.conflictos.length}`);
  console.log(`   sin fuente confiable    : ${plan.sinFuente.length}`);

  if (!APLICAR) return plan;
  if (plan.actualizar.length === 0) {
    console.log("   nada que aplicar.");
    return plan;
  }

  // Respaldo ANTES de escribir: el valor viejo de `attrs_key` no queda en
  // ninguna otra parte, así que sin esto el cambio sería irreversible. Con el
  // CSV, deshacerlo es un UPDATE por fila.
  const respaldo = escribirCsv(
    "sku_rollback_attrs_key.csv",
    ["id_tenant", "id_sku", "attrs_key_anterior", "attrs_key_nueva"],
    plan.actualizar.map((a) => [id_tenant, a.id_sku, a.claveVieja, a.claveNueva])
  );
  console.log(`   respaldo para revertir → ${respaldo}`);

  const stockAntes = await totalStock(cx, id_tenant);
  await cx.beginTransaction();
  try {
    for (const { id_sku, claveNueva } of plan.actualizar) {
      await cx.query("UPDATE producto_sku SET attrs_key = ? WHERE id_sku = ? AND id_tenant = ?", [
        claveNueva,
        id_sku,
        id_tenant,
      ]);
    }
    await cx.commit();
  } catch (error) {
    await cx.rollback();
    throw error;
  }

  const stockDespues = await totalStock(cx, id_tenant);
  console.log(`   ✅ ${plan.actualizar.length} clave(s) normalizada(s)`);
  console.log(
    `   stock del tenant: ${stockAntes} → ${stockDespues} ${stockAntes === stockDespues ? "✓ intacto" : "✗ REVISAR"}`
  );
  if (stockAntes !== stockDespues) {
    throw new Error("El stock cambió durante una operación que solo debía tocar attrs_key.");
  }
  return plan;
};

const ejecutar = async () => {
  if (!HOST || !DATABASE || !USER) {
    throw new Error("Falta configurar la conexión MySQL local en el archivo .env.");
  }
  if (!esHostLocal(HOST)) {
    throw new Error("Saneamiento cancelado: esta versión solo está autorizada para MySQL local.");
  }

  const cx = await mysql.createConnection({
    host: HOST, database: DATABASE, user: USER, password: PASSWORD, port: PORT_DB, connectTimeout: 5000,
  });

  try {
    console.log(APLICAR ? "MODO: aplicar cambios" : "MODO: solo reporte (usa --aplicar para escribir)");

    const [tenants] = await cx.query("SELECT DISTINCT id_tenant FROM producto_sku ORDER BY id_tenant");
    const conflictos = [];
    const sinFuente = [];

    for (const { id_tenant } of tenants) {
      const plan = await sanearTenant(cx, id_tenant);
      if (!plan) continue;
      plan.conflictos.forEach((c) => conflictos.push([id_tenant, c.id_producto, c.id_sku, c.claveVieja, c.claveNueva, c.ocupadaPor]));
      plan.sinFuente.forEach((s) => sinFuente.push([id_tenant, s.id_producto, s.id_sku, s.attrs_key, s.motivo, s.detalle ?? ""]));
    }

    // El CSV es el entregable de la parte que NO se puede automatizar: son
    // variantes cuyo color/talla real no consta en ninguna tabla, y alguien
    // que conozca la mercadería tiene que decidir qué son.
    if (sinFuente.length) {
      const destino = escribirCsv(
        "sku_sin_fuente.csv",
        ["id_tenant", "id_producto", "id_sku", "attrs_key", "motivo", "detalle"],
        sinFuente
      );
      console.log(`\n📄 ${sinFuente.length} SKU sin fuente confiable → ${destino}`);
    }
    if (conflictos.length) {
      const destino = escribirCsv(
        "sku_conflictos.csv",
        ["id_tenant", "id_producto", "id_sku", "clave_vieja", "clave_nueva", "ocupada_por"],
        conflictos
      );
      console.log(`⚠️  ${conflictos.length} conflicto(s) de clave → ${destino}`);
    }

    if (!APLICAR) console.log("\nNo se escribió nada. Reejecuta con --aplicar cuando el reporte cuadre.");
  } finally {
    await cx.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:sanear:sku] ${error.message}`);
  process.exitCode = 1;
});
