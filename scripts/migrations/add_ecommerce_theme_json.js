import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * Añade theme_json a ecommerce_tienda (branding adaptativo Vitrina).
 * Uso: node scripts/migrations/add_ecommerce_theme_json.js
 */

const HOSTS_LOCALES = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"]);
const esHostLocal = (host) => HOSTS_LOCALES.has(String(host).trim().toLowerCase());

const existeColumna = async (cx, tabla, columna) => {
  const [filas] = await cx.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [DATABASE, tabla, columna]
  );
  return filas.length > 0;
};

const ejecutar = async () => {
  if (!HOST || !DATABASE || !USER) {
    throw new Error("Falta configurar la conexión MySQL local en el archivo .env.");
  }
  if (!esHostLocal(HOST) && !process.env.ALLOW_REMOTE_MIGRATE) {
    throw new Error(
      "Migración cancelada: solo MySQL local (o establece ALLOW_REMOTE_MIGRATE=1)."
    );
  }

  const cx = await mysql.createConnection({
    host: HOST,
    database: DATABASE,
    user: USER,
    password: PASSWORD,
    port: PORT_DB,
    connectTimeout: 5000,
  });

  try {
    if (await existeColumna(cx, "ecommerce_tienda", "theme_json")) {
      console.log("[omitido] ecommerce_tienda.theme_json ya existía.");
    } else {
      await cx.query(
        `ALTER TABLE ecommerce_tienda ADD COLUMN theme_json JSON NULL AFTER logo_url`
      );
      console.log("[creado] ecommerce_tienda.theme_json");
    }
  } finally {
    await cx.end();
  }
};

ejecutar().catch((e) => {
  console.error(e.message || e);
  process.exitCode = 1;
});
