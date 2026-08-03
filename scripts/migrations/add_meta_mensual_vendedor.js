import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * `vendedor.meta_mensual` — objetivo de venta configurable; NULL = sin meta
 * (no se calcula ningún avance, no rompe nada existente). Comparable contra
 * `getComisiones` cuando el rango de fechas cubre un mes calendario completo.
 */

const HOSTS_LOCALES = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"]);
const esHostLocal = (host) => HOSTS_LOCALES.has(String(host).trim().toLowerCase());

const main = async () => {
  if (!esHostLocal(HOST) && !process.env.ALLOW_REMOTE_MIGRATE) {
    console.error(`Abortado: HOST="${HOST}" no es local. Usa ALLOW_REMOTE_MIGRATE=1 para permitir ejecuciones remotas.`);
    process.exit(1);
  }

  const cx = await mysql.createConnection({
    host: HOST, user: USER, password: PASSWORD, database: DATABASE, port: PORT_DB,
  });

  try {
    const [columnas] = await cx.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'vendedor' AND COLUMN_NAME = 'meta_mensual'`,
      [DATABASE]
    );

    if (columnas.length === 0) {
      await cx.query(
        `ALTER TABLE vendedor ADD COLUMN meta_mensual DECIMAL(10,2) NULL DEFAULT NULL
         COMMENT 'Objetivo de venta mensual; NULL = sin meta configurada'`
      );
      console.log("[creado]   vendedor.meta_mensual");
    } else {
      console.log("[omitido]  vendedor.meta_mensual ya existe.");
    }
  } finally {
    await cx.end();
  }
};

main().catch((error) => {
  console.error("Error en la migración:", error.message);
  process.exit(1);
});
