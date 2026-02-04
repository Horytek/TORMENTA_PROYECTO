
import { getTesisConnection } from "./src/database/database_tesis.js";

async function inspect() {
    try {
        const conn = await getTesisConnection();
        const [rows] = await conn.query("SHOW COLUMNS FROM detalle_compra");
        console.log("Columns in detalle_compra:");
        rows.forEach(r => console.log(r.Field));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

inspect();
