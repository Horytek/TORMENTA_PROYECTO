import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * Tipo de afectación del IGV (catálogo 07 SUNAT) por producto: 10=Gravado,
 * 20=Exonerado, 30=Inafecto. Hoy el builder UBL (`ublInvoiceBuilder.js`) y el
 * mapper (`cpeVentaMapper.js`) fuerzan "10" (Gravado) en cada línea sin
 * excepción — este campo es la fuente de dato real que les falta.
 *
 * Default 'Gravado' explícito (no NULL): así ningún producto existente
 * cambia de comportamiento — todo sigue emitiéndose exactamente igual que
 * hoy hasta que alguien marque un producto como exonerado/inafecto a mano.
 *
 * Uso: npm run db:migrate:tipo-afectacion-igv
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
    if (await existeColumna(cx, "producto", "tipo_afectacion_igv")) {
      console.log("[omitido] producto.tipo_afectacion_igv ya existe.");
    } else {
      await cx.query(
        "ALTER TABLE producto ADD COLUMN tipo_afectacion_igv CHAR(2) NOT NULL DEFAULT '10' COMMENT 'Catálogo 07 SUNAT: 10=Gravado, 20=Exonerado, 30=Inafecto'"
      );
      console.log("[creado] producto.tipo_afectacion_igv.");
    }
  } finally {
    await cx.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:migrate:tipo-afectacion-igv] ${error.message}`);
  process.exitCode = 1;
});
