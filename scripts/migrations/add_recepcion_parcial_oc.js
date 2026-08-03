import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * Recepción parcial de Órdenes de Compra.
 *
 * Hoy `recibirOrden` es todo-o-nada: no hay forma de registrar que llegó
 * la mitad de un pedido. Agrega:
 *   1. `detalle_orden_compra.cantidad_recibida` — cuánto de esa línea ya entró.
 *   2. El estado `partially_received` en `orden_compra.estado`, para distinguir
 *      "recibida a medias" de "recibida completa".
 *
 * Uso: npm run db:migrate:recepcion-parcial
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

const migrar = async (cx) => {
  if (await columnaExiste(cx, "detalle_orden_compra", "cantidad_recibida")) {
    console.log("[omitido]  detalle_orden_compra.cantidad_recibida ya existe.");
  } else {
    await cx.query(
      `ALTER TABLE detalle_orden_compra
       ADD COLUMN cantidad_recibida DECIMAL(12,2) NOT NULL DEFAULT 0
       COMMENT 'Cuánto de esta línea ya se recibió; se compara contra cantidad' AFTER cantidad`
    );
    console.log("[creado]   detalle_orden_compra.cantidad_recibida");
  }

  const [[columna]] = await cx.query(
    `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orden_compra' AND COLUMN_NAME = 'estado'`,
    [DATABASE]
  );
  if (columna?.COLUMN_TYPE?.includes("partially_received")) {
    console.log("[omitido]  orden_compra.estado ya admite 'partially_received'.");
  } else {
    await cx.query(
      `ALTER TABLE orden_compra
       MODIFY COLUMN estado ENUM('draft','approved','partially_received','received','cancelled')
       NOT NULL DEFAULT 'draft'`
    );
    console.log("[creado]   orden_compra.estado admite 'partially_received'.");
  }
};

const main = async () => {
  if (!esHostLocal(HOST) && !process.env.ALLOW_REMOTE_MIGRATE) {
    console.error(`Abortado: HOST="${HOST}" no es local. Usa ALLOW_REMOTE_MIGRATE=1 para permitir ejecuciones remotas.`);
    process.exit(1);
  }

  const cx = await mysql.createConnection({
    host: HOST, user: USER, password: PASSWORD, database: DATABASE, port: PORT_DB,
  });

  try {
    console.log(`Migrando recepción parcial de OC en ${DATABASE}@${HOST}\n`);
    await migrar(cx);
  } finally {
    await cx.end();
  }
};

main().catch((error) => {
  console.error("Error en la migración:", error.message);
  process.exit(1);
});
