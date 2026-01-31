
import fs from 'fs';
import { getConnection } from "../src/database/database.js";

async function inspect() {
    let connection;
    try {
        connection = await getConnection();
        const [res] = await connection.query("SHOW CREATE TABLE inventario");
        fs.writeFileSync('debug_output.txt', JSON.stringify(res, null, 2));
    } catch (error) {
        console.error("Error inspecting table:", error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

inspect();
