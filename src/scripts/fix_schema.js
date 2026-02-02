import { getConnection } from "../database/database.js";

const runMigration = async () => {
    let connection;
    try {
        connection = await getConnection();
        console.log("Connected. Altering table...");

        // 1. Update ENUM to include new types
        await connection.query(`
            ALTER TABLE atributo 
            MODIFY COLUMN tipo_input ENUM('TEXT','SELECT','COLOR','SIZE','MULTI_SELECT','CHECKBOX','NUMBER','DATE','BUTTON') 
            NOT NULL DEFAULT 'SELECT'
        `);
        console.log("Schema updated.");

        // 2. Migrate legacy data
        console.log("Migrating data...");
        const [res] = await connection.query("UPDATE atributo SET tipo_input = 'SIZE' WHERE tipo_input = 'BUTTON'");
        console.log(`Data migrated. Changed ${res.affectedRows} rows.`);

    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
};

runMigration();
