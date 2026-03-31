import { getConnection } from './src/database/database.js';

async function run() {
    let conn;
    try {
        conn = await getConnection();
        
        // 1. Fetch all SKUs
        const [skus] = await conn.query("SELECT id_sku, sku, attributes_json, attrs_key FROM producto_sku");
        
        let updatedCount = 0;

        for (const row of skus) {
            let changed = false;
            let newSkuName = row.sku || "";
                        
            const termsToRemove = ['Invierno', 'Verano', 'Otoño', 'Primavera', 'Temporada'];
            
            for (const term of termsToRemove) {
                const regex1 = new RegExp(`\\s*-\\s*${term}`, 'gi');
                const regex2 = new RegExp(`${term}\\s*-\\s*`, 'gi');
                const prev = newSkuName;
                newSkuName = newSkuName.replace(regex1, '').replace(regex2, '');
                if (prev !== newSkuName) changed = true;
            }
            
            if (changed) {
                // Update SKU in db
                await conn.query(
                    "UPDATE producto_sku SET sku = ? WHERE id_sku = ?", 
                    [newSkuName, row.id_sku]
                );
                updatedCount++;
            }
        }
        
        console.log(`Force cleaned ${updatedCount} SKUs from season text strings.`);

    } catch (err) {
        console.error("Error running script:", err);
    } finally {
        if (conn) conn.release();
        process.exit(0);
    }
}

run();
