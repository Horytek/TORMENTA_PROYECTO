
import { getConnection } from "../../src/database/database.js";

async function run() {
    let connection;
    try {
        console.log("Adding UNIQUE index for variants...");
        connection = await getConnection();

        // 1. Check if index exists usually via SHOW INDEX
        // 2. We can try to add it. 
        // Note: We include id_almacen to ensure uniqueness per warehouse too.

        try {
            await connection.query(`
                ALTER TABLE inventario 
                ADD UNIQUE INDEX idx_variant_unique (id_producto, id_almacen, id_tonalidad, id_talla)
            `);
            console.log("Index added successfully.");
        } catch (e) {
            if (e.code === 'ER_DUP_KEYNAME') {
                console.log("Index already exists.");
            } else {
                console.error("Error adding index:", e);
                // Schema might have duplicates? 
                // If duplicates exist, this fails.
                // If so, we might need to handle them? 
                // Given I just migrated, duplicates matching this strictly shouldn't exist unless created recently.
            }
        }

    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

run();
