/**
 * Repara desincronización entre ecom_producto_atributo y producto.attrs_json,
 * y re-sincroniza variantes (desactiva la variante base "—" huérfana).
 *
 * Uso:
 *   node src/scripts/repair_ecom_attrs_sync.js              # dry-run
 *   node src/scripts/repair_ecom_attrs_sync.js --fix        # aplica cambios
 *   node src/scripts/repair_ecom_attrs_sync.js --fix --tienda=3
 */
import { getEcommerceConnection } from "../database/database_ecommerce.js";
import {
  getProductoAtributos,
  syncProductoAttrsJsonFromEcom,
  syncVariantesProducto,
} from "../services/ecommerce/AttributeService.js";

function parseJson(v) {
  if (v == null) return null;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

function vitrinaFromAttrsJson(attrsJson) {
  const attrs = parseJson(attrsJson) || {};
  const raw =
    attrs.atributos && typeof attrs.atributos === "object" ? attrs.atributos : attrs;
  const talla = Array.isArray(raw.talla)
    ? raw.talla.map(String).filter(Boolean).sort()
    : [];
  const tonoRaw = Array.isArray(raw.tonalidad) ? raw.tonalidad : Array.isArray(raw.color) ? raw.color : [];
  const tonalidad = tonoRaw
    .map((t) => {
      if (typeof t === "string") return t;
      if (t && typeof t === "object" && t.nombre) return String(t.nombre);
      return "";
    })
    .filter(Boolean)
    .sort();
  return { talla, tonalidad };
}

function vitrinaFromEcom(defs) {
  const talla = [];
  const tonalidad = [];
  for (const d of defs) {
    if (!d.visible_storefront) continue;
    const vals = (d.valores || []).map((v) => String(v.valor || "").trim()).filter(Boolean).sort();
    const codigo = String(d.codigo || "").toLowerCase();
    const nombre = String(d.nombre || "").toLowerCase();
    if (codigo === "talla" || nombre === "talla") talla.push(...vals);
    else if (
      codigo === "tonalidad" ||
      codigo === "color" ||
      nombre === "tonalidad" ||
      nombre === "color" ||
      d.tipo === "color"
    ) {
      tonalidad.push(...vals);
    }
  }
  return {
    talla: [...new Set(talla)].sort(),
    tonalidad: [...new Set(tonalidad)].sort(),
  };
}

function needsRepair(jsonV, ecomV) {
  return (
    jsonV.talla.join("|") !== ecomV.talla.join("|") ||
    jsonV.tonalidad.join("|") !== ecomV.tonalidad.join("|")
  );
}

async function countInactiveVariantRows(connection, id_tienda, id_producto) {
  const [[row]] = await connection.query(
    `SELECT COUNT(*) AS n
     FROM ecom_inventario i
     JOIN ecom_variante v ON v.id_variante = i.id_variante AND v.id_tienda = i.id_tienda
     WHERE v.id_producto = ? AND v.id_tienda = ? AND v.activo = 0`,
    [id_producto, id_tienda]
  );
  return Number(row?.n || 0);
}

async function main() {
  const fix = process.argv.includes("--fix");
  const tiendaArg = process.argv.find((a) => a.startsWith("--tienda="));
  const id_tienda = tiendaArg ? Number(tiendaArg.split("=")[1]) : null;

  let connection;
  try {
    connection = await getEcommerceConnection();
    let sql = `
      SELECT DISTINCT p.id_tienda, p.id_producto, p.nombre, p.attrs_json
      FROM producto p
      JOIN ecom_producto_atributo pa ON pa.id_producto = p.id_producto AND pa.id_tienda = p.id_tienda
      WHERE p.activo = 1`;
    const params = [];
    if (id_tienda) {
      sql += ` AND p.id_tienda = ?`;
      params.push(id_tienda);
    }
    sql += ` ORDER BY p.id_tienda, p.id_producto`;
    const [products] = await connection.query(sql, params);

    let desync = 0;
    let orphanInv = 0;
    let fixed = 0;

    console.log(`Productos con atributos ecom: ${products.length}`);
    console.log(fix ? "Modo: REPARAR" : "Modo: dry-run (usa --fix para aplicar)");

    for (const p of products) {
      const defs = await getProductoAtributos(connection, p.id_tienda, p.id_producto);
      const jsonV = vitrinaFromAttrsJson(p.attrs_json);
      const ecomV = vitrinaFromEcom(defs);
      const inactiveRows = await countInactiveVariantRows(connection, p.id_tienda, p.id_producto);
      const outOfSync = needsRepair(jsonV, ecomV);

      if (outOfSync) desync += 1;
      if (inactiveRows > 0) orphanInv += 1;

      if (!outOfSync && inactiveRows === 0) continue;

      console.log(
        `\n• [tienda ${p.id_tienda}] #${p.id_producto} ${p.nombre}` +
          (outOfSync
            ? `\n  attrs_json: talla=[${jsonV.talla.join(",")}] tono=[${jsonV.tonalidad.join(",")}]` +
              `\n  ecom_*:     talla=[${ecomV.talla.join(",")}] tono=[${ecomV.tonalidad.join(",")}]`
            : "") +
          (inactiveRows > 0 ? `\n  filas inventario en variantes inactivas: ${inactiveRows}` : "")
      );

      if (fix) {
        await connection.beginTransaction();
        try {
          const attrs = await getProductoAtributos(connection, p.id_tienda, p.id_producto);
          const current = parseJson(p.attrs_json) || {};
          const next = { ...current, inventario_atributos: [] };
          await connection.query(
            `UPDATE producto SET attrs_json = ? WHERE id_producto = ? AND id_tienda = ?`,
            [JSON.stringify(next), p.id_producto, p.id_tienda]
          );
          await syncVariantesProducto(connection, p.id_tienda, p.id_producto);
          await syncProductoAttrsJsonFromEcom(connection, p.id_tienda, p.id_producto);
          await connection.commit();
          fixed += 1;
          const [vars] = await connection.query(
            `SELECT COUNT(*) AS n FROM ecom_variante WHERE id_producto=? AND id_tienda=? AND activo=1`,
            [p.id_producto, p.id_tienda]
          );
          console.log(`  → variantes activas tras sync: ${vars[0].n}`);
        } catch (err) {
          await connection.rollback();
          console.error(`  ERROR: ${err.message}`);
        }
      }
    }

    console.log(`\nResumen:`);
    console.log(`  Desincronizados attrs_json: ${desync}`);
    console.log(`  Con inventario en variantes inactivas: ${orphanInv}`);
    if (fix) console.log(`  Reparados: ${fixed}`);
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
