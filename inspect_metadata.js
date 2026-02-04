
import { getTesisConnection } from "./src/database/database_tesis.js";

async function inspectContent() {
    try {
        const conn = await getTesisConnection();
        const [rows] = await conn.query("SELECT metadata FROM detalle_compra WHERE metadata IS NOT NULL LIMIT 5");
        console.log("Metadata samples:");
        rows.forEach(r => console.log(JSON.stringify(r.metadata)));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

inspectContent();
