
import { getConnection } from "./database/database.js";

const resetActions = async () => {
    let connection;
    try {
        console.log("Iniciando reseteo de active_actions...");
        connection = await getConnection();

        // Reset modulo
        const [resultModulo] = await connection.query("UPDATE modulo SET active_actions = NULL");
        console.log(`Módulos actualizados: ${resultModulo.affectedRows}`);

        // Reset submodulos
        const [resultSub] = await connection.query("UPDATE submodulos SET active_actions = NULL");
        console.log(`Submódulos actualizados: ${resultSub.affectedRows}`);

        console.log("¡Reseteo completado con éxito!");
    } catch (error) {
        console.error("Error al resetear acciones:", error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
};

resetActions();
