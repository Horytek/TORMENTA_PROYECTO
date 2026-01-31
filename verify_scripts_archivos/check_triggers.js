
import { getConnection } from "../src/database/database.js";

async function run() {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.query("SELECT * FROM information_schema.triggers WHERE event_object_table = 'detalle_venta'");
        console.log("Triggers on detalle_venta:");
        rows.forEach(r => console.log(r.TRIGGER_NAME, r.ACTION_STATEMENT));

        const [rows2] = await connection.query("SELECT * FROM information_schema.triggers WHERE event_object_table = 'venta'");
        console.log("Triggers on venta:");
        rows2.forEach(r => console.log(r.TRIGGER_NAME, r.ACTION_STATEMENT));

    } catch (error) {
        console.error(error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

run();
