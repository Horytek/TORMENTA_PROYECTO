import { getConnection } from "../database/database.js";

const findTable = async () => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.query("SHOW TABLES LIKE '%sub%'");
        console.log("Tables found:", rows);
    } catch (error) {
        console.error(error);
    } finally {
        if (connection) connection.end();
        process.exit();
    }
};

findTable();
