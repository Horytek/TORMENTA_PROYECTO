import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * N° de operación de pagos digitales (Yape/Plin/tarjeta/depósito). `venta`
 * ya guarda `metodo_pago` como string codificado ("YAPE:30,EFECTIVO:20") —
 * se agrega una columna aparte en vez de romper ese formato ya consumido en
 * varios reportes. JSON simple: { "YAPE": "123456", "PLIN": "789012" },
 * solo con los métodos que de verdad capturaron una referencia.
 *
 * Uso: npm run db:migrate:referencia-pago
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
    if (await existeColumna(cx, "venta", "referencia_pago")) {
      console.log("[omitido] venta.referencia_pago ya existe.");
    } else {
      await cx.query("ALTER TABLE venta ADD COLUMN referencia_pago VARCHAR(500) NULL COMMENT 'JSON {metodo: nro_operacion}' AFTER motivo_descuento");
      console.log("[creado] venta.referencia_pago.");
    }
  } finally {
    await cx.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:migrate:referencia-pago] ${error.message}`);
  process.exitCode = 1;
});
