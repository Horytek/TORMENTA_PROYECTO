
import { getConnection } from "../../src/database/database.js";

async function run() {
    let connection;
    try {
        console.log("Adding dynamic attributes column...");
        connection = await getConnection();

        const [cols] = await connection.query("SHOW COLUMNS FROM inventario");
        const colNames = cols.map(c => c.Field);

        if (!colNames.includes('atributos')) {
            // Using JSON type for flexibility. If MySQL version is too old, it might fail, 
            // in which case checking version or falling back to TEXT is needed.
            // Assuming modern MySQL/MariaDB.
            await connection.query("ALTER TABLE inventario ADD COLUMN atributos JSON DEFAULT NULL COMMENT 'Dynamic attributes like {voltage:220, material:steel}'");
            console.log("Column 'atributos' added successfully.");
        } else {
            console.log("Column 'atributos' already exists.");
        }

    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

run();
