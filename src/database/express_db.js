import mysql from "mysql2/promise";
import { HOST, EXPRESS_DATABASE, USER, PASSWORD, PORT_DB, DB_SSL_CA } from "../config.js";

// Process SSL certificate (reused logic)
const sslCA =
    DB_SSL_CA
        ? Buffer.from(
            DB_SSL_CA
                .replace(/^"+|"+$/g, "")
                .replace(/\\n/g, "\n"),
            "utf-8"
        )
        : undefined;

const pool = mysql.createPool({
    host: HOST,
    database: EXPRESS_DATABASE,
    user: USER,
    password: PASSWORD,
    port: PORT_DB,
    waitForConnections: true,
    connectionLimit: 50, // Smaller limit for side database
    queueLimit: 0,
    ...(sslCA && {
        ssl: { ca: sslCA }
    })
});

const getExpressConnection = async () => {
    try {
        const connection = await pool.getConnection();
        return connection;
    } catch (error) {
        console.error("Error connecting to the Express database:", error);
        throw error;
    }
};

export { getExpressConnection };
