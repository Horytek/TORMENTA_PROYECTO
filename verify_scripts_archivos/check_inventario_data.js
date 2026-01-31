import { getConnection } from "../src/database/database.js";

async function inspect() {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.query("SELECT id_producto, id_almacen, id_tonalidad, id_talla, stock FROM inventario LIMIT 20");
        console.log(JSON.stringify(rows, null, 2));
    } catch (error) {
        console.error("Error inspecting table:", error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

inspect();
