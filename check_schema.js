import { getConnection } from "./src/database/database.js";

async function check() {
    try {
        const connection = await getConnection();
        const [rows] = await connection.query("SHOW COLUMNS FROM destinatario");
        console.log("COLUMNS:", rows.map(r => r.Field));
        process.exit(0);
    } catch (e) {
        console.error("ERROR:", e);
        process.exit(1);
    }
}
check();
