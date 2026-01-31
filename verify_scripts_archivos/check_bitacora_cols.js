
import { getConnection } from "../src/database/database.js";

async function run() {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.query("DESCRIBE bitacora_nota");
        console.log("Columns in bitacora_nota:");
        rows.forEach(r => console.log(r.Field));
    } catch (error) {
        console.error(error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

run();
