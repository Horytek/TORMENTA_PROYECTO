
import { getConnection } from "../src/database/database.js";

const listFunciones = async () => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.query("SELECT * FROM funciones");
        console.log(JSON.stringify(rows, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
};

listFunciones();
