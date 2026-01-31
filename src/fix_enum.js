
import { getConnection } from "./database/database.js";

const runMigration = async () => {
    let connection;
    try {
        connection = await getConnection();
        console.log("Conectado a la base de datos...");

        // Check current columns/structure (optional, but good for debugging)
        // const [desc] = await connection.query("DESCRIBE atributo");
        // console.log(desc);

        // Run ALTER TABLE
        console.log("Actualizando columna tipo_input...");
        await connection.query(`
            ALTER TABLE atributo 
            MODIFY COLUMN tipo_input ENUM('SELECT', 'COLOR', 'BUTTON', 'TEXT', 'MULTI_SELECT', 'CHECKBOX', 'NUMBER', 'DATE') 
            NOT NULL DEFAULT 'SELECT';
        `);

        console.log("✅ Columna actualizada correctamente.");

    } catch (error) {
        console.error("❌ Error actualizando la base de datos:", error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
};

runMigration();
