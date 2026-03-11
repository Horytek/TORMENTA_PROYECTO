import mysql from "mysql2/promise";
import { HOST, TESIS_DATABASE, USER, PASSWORD, PORT_DB } from "../config.js";

// Process SSL certificate (reused logic)
// const sslCA deleted

// Pool de conexión para tesis_db (eCommerce)
const poolTesis = mysql.createPool({
    host: HOST,
    database: TESIS_DATABASE, // Base de datos del eCommerce
    user: USER,
    password: PASSWORD,
    port: PORT_DB,
    waitForConnections: true,
    connectionLimit: 50,
    queueLimit: 0
});

const getTesisConnection = async () => {
    try {
        const connection = await poolTesis.getConnection();
        return connection;
    } catch (error) {
        console.error("Error connecting to tesis_db:", error);
        throw error;
    }
};

export { getTesisConnection };
