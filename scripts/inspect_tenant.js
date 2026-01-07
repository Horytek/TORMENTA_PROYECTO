
import { getConnection } from "../src/database/database.js";

const inspect = async () => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.query("DESCRIBE tenant");
        console.log(JSON.stringify(rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
};
inspect();
