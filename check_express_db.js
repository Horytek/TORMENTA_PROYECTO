import { getExpressConnection } from './src/database/express_db.js';

async function check() {
    try {
        console.log("Checking express_db...");
        const conn = await getExpressConnection();
        const [rows] = await conn.query("SHOW TABLES LIKE 'express_tenants'");
        if (rows.length > 0) {
            console.log("✅ express_tenants table exists.");

            const [cols] = await conn.query("SHOW COLUMNS FROM express_tenants");
            console.log("Columns:", cols.map(c => c.Field).join(", "));
        } else {
            console.log("❌ express_tenants table DOES NOT exist.");
        }
        await conn.release();
    } catch (e) {
        console.error("❌ Error connecting to express_db:", e);
    }
    process.exit();
}

check();
