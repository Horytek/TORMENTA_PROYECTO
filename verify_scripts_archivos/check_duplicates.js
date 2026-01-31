import { getConnection } from "../src/database/database.js";

async function inspect() {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.query(`
            SELECT id_producto, id_almacen, COUNT(*) as count 
            FROM inventario 
            GROUP BY id_producto, id_almacen 
            HAVING count > 1
        `);
        console.log("Duplicates found (Product + Almacen): " + rows.length);
        if (rows.length > 0) {
            console.log(JSON.stringify(rows.slice(0, 5), null, 2));
        }
    } catch (error) {
        console.error("Error inspecting table:", error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

inspect();
