/**
 * Migra schemas oleadas B–E + Recluta.
 * Uso: node src/scripts/migrate_platform_waves_b_e.js
 */
import mysql from "mysql2/promise";
import {
  HOST,
  USER,
  PASSWORD,
  PORT_DB,
  TALLER_DATABASE,
  PREVENTA_DATABASE,
  CRM_DATABASE,
  ENVIOS_DATABASE,
  WMS_DATABASE,
  DESPACHO_DATABASE,
  TAXI_DATABASE,
  DELIVERY_DATABASE,
  FLOTAS_DATABASE,
  CAMPO_DATABASE,
  ACADEMIA_DATABASE,
  AGENDA_DATABASE,
  MANTENIMIENTO_DATABASE,
  RECLUTA_DATABASE,
} from "../config.js";
import { WAVE_SCHEMAS } from "./schemas/schemas_waves_b_e.sql.js";

const DBS = [
  TALLER_DATABASE,
  PREVENTA_DATABASE,
  CRM_DATABASE,
  ENVIOS_DATABASE,
  WMS_DATABASE,
  DESPACHO_DATABASE,
  TAXI_DATABASE,
  DELIVERY_DATABASE,
  FLOTAS_DATABASE,
  CAMPO_DATABASE,
  ACADEMIA_DATABASE,
  AGENDA_DATABASE,
  MANTENIMIENTO_DATABASE,
  RECLUTA_DATABASE,
];

async function main() {
  const root = await mysql.createConnection({
    host: HOST,
    user: USER,
    password: PASSWORD,
    port: Number(PORT_DB) || 3306,
  });
  try {
    for (const name of DBS) {
      await root.query(
        `CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      console.log(`OK database ${name}`);
    }
  } finally {
    await root.end();
  }

  for (const name of DBS) {
    const sql = WAVE_SCHEMAS[name];
    if (!sql) {
      console.warn(`Sin schema para ${name}`);
      continue;
    }
    const conn = await mysql.createConnection({
      host: HOST,
      user: USER,
      password: PASSWORD,
      port: Number(PORT_DB) || 3306,
      database: name,
      multipleStatements: true,
    });
    try {
      await conn.query(sql);
      console.log(`OK schema ${name}`);
    } finally {
      await conn.end();
    }
  }
  console.log("Oleadas B–E + Recluta listas.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
