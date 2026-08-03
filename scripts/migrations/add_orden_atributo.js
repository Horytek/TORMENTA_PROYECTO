import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * Orden de despliegue de atributos y sus valores (Configuración > Variantes,
 * y el selector de valores en Gestor de Contenidos). Antes se listaban por
 * id de inserción; ahora es un campo editable con botones subir/bajar.
 *
 * Backfill: `orden = id` conserva el orden actual visualmente (nada cambia
 * hasta que alguien reordene a mano).
 *
 * Uso: npm run db:migrate:orden-atributo
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

const agregarOrden = async (cx, tabla, columnaId) => {
  if (await existeColumna(cx, tabla, "orden")) {
    console.log(`[omitido] ${tabla}.orden ya existe.`);
    return;
  }
  await cx.query(`ALTER TABLE ${tabla} ADD COLUMN orden INT NOT NULL DEFAULT 0`);
  await cx.query(`UPDATE ${tabla} SET orden = ${columnaId}`);
  console.log(`[creado] ${tabla}.orden (backfill = ${columnaId}).`);
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
    await agregarOrden(cx, "atributo", "id_atributo");
    await agregarOrden(cx, "atributo_valor", "id_valor");
  } finally {
    await cx.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:migrate:orden-atributo] ${error.message}`);
  process.exitCode = 1;
});
