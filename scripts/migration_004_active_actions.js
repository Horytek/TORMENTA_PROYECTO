import { getConnection } from '../src/database/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function addActiveActionsColumn() {
    let connection;
    try {
        connection = await getConnection();
        console.log("Conectado a la base de datos.");

        // 1. Agregar columna active_actions a tabla modulo
        try {
            await connection.query(`
        ALTER TABLE modulo 
        ADD COLUMN active_actions JSON NULL DEFAULT NULL
      `);
            console.log("Columna `active_actions` agregada a `modulo`.");
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log("Columna `active_actions` ya existe en `modulo`.");
            } else {
                throw error;
            }
        }

        // 2. Agregar columna active_actions a tabla submodulos
        try {
            await connection.query(`
        ALTER TABLE submodulos 
        ADD COLUMN active_actions JSON NULL DEFAULT NULL
      `);
            console.log("Columna `active_actions` agregada a `submodulos`.");
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log("Columna `active_actions` ya existe en `submodulos`.");
            } else {
                throw error;
            }
        }

        // 3. (Opcional) Inicializar con valores por defecto si se desea
        // Por ahora dejamos NULL para que la lógica de backend asuma "Todo permitido" o una lista default.
        // O mejor, NULL = All Standard Actions (backward compatibility).

        console.log("Migración completada con éxito.");

    } catch (error) {
        console.error("Error durante la migración:", error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

addActiveActionsColumn();
