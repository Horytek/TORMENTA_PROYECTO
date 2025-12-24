import mysql from "mysql2/promise";
import { HOST, DATABASE, USER, PASSWORD, PORT_DB, DB_SSL_CA } from "../config.js";

// Procesar el certificado para eliminar comillas y convertir a Buffer
const sslCA =
  DB_SSL_CA
    ? Buffer.from(
        DB_SSL_CA
          .replace(/^"+|"+$/g, "") // quita comillas al inicio/fin
          .replace(/\\n/g, "\n"),
        "utf-8"
      )
    : undefined;

const pool = mysql.createPool({
  host: HOST,
  database: DATABASE,
  user: USER,
  password: PASSWORD,
  port: PORT_DB,
  waitForConnections: true,
  connectionLimit: 100,
  queueLimit: 0,
  ...(sslCA && {
    ssl: { ca: sslCA }
  })
});

const getConnection = async () => {
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    console.error("Error connecting to the database:", error);
    throw error;
  }
};

const closeInactiveConnections = async () => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute(
      "SELECT Id FROM information_schema.processlist WHERE Command = 'Sleep' AND `TIME` > 30"
    );
    for (const row of rows) {
      const process_id = row.Id;
      await connection.execute(`KILL ${process_id}`);
    }
  } catch (error) {
    console.error("Error closing inactive connections:", error);
  }
};

setInterval(closeInactiveConnections, 60000);

export { getConnection };