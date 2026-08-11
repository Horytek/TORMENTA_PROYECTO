/**
 * Crea DATABASE vacías para productos de oleadas B–E (pools listos; schema en su oleada).
 * Uso: node src/scripts/scaffold_product_databases.js
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
} from "../config.js";

const NAMES = [
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
];

async function main() {
  const conn = await mysql.createConnection({
    host: HOST,
    user: USER,
    password: PASSWORD,
    port: Number(PORT_DB) || 3306,
  });
  try {
    for (const name of NAMES) {
      await conn.query(
        `CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      console.log(`OK ${name}`);
    }
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
