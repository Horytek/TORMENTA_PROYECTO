import mysql from "mysql2/promise";
import { HOST, USER, PASSWORD, PORT_DB } from "../config.js";

/**
 * Factory de pools MySQL por producto (una DATABASE distinta por dominio).
 * Mismo host/user/pass; distinto `database`.
 */
export function createProductPool(databaseName, label = databaseName) {
  if (!databaseName) {
    throw new Error(`createProductPool: databaseName requerido (${label})`);
  }
  const pool = mysql.createPool({
    host: HOST,
    database: databaseName,
    user: USER,
    password: PASSWORD,
    port: PORT_DB,
    waitForConnections: true,
    connectionLimit: 40,
    queueLimit: 0,
  });

  const getConnection = async () => {
    try {
      return await pool.getConnection();
    } catch (error) {
      console.error(`Error connecting to ${label} database (${databaseName}):`, error.message);
      throw error;
    }
  };

  return { pool, getConnection };
}
