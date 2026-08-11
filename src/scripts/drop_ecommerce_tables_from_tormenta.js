/**
 * DROP tablas ecommerce_* huérfanas en db_tormenta tras ETL.
 * Uso: ALLOW_REMOTE_MIGRATE=1 CONFIRM_DROP_ECOMMERCE_TORMENTA=1 node src/scripts/drop_ecommerce_tables_from_tormenta.js
 */
import mysql from "mysql2/promise";
import { DATABASE, ECOMMERCE_DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../config.js";

const ORDER = [
  "ecommerce_orden_detalle",
  "ecommerce_orden",
  "ecommerce_producto_imagen",
  "ecommerce_producto",
  "ecommerce_mp_credenciales",
  "ecommerce_pago_saas",
  "ecommerce_usuario",
  "ecommerce_tienda",
  "ecommerce_plan",
];

async function main() {
  if (!process.env.ALLOW_REMOTE_MIGRATE && !["localhost", "127.0.0.1", "::1"].includes(String(HOST))) {
    throw new Error("Usa ALLOW_REMOTE_MIGRATE=1.");
  }
  if (process.env.CONFIRM_DROP_ECOMMERCE_TORMENTA !== "1") {
    throw new Error("Set CONFIRM_DROP_ECOMMERCE_TORMENTA=1 para confirmar el DROP en db_tormenta.");
  }

  const ecom = await mysql.createConnection({
    host: HOST,
    database: ECOMMERCE_DATABASE,
    user: USER,
    password: PASSWORD,
    port: PORT_DB,
  });
  try {
    const [[t]] = await ecom.query("SELECT COUNT(*) AS c FROM tienda");
    if (Number(t.c) < 1) {
      throw new Error("Abort: db_ecommerce.tienda vacío — no dropear origen.");
    }
  } finally {
    await ecom.end();
  }

  const cx = await mysql.createConnection({
    host: HOST,
    database: DATABASE,
    user: USER,
    password: PASSWORD,
    port: PORT_DB,
  });

  try {
    await cx.query("SET FOREIGN_KEY_CHECKS=0");
    for (const table of ORDER) {
      await cx.query(`DROP TABLE IF EXISTS \`${table}\``);
      console.log(`[drop] ${table}`);
    }
    await cx.query("SET FOREIGN_KEY_CHECKS=1");

    const [left] = await cx.query(
      `SELECT TABLE_NAME AS t FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE 'ecommerce_%'`,
      [DATABASE]
    );
    if (left.length > 0) {
      throw new Error(`Quedan tablas: ${left.map((r) => r.t).join(", ")}`);
    }
    console.log(JSON.stringify({ ok: true, dropped: ORDER.length, residual: 0 }));
  } finally {
    await cx.end();
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exitCode = 1;
});
