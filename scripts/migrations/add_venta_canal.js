/**
 * Añade venta.canal (pos | tienda_web). Idempotente.
 * Uso: npm run db:migrate:venta-canal
 * Remoto: ALLOW_REMOTE_MIGRATE=1 npm run db:migrate:venta-canal
 */
import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

const HOSTS_LOCALES = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"]);
const esHostLocal = (host) => HOSTS_LOCALES.has(String(host).trim().toLowerCase());

async function main() {
  if (!esHostLocal(HOST) && !process.env.ALLOW_REMOTE_MIGRATE) {
    console.error(`Abortado: HOST="${HOST}" no es local. Usa ALLOW_REMOTE_MIGRATE=1.`);
    process.exit(1);
  }

  const cx = await mysql.createConnection({
    host: HOST,
    user: USER,
    password: PASSWORD,
    database: DATABASE,
    port: PORT_DB,
  });

  try {
    const [cols] = await cx.query(
      `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'venta' AND COLUMN_NAME = 'canal'`
    );
    if (Number(cols[0].n) > 0) {
      console.log("venta.canal ya existe — backfill por observación");
      await cx.query(
        `UPDATE venta SET canal = 'tienda_web'
         WHERE (canal IS NULL OR canal = 'pos')
           AND observacion LIKE 'Tienda web %'`
      );
      console.log("OK: backfill listo");
      return;
    }
    await cx.query(
      `ALTER TABLE venta
       ADD COLUMN canal VARCHAR(32) NULL DEFAULT 'pos'
       COMMENT 'pos | tienda_web' AFTER metodo_pago`
    );
    await cx.query(
      `UPDATE venta SET canal = 'tienda_web'
       WHERE (canal IS NULL OR canal = 'pos')
         AND observacion LIKE 'Tienda web %'`
    );
    console.log("OK: venta.canal creada");
  } finally {
    await cx.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
