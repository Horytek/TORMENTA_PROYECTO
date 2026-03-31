import { getConnection } from './src/database/database.js';

async function run() {
    let conn;
    try {
        conn = await getConnection();
        
        // 1. Get all valid attribute IDs
        const [validAttrs] = await conn.query("SELECT id_atributo FROM atributo");
        const validIds = new Set(validAttrs.map(a => String(a.id_atributo)));
        
        console.log(`Found ${validIds.size} valid attributes in the database.`);

        // 2. Fetch all SKUs
        const [skus] = await conn.query("SELECT id_sku, sku, attributes_json, attrs_key FROM producto_sku");
        
        console.log(`Cleaning ${skus.length} SKUs...`);
        let updatedCount = 0;

        for (const row of skus) {
            let changed = false;
            let newSkuName = row.sku;
            let attrsJson = null;
            let newAttrsKey = row.attrs_key || "";
            
            try {
                if (row.attributes_json) attrsJson = JSON.parse(row.attributes_json);
            } catch(e) {}
            
            if (attrsJson) {
                for (const key of Object.keys(attrsJson)) {
                    // If this attribute ID no longer exists in the 'atributo' table
                    if (!validIds.has(key)) {
                        const valName = attrsJson[key];
                        
                        // Default seasons to clean up just in case valName is undefined or weird
                        const termsToRemove = valName ? [valName] : ['Invierno', 'Verano', 'Otoño', 'Primavera', 'Temporada'];
                        
                        for (const term of termsToRemove) {
                            const regex1 = new RegExp(`\\s*-\\s*${term}`, 'gi');
                            const regex2 = new RegExp(`${term}\\s*-\\s*`, 'gi');
                            newSkuName = newSkuName.replace(regex1, '').replace(regex2, '');
                        }
                        
                        delete attrsJson[key];
                        changed = true;
                    }
                }
            }
            
            // Also scrub attrs_key of any invalid IDs
            if (newAttrsKey) {
                const keyParts = newAttrsKey.split("|").filter(part => {
                    const [attrId] = part.split(":");
                    return validIds.has(attrId);
                });
                const rebuildKey = keyParts.join("|");
                if (rebuildKey !== newAttrsKey) {
                    newAttrsKey = rebuildKey;
                    changed = true;
                }
            }

            if (changed) {
                // Update SKU in db
                await conn.query(
                    "UPDATE producto_sku SET sku = ?, attributes_json = ?, attrs_key = ? WHERE id_sku = ?", 
                    [newSkuName, JSON.stringify(attrsJson), newAttrsKey, row.id_sku]
                );
                updatedCount++;
            }
        }
        
        console.log(`Cleaned ${updatedCount} SKUs, removing orphaned attributes.`);

    } catch (err) {
        console.error("Error running script:", err);
    } finally {
        if (conn) conn.release();
        process.exit(0);
    }
}

run();
