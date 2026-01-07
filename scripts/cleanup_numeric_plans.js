
import { getConnection } from "../src/database/database.js";

const cleanup = async () => {
    let connection;
    try {
        connection = await getConnection();
        // Set valor = '1' where valor = 'true' AND feature is numeric
        await connection.query(`
            UPDATE plan_funciones pf
            JOIN funciones f ON pf.id_funcion = f.id_funciones
            SET pf.valor = '1'
            WHERE f.tipo_valor = 'numeric' AND pf.valor = 'true'
        `);
        console.log("Cleanup completed.");
    } catch (e) {
        console.error(e);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
};
cleanup();
