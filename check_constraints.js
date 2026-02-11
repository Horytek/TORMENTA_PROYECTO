
import { getConnection } from './src/database/database.js';

async function checkConstraints() {
    try {
        const connection = await getConnection();

        console.log("--- PRODUCTO INDICES (VERIFICATION) ---");
        const [idxs] = await connection.query(`
            SELECT INDEX_NAME, COLUMN_NAME, SEQ_IN_INDEX, NON_UNIQUE
            FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'producto'
            ORDER BY INDEX_NAME, SEQ_IN_INDEX
        `);
        console.log(JSON.stringify(idxs.filter(i => i.COLUMN_NAME === 'cod_barras' || i.INDEX_NAME.includes('tenant')), null, 2));

        console.log("--- PRODUCTO_SKU INDICES (CHECK) ---");
        const [idxsSku] = await connection.query(`
            SELECT INDEX_NAME, COLUMN_NAME, SEQ_IN_INDEX, NON_UNIQUE
            FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'producto_sku'
            ORDER BY INDEX_NAME, SEQ_IN_INDEX
        `);
        // Filter to see what makes up the unique keys
        console.log(JSON.stringify(idxsSku.filter(i => i.NON_UNIQUE === 0), null, 2));

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkConstraints();
