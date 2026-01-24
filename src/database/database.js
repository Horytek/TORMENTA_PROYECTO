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
  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.execute(
      "SELECT Id FROM information_schema.processlist WHERE Command = 'Sleep' AND `TIME` > 30"
    );
    for (const row of rows) {
      const process_id = row.Id;
      try {
        // Verificar que la conexión aún existe antes de intentar cerrarla
        await connection.execute(`KILL ${process_id}`);
      } catch (killError) {
        // Ignorar error si la conexión ya fue cerrada (ER_NO_SUCH_THREAD)
        if (killError.code !== 'ER_NO_SUCH_THREAD') {
          console.error(`Error killing process ${process_id}:`, killError.message);
        }
      }
    }
  } catch (error) {
    console.error("Error closing inactive connections:", error.message);
  } finally {
    if (connection) connection.release();
  }
};

setInterval(closeInactiveConnections, 60000);

export { getConnection };