import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * Las Guías de Remisión mueven stock real (`restarStockSku`/`descontarPorProducto`
 * en `insertGuiaRemisionAndDetalle`) pero nunca quedaban registradas en
 * `bitacora_nota` — a diferencia de ventas, notas de ingreso/salida, OC y
 * devoluciones, que sí lo hacen. Dos consecuencias:
 *   1. El Kardex no muestra esos movimientos (invisibles en la trazabilidad).
 *   2. Anular una guía no puede revertir el stock con exactitud: cuando el
 *      reparto fue automático entre varios SKU (`descontarPorProducto`), la
 *      única fuente de verdad de qué SKU y cuánto se tocó es la bitácora.
 *
 * Agrega `bitacora_nota.id_guiaremision` (nullable), mismo patrón que
 * `id_nota`/`id_venta` que ya usan notas y ventas respectivamente.
 *
 * Uso: npm run db:migrate:bitacora-guia
 */

const HOSTS_LOCALES = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"]);
const esHostLocal = (host) => HOSTS_LOCALES.has(String(host).trim().toLowerCase());

const columnaExiste = async (cx, tabla, columna) => {
  const [filas] = await cx.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [DATABASE, tabla, columna]
  );
  return filas.length > 0;
};

const main = async () => {
  if (!esHostLocal(HOST) && !process.env.ALLOW_REMOTE_MIGRATE) {
    console.error(`Abortado: HOST="${HOST}" no es local. Usa ALLOW_REMOTE_MIGRATE=1 para permitir ejecuciones remotas.`);
    process.exit(1);
  }

  const cx = await mysql.createConnection({ host: HOST, user: USER, password: PASSWORD, database: DATABASE, port: PORT_DB });
  try {
    if (await columnaExiste(cx, "bitacora_nota", "id_guiaremision")) {
      console.log("[omitido]  bitacora_nota.id_guiaremision ya existe.");
    } else {
      await cx.query(
        `ALTER TABLE bitacora_nota
         ADD COLUMN id_guiaremision INT NULL COMMENT 'Guía de remisión que originó este movimiento; NULL si vino de otro flujo' AFTER id_venta`
      );
      console.log("[creado]   bitacora_nota.id_guiaremision");
    }
  } finally {
    await cx.end();
  }
};

main().catch((error) => {
  console.error("Error en la migración:", error.message);
  process.exit(1);
});
