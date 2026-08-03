import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * Condiciones comerciales por proveedor: plazo de pago por defecto y línea
 * de crédito. `destinatario` ya modela tanto clientes de guía como
 * proveedores (`ubicacion`); `cliente.limite_credito` ya existe para el lado
 * de clientes — esto es el equivalente para proveedores, reutilizable al
 * generar una orden de compra (fecha de vencimiento sugerida, alerta de
 * línea excedida).
 *
 * Uso: npm run db:migrate:condiciones-proveedor
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
    if (await existeColumna(cx, "destinatario", "plazo_pago_dias")) {
      console.log("[omitido] destinatario.plazo_pago_dias ya existe.");
    } else {
      await cx.query("ALTER TABLE destinatario ADD COLUMN plazo_pago_dias INT NULL COMMENT 'Días de plazo de pago por defecto; NULL = sin plazo configurado'");
      console.log("[creado] destinatario.plazo_pago_dias.");
    }

    if (await existeColumna(cx, "destinatario", "linea_credito")) {
      console.log("[omitido] destinatario.linea_credito ya existe.");
    } else {
      await cx.query("ALTER TABLE destinatario ADD COLUMN linea_credito DECIMAL(12,2) NULL COMMENT 'Línea de crédito otorgada por el proveedor; NULL = sin límite configurado'");
      console.log("[creado] destinatario.linea_credito.");
    }
  } finally {
    await cx.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:migrate:condiciones-proveedor] ${error.message}`);
  process.exitCode = 1;
});
