import { getConnection } from "./src/database/database.js";

async function showColumns() {
    const connection = await getConnection();
    console.log("Checking columns for 'empresa' table...");
    const [rows] = await connection.query("SHOW COLUMNS FROM empresa");
    console.log(rows.map(r => r.Field));
    connection.release();
    process.exit();
}

showColumns();
