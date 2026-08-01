import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * `producto_sku.cod_barras` nace NULL desde que existe la tabla: ningún
 * INSERT lo llenaba (ver src/utils/skuHelper.js#codigoBarrasSku, ya cableado
 * en los 3 puntos de creación de SKU). Esta migración rellena los SKUs que
 * ya existían antes de ese cambio, componiendo `{producto.cod_barras}-{id_sku}`
 * — igual que el código nuevo — y agrega un UNIQUE defensivo por tenant
 * (MySQL permite múltiples NULL en un UNIQUE, así que los SKUs sin código de
 * producto padre no bloquean nada).
 *
 * Uso: npm run db:migrate:cod-barras-sku
 */

const HOSTS_LOCALES = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"]);
const esHostLocal = (host) => HOSTS_LOCALES.has(String(host).trim().toLowerCase());

const existeIndice = async (connection, tabla, nombre) => {
  const [filas] = await connection.query(
    `SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [DATABASE, tabla, nombre]
  );
  return filas.length > 0;
};

const backfillCodBarras = async (connection) => {
  const [result] = await connection.query(`
    UPDATE producto_sku sku
    INNER JOIN producto p ON p.id_producto = sku.id_producto AND p.id_tenant = sku.id_tenant
    SET sku.cod_barras = CONCAT(p.cod_barras, '-', sku.id_sku)
    WHERE sku.cod_barras IS NULL AND p.cod_barras IS NOT NULL
  `);
  console.log(`[backfill] ${result.affectedRows} SKU(s) actualizados con código de barras derivado del producto padre.`);
};

const crearIndiceUnico = async (connection) => {
  if (await existeIndice(connection, "producto_sku", "uq_sku_cod_barras_tenant")) {
    console.log("[omitido] índice uq_sku_cod_barras_tenant ya existe.");
    return;
  }
  await connection.query(
    "ALTER TABLE producto_sku ADD UNIQUE KEY uq_sku_cod_barras_tenant (id_tenant, cod_barras)"
  );
  console.log("[creado] índice uq_sku_cod_barras_tenant (id_tenant, cod_barras).");
};

const ejecutar = async () => {
  if (!HOST || !DATABASE || !USER) {
    throw new Error("Falta configurar la conexión MySQL local en el archivo .env.");
  }
  if (!esHostLocal(HOST) && !process.env.ALLOW_REMOTE_MIGRATE) {
    throw new Error("Migración cancelada: esta versión solo está autorizada para MySQL local (o establece ALLOW_REMOTE_MIGRATE=1).");
  }

  const connection = await mysql.createConnection({
    host: HOST, database: DATABASE, user: USER, password: PASSWORD, port: PORT_DB, connectTimeout: 5000,
  });

  try {
    await backfillCodBarras(connection);
    await crearIndiceUnico(connection);
  } finally {
    await connection.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:migrate:cod-barras-sku] ${error.message}`);
  process.exitCode = 1;
});
