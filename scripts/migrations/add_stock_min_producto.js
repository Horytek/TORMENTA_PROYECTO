import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * `producto.stock_min` — punto de reorden configurable por producto.
 *
 * NULL (default) = sin configurar → la alerta de "stock mínimo" sigue
 * comportándose como hoy (stock <= 0). Con un valor puesto, la alerta usa
 * ese umbral en vez del cero fijo.
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
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'producto' AND COLUMN_NAME = 'stock_min'`,
      [DATABASE]
    );

    if (columnas.length === 0) {
      await cx.query(
        `ALTER TABLE producto ADD COLUMN stock_min INT NULL DEFAULT NULL
         COMMENT 'Punto de reorden configurable; NULL = alerta usa <=0 (comportamiento actual)'`
      );
      console.log("[creado]   producto.stock_min");
    } else {
      console.log("[omitido]  producto.stock_min ya existe.");
    }
  } finally {
    await cx.end();
  }
};

main().catch((error) => {
  console.error("Error en la migración:", error.message);
  process.exit(1);
});
