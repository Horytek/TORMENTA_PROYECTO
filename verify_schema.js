import { getExpressConnection } from "./src/database/express_db.js";
import fs from 'fs';

async function run() {
    try {
        const connection = await getExpressConnection();
        const [rows] = await connection.query("DESCRIBE express_tenants");
        fs.writeFileSync('schema_log.json', JSON.stringify(rows, null, 2));
        connection.release();
    } catch (e) {
        console.error(e);
        fs.writeFileSync('schema_log.json', JSON.stringify({ error: e.message }));
    }
    process.exit();
}

run();
