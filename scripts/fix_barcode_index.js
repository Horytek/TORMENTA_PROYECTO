
import { getConnection } from '../src/database/database.js';

async function migrateBarcodeIndex() {
    let connection;
    try {
        console.log("Starting migration: Fixing barcode index for multi-tenancy...");
        connection = await getConnection();

        // 1. Check existing indices
        const [indices] = await connection.query(`SHOW INDEX FROM producto WHERE Key_name = 'cod_barras'`);

        // 2. Drop existing global unique index if it exists
        if (indices.length > 0) {
            console.log("Dropping existing global unique index 'cod_barras'...");
            await connection.query(`DROP INDEX cod_barras ON producto`);
            console.log("Dropped.");
        } else {
            console.log("Index 'cod_barras' not found, checking for other unique constraints...");
            // Double check if there's any other unique constraint on cod_barras alone
            // For now, assume if not found by name, we proceed carefully or check column usage
        }

        // 3. Add new composite unique index
        // Check if new index already exists
        const [newIndices] = await connection.query(`SHOW INDEX FROM producto WHERE Key_name = 'idx_cod_barras_tenant'`);

        if (newIndices.length === 0) {
            console.log("Adding new composite unique index 'idx_cod_barras_tenant' (id_tenant + cod_barras)...");
            await connection.query(`CREATE UNIQUE INDEX idx_cod_barras_tenant ON producto (id_tenant, cod_barras)`);
            console.log("Index created successfully.");
        } else {
            console.log("Index 'idx_cod_barras_tenant' already exists. Skipping.");
        }

        console.log("Migration completed successfully.");
        process.exit(0);

    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    } finally {
        if (connection) connection.release();
    }
}

migrateBarcodeIndex();
