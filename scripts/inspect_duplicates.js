
import { getConnection } from "../src/database/database.js";

const inspect = async () => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.query("SELECT * FROM funciones WHERE funcion LIKE '%sucursales%' OR funcion LIKE '%usuarios%'");
        console.log(JSON.stringify(rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
};
inspect();
