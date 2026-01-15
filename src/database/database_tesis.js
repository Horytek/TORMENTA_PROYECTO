import mysql from "mysql2/promise";
import { HOST, TESIS_DATABASE, USER, PASSWORD, PORT_DB, DB_SSL_CA } from "../config.js";

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

// Pool de conexión para tesis_db (eCommerce)
const poolTesis = mysql.createPool({
    host: HOST,
    database: TESIS_DATABASE, // Base de datos del eCommerce
    user: USER,
    password: PASSWORD,
    port: PORT_DB,
    waitForConnections: true,
    connectionLimit: 50,
    queueLimit: 0,
    ...(sslCA && {
        ssl: { ca: sslCA }
    })
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
