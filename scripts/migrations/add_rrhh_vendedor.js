import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * Campos básicos de RR.HH. que hoy faltan en `vendedor`: cargo/puesto y
 * fecha de ingreso. El modelo de "empleado" en este sistema es literalmente
 * un vendedor (dni, comisión, meta) — esto no lo cambia, solo agrega los dos
 * campos mínimos que un ERP de retail suele llevar por persona.
 *
 * Uso: npm run db:migrate:rrhh-vendedor
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
    if (await existeColumna(cx, "vendedor", "cargo")) {
      console.log("[omitido] vendedor.cargo ya existe.");
    } else {
      await cx.query("ALTER TABLE vendedor ADD COLUMN cargo VARCHAR(100) NULL AFTER apellidos");
      console.log("[creado] vendedor.cargo.");
    }

    if (await existeColumna(cx, "vendedor", "fecha_ingreso")) {
      console.log("[omitido] vendedor.fecha_ingreso ya existe.");
    } else {
      await cx.query("ALTER TABLE vendedor ADD COLUMN fecha_ingreso DATE NULL AFTER cargo");
      console.log("[creado] vendedor.fecha_ingreso.");
    }
  } finally {
    await cx.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:migrate:rrhh-vendedor] ${error.message}`);
  process.exitCode = 1;
});
