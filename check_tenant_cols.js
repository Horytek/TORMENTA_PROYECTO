import { getConnection } from "./src/database/database.js";

async function showColumns() {
    const connection = await getConnection();
    console.log("Checking columns for 'tenant' table...");
    try {
        const [rows] = await connection.query("SHOW COLUMNS FROM tenant");
        console.log(rows.map(r => r.Field));
    } catch (e) {
        console.log("Error or table not found:", e.message);
    }
    connection.release();
    process.exit();
}

showColumns();
