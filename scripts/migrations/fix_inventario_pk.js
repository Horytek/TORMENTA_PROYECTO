
import { getConnection } from "../../src/database/database.js";

async function run() {
    let connection;
    try {
        console.log("Fixing inventario PK...");
        connection = await getConnection();

        // 1. Ensure columns exist (id_tonalidad, id_talla)
        // We use ADD COLUMN IF NOT EXISTS logic (MySQL 8) or try/catch for older versions, 
        // but simpler to just ALTER IGNORE or check columns.

        const [cols] = await connection.query("SHOW COLUMNS FROM inventario");
        const colNames = cols.map(c => c.Field);

        if (!colNames.includes('id_tonalidad')) {
            console.log("Adding id_tonalidad...");
            await connection.query("ALTER TABLE inventario ADD COLUMN id_tonalidad INT DEFAULT NULL");
        }
        if (!colNames.includes('id_talla')) {
            console.log("Adding id_talla...");
            await connection.query("ALTER TABLE inventario ADD COLUMN id_talla INT DEFAULT NULL");
        }

        // 2. Handle PK Migration
        // We will try to do this in one atomic operation if possible, or handle steps.

        const [keys] = await connection.query("SHOW KEYS FROM inventario WHERE Key_name = 'PRIMARY'");
        let currentPk = keys.length > 0 ? keys[0].Column_name : null;

        if (colNames.includes('id_inventario')) {
            console.log("id_inventario already exists.");
            if (currentPk !== 'id_inventario') {
                console.log("Switching PK to id_inventario...");
                // Drop old, set new
                try {
                    await connection.query("ALTER TABLE inventario DROP PRIMARY KEY");
                } catch (e) { console.log("Drop PK warning:", e.message); }
                await connection.query("ALTER TABLE inventario ADD PRIMARY KEY (id_inventario)");
                await connection.query("ALTER TABLE inventario MODIFY id_inventario INT AUTO_INCREMENT");
            }
        } else {
            console.log("Migrating PK to id_inventario...");
            if (keys.length > 0) {
                // Combined: Drop composite PK, Add Surrogate AutoInc PK
                // Note: MySQL requires AUTO_INCREMENT key to be defined as key immediately.
                console.log("Executing combined ALTER...");
                await connection.query(`
                    ALTER TABLE inventario 
                    DROP PRIMARY KEY,
                    ADD COLUMN id_inventario INT AUTO_INCREMENT PRIMARY KEY FIRST
                 `);
            } else {
                await connection.query("ALTER TABLE inventario ADD COLUMN id_inventario INT AUTO_INCREMENT PRIMARY KEY FIRST");
            }
        }

        console.log("Migration complete.");

        // Verify
        const [res] = await connection.query("SHOW CREATE TABLE inventario");
        console.log("New Schema:", res[0]['Create Table']);

    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

run();
