import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * `venta.descuento_global` existe pero nadie registra POR QUÉ se aplicó un
 * descuento ni con qué autorización — hueco típico de fuga de margen en
 * retail. Agrega `motivo_descuento`, que el backend exige cuando el
 * descuento es mayor a 0 (ver ventas.controller.js#createVentaInternal).
 *
 * Uso: npm run db:migrate:motivo-descuento
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
    if (await existeColumna(cx, "venta", "motivo_descuento")) {
      console.log("[omitido] venta.motivo_descuento ya existe.");
    } else {
      await cx.query("ALTER TABLE venta ADD COLUMN motivo_descuento VARCHAR(255) NULL AFTER descuento_global");
      console.log("[creado] venta.motivo_descuento.");
    }
  } finally {
    await cx.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:migrate:motivo-descuento] ${error.message}`);
  process.exitCode = 1;
});
