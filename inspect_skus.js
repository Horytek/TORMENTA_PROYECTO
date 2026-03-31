import { getConnection } from './src/database/database.js';

async function run() {
    const conn = await getConnection();
    const [rows] = await conn.query('SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = "db_tormenta" AND COLUMN_NAME LIKE "%sku%"');
    console.log("SKU Columns:", rows);
    conn.release();
    process.exit(0);
}
run();
