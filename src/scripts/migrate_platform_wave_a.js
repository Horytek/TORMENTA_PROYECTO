/**
 * Crea DATABASE + tablas Sync Stock y Mayorista (Oleada A).
 * Uso: node src/scripts/migrate_platform_wave_a.js
 * Requiere MySQL local con las credenciales del .env raíz.
 */
import mysql from "mysql2/promise";
import {
  HOST,
  USER,
  PASSWORD,
  PORT_DB,
  SYNC_DATABASE,
  MAYORISTA_DATABASE,
} from "../config.js";
import { SYNC_SCHEMA_SQL } from "./schemas/schema_sync.sql.js";
import { MAYORISTA_SCHEMA_SQL } from "./schemas/schema_mayorista.sql.js";

async function ensureDatabase(conn, name) {
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  console.log(`OK database ${name}`);
}

async function runSchema(database, sql) {
  const conn = await mysql.createConnection({
    host: HOST,
    user: USER,
    password: PASSWORD,
    port: Number(PORT_DB) || 3306,
    database,
    multipleStatements: true,
  });
  try {
    await conn.query(sql);
    console.log(`OK schema ${database}`);
  } finally {
    await conn.end();
  }
}

async function main() {
  const root = await mysql.createConnection({
    host: HOST,
    user: USER,
    password: PASSWORD,
    port: Number(PORT_DB) || 3306,
    multipleStatements: true,
  });
  try {
    await ensureDatabase(root, SYNC_DATABASE);
    await ensureDatabase(root, MAYORISTA_DATABASE);
  } finally {
    await root.end();
  }

  await runSchema(SYNC_DATABASE, SYNC_SCHEMA_SQL);
  await runSchema(MAYORISTA_DATABASE, MAYORISTA_SCHEMA_SQL);
  console.log("Oleada A: sync + mayorista listos.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
