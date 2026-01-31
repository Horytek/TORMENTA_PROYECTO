
import { getConnection } from "../../src/database/database.js";

async function run() {
    let connection;
    try {
        console.log("Generating SKUs and Migrating Stock...");
        connection = await getConnection();
        await connection.beginTransaction();

        const [tenants] = await connection.query("SELECT id_tenant, nombre FROM tenant");

        for (const tenant of tenants) {
            const tId = tenant.id_tenant;
            console.log(`Processing Tenant: ${tId}`);

            // 1. Build Attribute Maps (Legacy ID -> New ID/Value)
            // Color
            const [colorMapRows] = await connection.query(`
                SELECT t.id_tonalidad, av.id_valor, av.valor, a.id_atributo
                FROM tonalidad t
                JOIN atributo a ON a.codigo = 'color' AND a.id_tenant = ?
                JOIN atributo_valor av ON av.id_atributo = a.id_atributo AND av.valor COLLATE utf8mb4_general_ci = t.nombre COLLATE utf8mb4_general_ci
                WHERE t.id_tenant = ?
            `, [tId, tId]);

            const colorMap = new Map(); // id_tonalidad -> { id_valor, valor, id_atributo }
            colorMapRows.forEach(r => colorMap.set(r.id_tonalidad, r));

            // Talla
            const [sizeMapRows] = await connection.query(`
                SELECT t.id_talla, av.id_valor, av.valor, a.id_atributo
                FROM talla t
                JOIN atributo a ON a.codigo = 'talla' AND a.id_tenant = ?
                JOIN atributo_valor av ON av.id_atributo = a.id_atributo AND av.valor COLLATE utf8mb4_general_ci = t.nombre COLLATE utf8mb4_general_ci
                WHERE t.id_tenant = ?
            `, [tId, tId]);

            const sizeMap = new Map(); // id_talla -> { id_valor, valor, id_atributo }
            sizeMapRows.forEach(r => sizeMap.set(r.id_talla, r));

            // 2. Fetch all distinct variants from inventario (GROUP BY Variant)
            // Note: We use the `inventario` table's current structure (with possible surrogate key logic or old logic).
            // Robust way: Group by Prod, Ton, Tal.

            const [variants] = await connection.query(`
                SELECT DISTINCT id_producto, id_tonalidad, id_talla
                FROM inventario
                WHERE id_tenant = ?
            `, [tId]);

            console.log(`Found ${variants.length} distinct variants.`);

            for (const v of variants) {
                const attributes = {};
                const attrLinks = []; // { id_atributo, id_valor }
                let skuNameParts = [];

                // Fetch Product Code/Name for SKU generation
                const [prod] = await connection.query("SELECT descripcion, cod_barras, precio FROM producto WHERE id_producto = ?", [v.id_producto]);
                if (prod.length === 0) continue;
                const product = prod[0];
                skuNameParts.push(product.descripcion);

                // Map Attributes
                if (v.id_tonalidad && colorMap.has(v.id_tonalidad)) {
                    const c = colorMap.get(v.id_tonalidad);
                    attributes["Color"] = c.valor;
                    attrLinks.push({ id_atributo: c.id_atributo, id_valor: c.id_valor });
                    skuNameParts.push(c.valor);
                }

                if (v.id_talla && sizeMap.has(v.id_talla)) {
                    const s = sizeMap.get(v.id_talla);
                    attributes["Talla"] = s.valor;
                    attrLinks.push({ id_atributo: s.id_atributo, id_valor: s.id_valor });
                    skuNameParts.push(s.valor);
                }

                // Canonical Key: Sorted by AttrId
                attrLinks.sort((a, b) => a.id_atributo - b.id_atributo);
                const attrs_key = attrLinks.map(l => `${l.id_atributo}:${l.id_valor}`).join('|');
                const sku_name = skuNameParts.join(' - ');

                // 3. Create Producto SKU
                // Check if exists first (unlikely if unique distinct query, but key check is safe)
                const [existingSku] = await connection.query(
                    "SELECT id_sku FROM producto_sku WHERE id_tenant = ? AND id_producto = ? AND attrs_key = ?",
                    [tId, v.id_producto, attrs_key]
                );

                let id_sku;
                if (existingSku.length > 0) {
                    id_sku = existingSku[0].id_sku;
                } else {
                    const [res] = await connection.query(`
                        INSERT INTO producto_sku (id_producto, id_tenant, sku, precio, attributes_json, attrs_key)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `, [v.id_producto, tId, sku_name.substring(0, 64), product.precio, JSON.stringify(attributes), attrs_key]);
                    id_sku = res.insertId;

                    // Link Attributes Strictly
                    for (const link of attrLinks) {
                        await connection.query("INSERT IGNORE INTO sku_atributo_valor (id_sku, id_atributo, id_valor, id_tenant) VALUES (?, ?, ?, ?)",
                            [id_sku, link.id_atributo, link.id_valor, tId]
                        );
                    }
                }

                // 4. Migrate Stock
                // Find rows matching this variant
                // Need to handle NULLs correctly in SQL
                let query = "SELECT id_almacen, stock FROM inventario WHERE id_tenant = ? AND id_producto = ?";
                const params = [tId, v.id_producto];

                if (v.id_tonalidad) { query += " AND id_tonalidad = ?"; params.push(v.id_tonalidad); }
                else { query += " AND id_tonalidad IS NULL"; }

                if (v.id_talla) { query += " AND id_talla = ?"; params.push(v.id_talla); }
                else { query += " AND id_talla IS NULL"; }

                const [stocks] = await connection.query(query, params);

                for (const stockRow of stocks) {
                    await connection.query(`
                        INSERT INTO inventario_stock (id_sku, id_almacen, stock, id_tenant)
                        VALUES (?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE stock = stock + VALUES(stock)
                    `, [id_sku, stockRow.id_almacen, stockRow.stock, tId]);
                }
            }
        }

        await connection.commit();
        console.log("SKU Generation Complete.");

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Migration failed:", error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

run();
