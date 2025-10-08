import mysql from "mysql2/promise";
import { HOST, DATABASE, USER, PASSWORD, PORT_DB } from "../config.js";

// Crear un pool de conexiones
const pool = mysql.createPool({
    host: HOST,
    database: DATABASE,
    user: USER,
    password: PASSWORD,
    port: PORT_DB,
    waitForConnections: true,
    connectionLimit: 100, // Límite de conexiones simultáneas
    queueLimit: 0 // Sin límite de cola para conexiones
});

// Obtener una conexión desde el pool
const getConnection = async () => {
    try {
        const connection = await pool.getConnection();
        localStorage.setItem("dbConnection exitosa", JSON.stringify(connection));
        return connection;
    } catch (error) {
        console.error("Error connecting to the database:", error);
        throw error;
    }
};

// Cerrar conexiones inactivas
const closeInactiveConnections = async () => {
    try {
        const connection = await getConnection();

        const [rows] = await connection.execute(
            "SELECT Id FROM information_schema.processlist WHERE Command = 'Sleep' AND `TIME` > 30"
        );

        for (const row of rows) {
            const process_id = row.Id;
            // Matar las conexiones inactivas
            await connection.execute(`KILL ${process_id}`);
        }

        //console.log("Inactive connections closed.");
    } catch (error) {
        console.error("Error closing inactive connections:", error);
    }
};

// Ejecutar el proceso cada 30 segundos
setInterval(closeInactiveConnections, 60000); // 60 segundos en milisegundos

export { getConnection};
