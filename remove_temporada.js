import { getConnection } from './src/database/database.js';

async function run() {
    let conn;
    try {
        conn = await getConnection();
        
        // 1. Identify 'Temporada' attributes across all tenants
        const [attrs] = await conn.query("SELECT id_atributo FROM atributo WHERE LOWER(codigo) = 'temporada' OR LOWER(nombre) = 'temporada'");
        const attrIds = attrs.map(a => a.id_atributo);
        
        if (attrIds.length === 0) {
            console.log("No 'temporada' attributes found in the database. Exiting.");
            process.exit(0);
        }
        
        console.log("Temporada attribute IDs to remove:", attrIds);

        // 2. Fetch all SKUs that might contain these attributes
        const [skus] = await conn.query("SELECT id_sku, sku, attributes_json, attrs_key FROM producto_sku");
        
        console.log(`Analyzing ${skus.length} SKUs...`);
        let updatedCount = 0;

        for (const row of skus) {
            let changed = false;
            let newSkuName = row.sku;
            let attrsJson = null;
            let newAttrsKey = row.attrs_key || "";
            
            try {
                if (row.attributes_json) attrsJson = JSON.parse(row.attributes_json);
            } catch(e) {
                console.error("Failed to parse JSON for SKU", row.id_sku);
            }
            
            if (attrsJson) {
                for (const id of attrIds) {
                    if (attrsJson[id]) {
                        const valName = attrsJson[id];
                        // remove " - <valName>" or "<valName> - " from the sku string
                        const regex1 = new RegExp(`\\s*-\\s*${valName}`, 'gi');
                        const regex2 = new RegExp(`${valName}\\s*-\\s*`, 'gi');
                        newSkuName = newSkuName.replace(regex1, '').replace(regex2, '');
                        
                        delete attrsJson[id];
                        changed = true;
                    }
                }
            }

            if (changed) {
                // Remove the id from attrs_key e.g., "1:10|3:12" -> remove "3:12"
                const keyParts = newAttrsKey.split("|").filter(part => {
                    const [attrId] = part.split(":");
                    return !attrIds.includes(parseInt(attrId, 10));
                });
                newAttrsKey = keyParts.join("|");

                // Update SKU in db
                await conn.query(
                    "UPDATE producto_sku SET sku = ?, attributes_json = ?, attrs_key = ? WHERE id_sku = ?", 
                    [newSkuName, JSON.stringify(attrsJson), newAttrsKey, row.id_sku]
                );
                updatedCount++;
            }
        }
        
        console.log(`Updated ${updatedCount} SKUs to remove Temporada data.`);

        // 3. Delete from sku_atributo_valor
        const [del1] = await conn.query("DELETE FROM sku_atributo_valor WHERE id_atributo IN (?)", [attrIds]);
        console.log(`Deleted ${del1.affectedRows} records from sku_atributo_valor`);
        
        // 4. Delete from atributo_valor
        const [del2] = await conn.query("DELETE FROM atributo_valor WHERE id_atributo IN (?)", [attrIds]);
        console.log(`Deleted ${del2.affectedRows} records from atributo_valor`);
        
        // 5. Delete from atributo
        const [del3] = await conn.query("DELETE FROM atributo WHERE id_atributo IN (?)", [attrIds]);
        console.log(`Deleted ${del3.affectedRows} records from atributo`);
        
        console.log("Temporada attribute successfully removed from the entire ERP database.");
    } catch (err) {
        console.error("Error running script:", err);
    } finally {
        if (conn) conn.release();
        process.exit(0);
    }
}

run();
