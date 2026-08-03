import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * EAN-13 por SKU, en paralelo al código propio (`producto_sku.cod_barras`,
 * alfanumérico, no es un EAN-13 válido). Este es el pensado para imprimir en
 * etiquetas y leerse con cualquier lector de tienda genérico. Ver
 * `src/utils/skuHelper.js#generarEan13` para el algoritmo (prefijo 20, rango
 * GS1 reservado a uso interno de empresa).
 *
 * Backfill idempotente: solo toca SKUs con `ean13 IS NULL`, así que correrla
 * de nuevo después de que el código ya esté cableado en la creación de SKUs
 * no reescribe nada.
 *
 * Uso: npm run db:migrate:ean13
 */

const HOSTS_LOCALES = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"]);
const esHostLocal = (host) => HOSTS_LOCALES.has(String(host).trim().toLowerCase());

const existeColumna = async (cx, tabla, columna) => {
  const [filas] = await cx.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [DATABASE, tabla, columna]
  );
  return filas.length > 0;
};

const existeIndice = async (cx, tabla, nombre) => {
  const [filas] = await cx.query(
    `SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [DATABASE, tabla, nombre]
  );
  return filas.length > 0;
};

const ejecutar = async () => {
  if (!HOST || !DATABASE || !USER) {
    throw new Error("Falta configurar la conexión MySQL local en el archivo .env.");
  }
  if (!esHostLocal(HOST) && !process.env.ALLOW_REMOTE_MIGRATE) {
    throw new Error("Migración cancelada: esta versión solo está autorizada para MySQL local (o establece ALLOW_REMOTE_MIGRATE=1).");
  }

  const cx = await mysql.createConnection({
    host: HOST, database: DATABASE, user: USER, password: PASSWORD, port: PORT_DB, connectTimeout: 5000,
  });

  try {
    if (await existeColumna(cx, "producto_sku", "ean13")) {
      console.log("[omitido] producto_sku.ean13 ya existe.");
    } else {
      await cx.query("ALTER TABLE producto_sku ADD COLUMN ean13 CHAR(13) NULL COMMENT 'EAN-13 válido para impresión/escaneo; prefijo 20 = uso interno GS1'");
      console.log("[creado] producto_sku.ean13.");
    }

    // Backfill: se calcula en JS (no en SQL) para reusar el MISMO algoritmo
    // que `generarEan13()`, columna por columna, en vez de mantener dos
    // implementaciones del checksum que se puedan desincronizar.
    const [pendientes] = await cx.query("SELECT id_sku FROM producto_sku WHERE ean13 IS NULL");
    if (pendientes.length === 0) {
      console.log("[backfill] 0 SKU(s) pendientes.");
    } else {
      const { generarEan13 } = await import("../../src/utils/skuHelper.js");
      for (const { id_sku } of pendientes) {
        await cx.query("UPDATE producto_sku SET ean13 = ? WHERE id_sku = ?", [generarEan13(id_sku), id_sku]);
      }
      console.log(`[backfill] ${pendientes.length} SKU(s) actualizados con EAN-13.`);
    }

    if (await existeIndice(cx, "producto_sku", "uq_sku_ean13")) {
      console.log("[omitido] índice uq_sku_ean13 ya existe.");
    } else {
      await cx.query("ALTER TABLE producto_sku ADD UNIQUE KEY uq_sku_ean13 (ean13)");
      console.log("[creado] índice uq_sku_ean13.");
    }
  } finally {
    await cx.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:migrate:ean13] ${error.message}`);
  process.exitCode = 1;
});
