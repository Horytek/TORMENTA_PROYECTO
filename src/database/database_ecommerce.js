import mysql from "mysql2/promise";
import { HOST, ECOMMERCE_DATABASE, USER, PASSWORD, PORT_DB } from "../config.js";

/**
 * Pool dedicado a db_ecommerce (mismo MySQL que db_tormenta; otra base).
 */
const pool = mysql.createPool({
  host: HOST,
  database: ECOMMERCE_DATABASE,
  user: USER,
  password: PASSWORD,
  port: PORT_DB,
  waitForConnections: true,
  connectionLimit: 50,
  queueLimit: 0,
});

const getEcommerceConnection = async () => {
  try {
    return await pool.getConnection();
  } catch (error) {
    console.error("Error connecting to the Ecommerce database:", error);
    throw error;
  }
};

export { getEcommerceConnection };
