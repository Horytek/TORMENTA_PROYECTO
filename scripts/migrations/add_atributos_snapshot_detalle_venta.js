import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * Snapshot literal de atributos por línea de venta.
 *
 * `producto_sku.attributes_json` nunca se edita después de crear el SKU, pero
 * `atributo.nombre` / `atributo_valor.valor` sí se pueden renombrar más
 * adelante — sin esta copia, una venta vieja mostraría el nombre nuevo en vez
 * del que el cliente realmente vio al comprar. Se llena a partir de esta
 * migración en adelante (`ventas.controller.js`); las ventas anteriores
 * quedan con `NULL`, no se reconstruyen retroactivamente.
 *
 * Formato: `[{ id_atributo, nombre, valor }, ...]`, o `NULL` si la línea no
 * tenía variante elegida (id_sku nulo).
 *
 * Uso: npm run db:migrate:snapshot-venta
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
    if (await existeColumna(cx, "detalle_venta", "atributos_snapshot")) {
      console.log("[omitido] detalle_venta.atributos_snapshot ya existe.");
    } else {
      await cx.query("ALTER TABLE detalle_venta ADD COLUMN atributos_snapshot JSON NULL COMMENT 'Copia literal de los atributos del SKU al momento de vender'");
      console.log("[creado] detalle_venta.atributos_snapshot.");
    }
  } finally {
    await cx.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:migrate:snapshot-venta] ${error.message}`);
  process.exitCode = 1;
});
