import { getConnection } from './database/database.js';

async function run() {
    try {
        const conn = await getConnection();

        console.log("--- PRODUCTO (LOCAL) ---");
        try {
            const [rows] = await conn.query("SELECT * FROM producto LIMIT 1");
            if (rows.length > 0) {
                console.log("COLUMNS:", Object.keys(rows[0]).join(', '));
            } else {
                const [cols] = await conn.query("DESCRIBE producto");
                console.log("DESCRIBE:", cols.map(c => c.Field).join(', '));
            }
        } catch (e) { console.log("Error querying producto:", e.message); }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
