import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * `empresa.dashboard_widgets` — qué secciones del dashboard ve el tenant.
 *
 * NULL = sin configurar → se muestran todas (tenants existentes no notan nada).
 * Array JSON de claves (ver DASHBOARD_WIDGETS en negocio.controller.js) una vez
 * que el usuario guarda su preferencia desde Configuración.
 */

const HOSTS_LOCALES = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"]);
const esHostLocal = (host) => HOSTS_LOCALES.has(String(host).trim().toLowerCase());

const main = async () => {
  if (!esHostLocal(HOST)) {
    console.error(`Abortado: HOST="${HOST}" no es local.`);
    process.exit(1);
  }

  const cx = await mysql.createConnection({
    host: HOST, user: USER, password: PASSWORD, database: DATABASE, port: PORT_DB,
  });

  try {
    const [columnas] = await cx.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'empresa' AND COLUMN_NAME = 'dashboard_widgets'`,
      [DATABASE]
    );

    if (columnas.length === 0) {
      await cx.query(
        `ALTER TABLE empresa ADD COLUMN dashboard_widgets JSON NULL DEFAULT NULL
         COMMENT 'Secciones visibles del dashboard; NULL = todas (default)'`
      );
      console.log("[creado]   empresa.dashboard_widgets");
    } else {
      console.log("[omitido]  empresa.dashboard_widgets ya existe.");
    }
  } finally {
    await cx.end();
  }
};

main().catch((error) => {
  console.error("Error en la migración:", error.message);
  process.exit(1);
});
