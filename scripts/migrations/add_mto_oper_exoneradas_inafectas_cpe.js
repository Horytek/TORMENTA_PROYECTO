import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * `comprobante_electronico` solo persistía `mto_oper_gravadas` — cabecera
 * ciega al resto de categorías del IGV. Con `producto.tipo_afectacion_igv`
 * ya en pie, el mapper puede calcular exoneradas/inafectas por línea; esta
 * migración le da dónde guardarlas. Ambas NOT NULL DEFAULT 0: los CPE ya
 * emitidos (100% gravados hasta hoy) quedan consistentes sin backfill.
 *
 * Uso: npm run db:migrate:cpe-exoneradas-inafectas
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
    if (await existeColumna(cx, "comprobante_electronico", "mto_oper_exoneradas")) {
      console.log("[omitido] comprobante_electronico.mto_oper_exoneradas ya existe.");
    } else {
      await cx.query(
        "ALTER TABLE comprobante_electronico ADD COLUMN mto_oper_exoneradas DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER mto_oper_gravadas"
      );
      console.log("[creado] comprobante_electronico.mto_oper_exoneradas.");
    }

    if (await existeColumna(cx, "comprobante_electronico", "mto_oper_inafectas")) {
      console.log("[omitido] comprobante_electronico.mto_oper_inafectas ya existe.");
    } else {
      await cx.query(
        "ALTER TABLE comprobante_electronico ADD COLUMN mto_oper_inafectas DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER mto_oper_exoneradas"
      );
      console.log("[creado] comprobante_electronico.mto_oper_inafectas.");
    }
  } finally {
    await cx.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:migrate:cpe-exoneradas-inafectas] ${error.message}`);
  process.exitCode = 1;
});
