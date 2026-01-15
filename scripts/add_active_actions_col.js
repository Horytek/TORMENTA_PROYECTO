
import { getConnection } from "../src/database/database.js";

const addColumnIfNotExists = async (connection, table, column, definition) => {
    try {
        const [rows] = await connection.query(`SHOW COLUMNS FROM ${table} LIKE '${column}'`);
        if (rows.length === 0) {
            console.log(`Adding ${column} to ${table}...`);
            await connection.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
            console.log(`Added ${column} to ${table}`);
        } else {
            console.log(`${column} already exists in ${table}`);
        }
    } catch (error) {
        console.error(`Error checking/adding col ${column} in ${table}:`, error);
    }
};

const runMigration = async () => {
    let connection;
    try {
        connection = await getConnection();

        // Add active_actions to modulo
        await addColumnIfNotExists(connection, 'modulo', 'active_actions', 'JSON DEFAULT NULL');

        // Add active_actions to submodulos
        await addColumnIfNotExists(connection, 'submodulos', 'active_actions', 'JSON DEFAULT NULL');

        console.log("Migration completed successfully");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    } finally {
        if (connection) connection.release();
    }
};

runMigration();
