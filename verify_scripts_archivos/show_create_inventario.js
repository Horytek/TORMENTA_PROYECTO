import { getConnection } from "../src/database/database.js";

async function inspect() {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.query("SHOW CREATE TABLE inventario");
        console.log(rows[0]['Create Table']);
    } catch (error) {
        console.error("Error inspecting table:", error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

inspect();
