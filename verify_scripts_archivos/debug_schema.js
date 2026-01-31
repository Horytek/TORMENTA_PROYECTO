
import { getConnection } from "../src/database/database.js";

async function run() {
    let connection;
    try {
        connection = await getConnection();
        const [res] = await connection.query("SHOW CREATE TABLE tenant");
        console.log("Schema:", res[0]['Create Table']);

        const [keys] = await connection.query("SHOW KEYS FROM inventario");
        console.table(keys);

    } catch (e) {
        console.error(e);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}
run();
