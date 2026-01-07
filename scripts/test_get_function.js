
import { getConnection } from "../src/database/database.js";

const testGet = async () => {
    let connection;
    try {
        connection = await getConnection();
        // Get a function that we know has a code (e.g. MAX_USERS)
        const [rows] = await connection.query("SELECT * FROM funciones WHERE codigo = 'MAX_USERS'");
        console.log("Found:", JSON.stringify(rows[0], null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
};
testGet();
