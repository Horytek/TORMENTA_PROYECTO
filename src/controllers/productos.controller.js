import { getConnection } from "./../database/database.js";
import { logProductos } from "../utils/logActions.js";

// Cache compartido (mismo que los demás)
const queryCache = new Map();
const CACHE_TTL = 60000; // 1 minuto

// Limpiar caché periódicamente
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of queryCache.entries()) {
        if (now - value.timestamp > CACHE_TTL * 2) {
            queryCache.delete(key);
        }
    }
}, CACHE_TTL * 2);

const getProductos = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        const page = Math.max(parseInt(req.query.page ?? '1', 10) || 1, 1);
        const rawLimit = Math.max(parseInt(req.query.limit ?? '100', 10) || 100, 1);
        const limit = Math.min(rawLimit, 200);
        const offset = (page - 1) * limit;

        const allowedSort = {
            id_producto: 'PR.id_producto',
            descripcion: 'PR.descripcion',
            precio: 'PR.precio',
            estado: 'PR.estado_producto'
        };
        const sortBy = allowedSort[req.query.sortBy] || allowedSort.id_producto;
        const sortDir = (String(req.query.sortDir || 'DESC').toUpperCase() === 'ASC') ? 'ASC' : 'DESC';

        const {
            id_marca,
            id_subcategoria,
            id_categoria,
            estado,
            descripcion,
            id_producto,
            cod_barras
        } = req.query;

        const whereClauses = ['PR.id_tenant = ?'];
        const params = [req.id_tenant];

        if (id_marca) { whereClauses.push('PR.id_marca = ?'); params.push(id_marca); }
        if (id_subcategoria) { whereClauses.push('PR.id_subcategoria = ?'); params.push(id_subcategoria); }
        if (id_categoria) { whereClauses.push('cat.id_categoria = ?'); params.push(id_categoria); }
        if (typeof estado !== 'undefined' && estado !== '') { whereClauses.push('PR.estado_producto = ?'); params.push(estado); }
        if (descripcion) { whereClauses.push('PR.descripcion = ?'); params.push(descripcion); }
        if (id_producto) { whereClauses.push('PR.id_producto = ?'); params.push(id_producto); }
        if (cod_barras) { whereClauses.push('PR.cod_barras = ?'); params.push(cod_barras); }

        const whereSQL = `WHERE ${whereClauses.join(' AND ')}`;

        const [result] = await connection.query(
            `
            SELECT PR.id_producto, PR.descripcion,
                   CA.nom_subcat, MA.nom_marca, PR.undm,
                   CAST(PR.precio AS DECIMAL(10, 2)) AS precio, PR.cod_barras,
                   PR.estado_producto AS estado, PR.id_marca, PR.id_subcategoria,
                   cat.id_categoria,
                   SUM(COALESCE(INV.stock, 0)) AS stock_total
            FROM producto PR
            INNER JOIN marca MA ON MA.id_marca = PR.id_marca
            INNER JOIN sub_categoria CA ON CA.id_subcategoria = PR.id_subcategoria
            INNER JOIN categoria cat ON cat.id_categoria = CA.id_categoria
            LEFT JOIN producto_sku SKU ON SKU.id_producto = PR.id_producto
            LEFT JOIN inventario_stock INV ON INV.id_sku = SKU.id_sku
            ${whereSQL}
            GROUP BY PR.id_producto, PR.descripcion, CA.nom_subcat, MA.nom_marca, PR.undm, PR.precio, PR.cod_barras, PR.estado_producto, PR.id_marca, PR.id_subcategoria, cat.id_categoria
            ORDER BY ${sortBy} ${sortDir}
            LIMIT ? OFFSET ?
            `,
            [...params, limit, offset]
        );

        res.json({ code: 1, data: result, message: "Productos listados" });
    } catch (error) {
        console.error('Error en getProductos:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const getUltimoIdProducto = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(`
                SELECT MAX(id_producto+1) AS ultimo_id FROM producto WHERE id_tenant = ?;
            `, [req.id_tenant]);
        res.json({ code: 1, data: result });
    } catch (error) {
        console.error('Error en getUltimoIdProducto:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const getProducto = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();
        const [result] = await connection.query(`
                SELECT id_producto, id_marca, SC.id_categoria, PR.id_subcategoria, descripcion, precio, cod_barras, undm, estado_producto
                FROM producto PR
                INNER JOIN sub_categoria SC ON PR.id_subcategoria = SC.id_subcategoria
                WHERE PR.id_producto = ? AND PR.id_tenant = ?
                LIMIT 1`, [id, req.id_tenant]);

        if (result.length === 0) {
            return res.status(404).json({ data: result, message: "Producto no encontrado" });
        }

        res.json({ code: 1, data: result, message: "Producto encontrado" });
    } catch (error) {
        console.error('Error en getProducto:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const addProducto = async (req, res) => {
    let connection;
    try {
        const { id_marca, id_subcategoria, descripcion, undm, precio, cod_barras, estado_producto } = req.body;

        if (id_marca === undefined || id_subcategoria === undefined || descripcion === undefined || undm === undefined || id_subcategoria === undefined || estado_producto === undefined || precio === undefined) {
            res.status(400).json({ message: "Bad Request. Please fill all field." });
        }

        const producto = { id_marca, id_subcategoria, descripcion, undm, precio, cod_barras, estado_producto, id_tenant: req.id_tenant };
        connection = await getConnection();
        const [result] = await connection.query("INSERT INTO producto SET ? ", producto);

        // Limpiar caché
        queryCache.clear();

        res.json({ code: 1, id_producto: result.insertId, message: "Producto añadido" });
    } catch (error) {
        console.error('Error en addProducto:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const updateProducto = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { id_marca, id_subcategoria, descripcion, undm, precio, cod_barras, estado_producto } = req.body;

        if (id_marca === undefined || id_subcategoria === undefined || descripcion === undefined || undm === undefined || id_subcategoria === undefined || estado_producto === undefined || precio === undefined) {
            res.status(400).json({ message: "Bad Request. Please fill all field." });
        }

        connection = await getConnection();

        // Obtener el precio actual para comparar
        const [currentProduct] = await connection.query(
            "SELECT precio FROM producto WHERE id_producto = ? AND id_tenant = ? LIMIT 1",
            [id, req.id_tenant]
        );

        if (currentProduct.length === 0) {
            return res.status(404).json({ code: 0, message: "Producto no encontrado" });
        }

        const producto = { id_marca, id_subcategoria, descripcion, undm, precio, cod_barras, estado_producto };
        const [result] = await connection.query("UPDATE producto SET ? WHERE id_producto = ? AND id_tenant = ?", [producto, id, req.id_tenant]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ code: 0, message: "Producto no encontrado" });
        }

        // Registrar log de cambio de precio si hubo cambio
        const precioAnterior = parseFloat(currentProduct[0].precio);
        const precioNuevo = parseFloat(precio);

        if (precioAnterior !== precioNuevo && req.id_usuario) {
            const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress ||
                (req.connection.socket ? req.connection.socket.remoteAddress : null);

            await logProductos.cambioPrecio(id, req.id_usuario, ip, req.id_tenant, precioAnterior, precioNuevo);
        }

        // Limpiar caché
        queryCache.clear();

        res.json({ code: 1, message: "Producto modificado" });
    } catch (error) {
        console.error('Error en updateProducto:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const deleteProducto = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();

        // Verificar si el producto est  en uso en otras tablas (consultas en paralelo)
        // Verificar si el producto está en uso (Consultas secuenciales para evitar race conditions en la misma conexión)
        const [verify1Res] = await connection.query("SELECT 1 FROM detalle_venta WHERE id_producto = ? LIMIT 1", [id]);
        const [verify2Res] = await connection.query("SELECT 1 FROM detalle_envio WHERE id_producto = ? LIMIT 1", [id]);
        const [verify3Res] = await connection.query("SELECT 1 FROM detalle_nota WHERE id_producto = ? LIMIT 1", [id]);

        const isProductInUse = (verify1Res.length > 0) || (verify2Res.length > 0) || (verify3Res.length > 0);

        if (isProductInUse) {
            const [Updateresult] = await connection.query("UPDATE producto SET estado_producto = 0 WHERE id_producto = ? AND id_tenant = ?", [id, req.id_tenant]);

            if (Updateresult.affectedRows === 0) {
                return res.status(404).json({ code: 0, message: "Producto no encontrado" });
            }

            // Limpiar caché
            queryCache.clear();

            res.json({ code: 2, message: "Producto dado de baja" });
        } else {
            const [result] = await connection.query("DELETE FROM producto WHERE id_producto = ? AND id_tenant = ?", [id, req.id_tenant]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ code: 0, message: "Producto no encontrado" });
            }

            // Limpiar caché
            queryCache.clear();

            res.json({ code: 1, message: "Producto eliminado" });
        }

    } catch (error) {
        console.error('Error en deleteProducto:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const getProductVariants = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { almacen, id_sucursal, includeZero = 'false' } = req.query; // includeZero logic
        connection = await getConnection();

        // Si includeZero es 'true', mostrar incluso con stock 0 (o sin registro de stock)
        const stockCondition = includeZero === 'true' ? '(s.stock >= 0 OR s.stock IS NULL)' : 's.stock > 0';

        // Resolve correct id_almacen
        // If id_sucursal is provided, we prioritize resolving the warehouse from it
        let almacenId = almacen || 1; // Default to 1 if nothing provided

        let warehouseResolver = '';
        const queryParams = [];

        if (id_sucursal) {
            // Logic to find warehouse from sucursal
            // We can use a subquery in the main query OR separate query.
            // Subquery is cleaner.
            // But we need to bind parameters.
        }

        // Simplest strategy: If id_sucursal is passed, use a subquery in the JOIN
        let joinClause = '';
        let joinParams = [];

        if (id_sucursal) {
            joinClause = `
                LEFT JOIN sucursal_almacen sa ON sa.id_sucursal = ?
                LEFT JOIN inventario_stock s ON s.id_sku = sku.id_sku AND s.id_almacen = sa.id_almacen
            `;
            joinParams = [id_sucursal];
        } else {
            joinClause = `
                LEFT JOIN inventario_stock s ON s.id_sku = sku.id_sku AND s.id_almacen = ?
            `;
            joinParams = [almacenId];
        }

        // Updated for SPU/SKU: fetch from producto_sku
        const [result] = await connection.query(`
            SELECT 
                sku.id_sku,
                sku.attributes_json,
                sku.precio,
                sku.cod_barras,
                sku.sku as nombre_sku,
                COALESCE(s.stock, 0) as stock
            FROM producto_sku sku
            ${joinClause}
            WHERE sku.id_producto = ? AND ${stockCondition}
            ORDER BY sku.id_sku
        `, [...joinParams, id]);

        res.json({ code: 1, data: result });
    } catch (error) {
        console.error('Error en getProductVariants:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const getProductAttributes = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();

        // 1. Fetch Legacy Attributes (Tonalidades & Tallas) - For ViewVariantsModal compatibility
        const [tonalidades] = await connection.query(`
            SELECT pt.id_tonalidad as id, t.nombre, t.hex_code as hex
            FROM producto_tonalidad pt
            JOIN tonalidad t ON pt.id_tonalidad = t.id_tonalidad
            WHERE pt.id_producto = ?
        `, [id]);

        const [tallas] = await connection.query(`
            SELECT pt.id_talla as id, t.nombre
            FROM producto_talla pt
            JOIN talla t ON pt.id_talla = t.id_talla
            WHERE pt.id_producto = ?
            ORDER BY t.id_talla
        `, [id]);

        // 2. Fetch Generic Attributes from SKUs
        // Logic: Find all values linked to SKUs of this product
        const [genericAttrs] = await connection.query(`
            SELECT DISTINCT
                a.id_atributo,
                a.nombre as attr_name,
                av.id_valor,
                av.valor as val_name
            FROM producto_sku sku
            JOIN sku_atributo_valor sav ON sku.id_sku = sav.id_sku
            JOIN atributo a ON sav.id_atributo = a.id_atributo
            JOIN atributo_valor av ON sav.id_valor = av.id_valor
            WHERE sku.id_producto = ?
        `, [id]);

        // Transform flat list to structured object:
        // [{ id_atributo: 1, nombre: 'Color', values: [{ id: 10, valor: 'Rojo' }] }]
        const attributesMap = new Map();
        genericAttrs.forEach(row => {
            if (!attributesMap.has(row.id_atributo)) {
                attributesMap.set(row.id_atributo, {
                    id_atributo: row.id_atributo,
                    nombre: row.attr_name,
                    values: []
                });
            }
            // Avoid duplicate values
            const attr = attributesMap.get(row.id_atributo);
            if (!attr.values.some(v => v.id === row.id_valor)) {
                attr.values.push({ id: row.id_valor, valor: row.val_name });
            }
        });
        const structuredAttributes = Array.from(attributesMap.values());

        res.json({
            code: 1,
            data: {
                tonalidades: tonalidades, // Legacy
                tallas: tallas,           // Legacy
                attributes: structuredAttributes // New System
            }
        });
    } catch (error) {
        console.error('Error en getProductAttributes:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) connection.release();
    }
};

const registerVariants = async (req, res) => {
    let connection;
    try {
        const { id_producto, tonalidades, tallas, id_almacen = 1 } = req.body;

        if (!id_producto || !Array.isArray(tonalidades) || !Array.isArray(tallas)) {
            return res.status(400).json({ code: 0, message: "Datos incompletos" });
        }

        connection = await getConnection();
        await connection.beginTransaction();

        // 1. Fetch info needed for SKU generation
        const [prod] = await connection.query("SELECT descripcion, cod_barras, precio FROM producto WHERE id_producto = ?", [id_producto]);
        const product = prod[0];

        // Fetch Attribute Defs
        const [cmds] = await connection.query("SELECT id_atributo, codigo FROM atributo WHERE codigo IN ('color', 'talla') AND id_tenant = ?", [req.id_tenant]);
        const colorAttrId = cmds.find(c => c.codigo === 'color')?.id_atributo;
        const sizeAttrId = cmds.find(c => c.codigo === 'talla')?.id_atributo;

        // Fetch Values for IDs passed
        // We need to map Input IDs (Tonalidad/Talla tables) to AtributoValor IDs? 
        // Or assume the input IS AtributoValor IDs? 
        // The FRONTEND still sends Tonalidad/Talla IDs (legacy). 
        // So we MUST LOOK UP the AtributoValor based on the Tonalidad/Talla Name.

        // This is tricky. The Frontend sends `id_tonalidad` (from `tonalidad` table).
        // `migrate_attributes.js` migrated them to `atributo_valor` matching by Name.
        // So we resolve: TonalidadID -> Name -> AtributoValorID.

        const resolveAttrVal = async (legacyId, typeTable, attrId) => {
            const [legacyRes] = await connection.query(`SELECT nombre FROM ${typeTable} WHERE id_${typeTable} = ?`, [legacyId]);
            if (!legacyRes.length) return null;
            const name = legacyRes[0].nombre;

            const [avRes] = await connection.query("SELECT id_valor FROM atributo_valor WHERE id_atributo = ? AND valor = ?", [attrId, name]);
            if (avRes.length) return { id: avRes[0].id_valor, val: name };

            // Create if missing? (Should be migrated, but for safety)
            const [ins] = await connection.query("INSERT INTO atributo_valor (id_atributo, id_tenant, valor) VALUES (?, ?, ?)", [attrId, req.id_tenant, name]);
            return { id: ins.insertId, val: name };
        };

        for (const tId of tonalidades) {
            for (const talId of tallas) {
                const colorVal = await resolveAttrVal(tId, 'tonalidad', colorAttrId);
                const sizeVal = await resolveAttrVal(talId, 'talla', sizeAttrId);

                if (!colorVal || !sizeVal) continue;

                // Build SKU
                const attributes = { "Color": colorVal.val, "Talla": sizeVal.val };
                const attrLinks = [
                    { id_atributo: colorAttrId, id_valor: colorVal.id },
                    { id_atributo: sizeAttrId, id_valor: sizeVal.id }
                ];
                attrLinks.sort((a, b) => a.id_atributo - b.id_atributo);
                const attrs_key = attrLinks.map(l => `${l.id_atributo}:${l.id_valor}`).join('|');
                const sku_name = `${product.descripcion} - ${colorVal.val} - ${sizeVal.val}`;

                // Check or Create SKU
                let id_sku;
                const [existing] = await connection.query("SELECT id_sku FROM producto_sku WHERE id_producto = ? AND attrs_key = ?", [id_producto, attrs_key]);

                if (existing.length) {
                    id_sku = existing[0].id_sku;
                } else {
                    const [ins] = await connection.query(`
                        INSERT INTO producto_sku (id_producto, id_tenant, sku, precio, attributes_json, attrs_key)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `, [id_producto, req.id_tenant, sku_name.substring(0, 64), product.precio, JSON.stringify(attributes), attrs_key]);
                    id_sku = ins.insertId;

                    for (const l of attrLinks) {
                        await connection.query("INSERT IGNORE INTO sku_atributo_valor (id_sku, id_atributo, id_valor, id_tenant) VALUES (?, ?, ?, ?)", [id_sku, l.id_atributo, l.id_valor, req.id_tenant]);
                    }
                }

                // Initialize Stock
                await connection.query(`
                    INSERT INTO inventario_stock (id_sku, id_almacen, stock, id_tenant) 
                    VALUES (?, ?, 0, ?) 
                    ON DUPLICATE KEY UPDATE stock = stock
                `, [id_sku, id_almacen, req.id_tenant]);
            }
        }

        await connection.commit();
        res.json({ code: 1, message: "Variantes registradas (SKU)" });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error en registerVariants:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) connection.release();
    }
};

// NEW: Generic SKU Generation
const generateSKUs = async (req, res) => {
    let connection;
    try {
        const { id_producto, attributes } = req.body;
        // attributes: [{ id_atributo, values: [id_valor, id_valor...] }, ...]

        if (!id_producto || !Array.isArray(attributes)) {
            return res.status(400).json({ code: 0, message: "Datos incompletos" });
        }

        connection = await getConnection();
        await connection.beginTransaction();

        // 1. Get Product Info
        const [prod] = await connection.query("SELECT descripcion, cod_barras, precio FROM producto WHERE id_producto = ?", [id_producto]);
        if (prod.length === 0) throw new Error("Producto no encontrado");
        const product = prod[0];

        // 2. Helper to generate Cartesian Product
        const cartesian = (args) => {
            const result = [];
            const max = args.length - 1;
            const helper = (arr, i) => {
                for (let j = 0, l = args[i].values.length; j < l; j++) {
                    const a = arr.slice(0); // clone arr
                    a.push({
                        id_atributo: args[i].id_atributo,
                        id_valor: args[i].values[j].id,
                        valor_label: args[i].values[j].label
                    });
                    if (i === max) result.push(a);
                    else helper(a, i + 1);
                }
            };
            helper([], 0);
            return result;
        };

        // If no attributes, maybe just create 1 SKU default? 
        // For now assume strictly for variants. If empty, do nothing.
        if (attributes.length === 0) {
            // Logic for "Simple Product" (Single SKU) vs "Variable Product"
            // For now, return success
            await connection.commit();
            return res.json({ code: 1, message: "Sin variantes" });
        }

        // 3. Generate Combinations
        // We need the labels for the SKU Name. ensure 'values' in body has { id, label } or fetch them.
        // Trusted the frontend sends labels? better fetch.
        // Optimization: Fetch all needed value labels efficiently or trust frontend for speed if valid IDs.
        // Let's trust frontend for labels for SKU naming to avoid complex lookups, but verify IDs exist if needed.
        // Or assume the 'values' array contains objects { id: 1, label: 'Rojo' }.

        const combinations = cartesian(attributes);

        // 4. Insert SKUs
        for (const combo of combinations) {
            // combo is [{id_atributo, id_valor, valor_label}, ...]

            // Sort by ID attribute to ensure consistent key
            combo.sort((a, b) => a.id_atributo - b.id_atributo);

            const attrs_json = {};
            const sku_parts = [product.descripcion];
            const attrLinks = [];
            const attrs_key_parts = [];

            combo.forEach(c => {
                // Try to find Attribute Name? We only have ID.
                // We can fetch attribute names once before loop.
                attrs_json[c.id_atributo] = c.valor_label; // Ideally Name: Value, but ID: Value is safer for JSON logic
                sku_parts.push(c.valor_label);
                attrLinks.push({ id_atributo: c.id_atributo, id_valor: c.id_valor });
                attrs_key_parts.push(`${c.id_atributo}:${c.id_valor}`);
            });

            const sku_name = sku_parts.join(" - ").substring(0, 150); // truncated
            const attrs_key = attrs_key_parts.join("|");

            // Check existence
            const [existing] = await connection.query("SELECT id_sku FROM producto_sku WHERE id_producto = ? AND attrs_key = ?", [id_producto, attrs_key]);

            let id_sku;
            if (existing.length) {
                id_sku = existing[0].id_sku;
            } else {
                const [ins] = await connection.query(`
                    INSERT INTO producto_sku (id_producto, id_tenant, sku, precio, attributes_json, attrs_key)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [id_producto, req.id_tenant, sku_name, product.precio, JSON.stringify(attrs_json), attrs_key]);
                id_sku = ins.insertId;

                for (const l of attrLinks) {
                    await connection.query("INSERT IGNORE INTO sku_atributo_valor (id_sku, id_atributo, id_valor, id_tenant) VALUES (?, ?, ?, ?)", [id_sku, l.id_atributo, l.id_valor, req.id_tenant]);
                }
            }

            // Init Stock
            await connection.query(`
                INSERT INTO inventario_stock (id_sku, id_almacen, stock, id_tenant) 
                VALUES (?, ?, 0, ?) 
                ON DUPLICATE KEY UPDATE stock = stock
            `, [id_sku, 1, req.id_tenant]); // Default Almacen 1
        }

        await connection.commit();
        res.json({ code: 1, message: "SKUs generados" });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error en generateSKUs:', error);
        res.status(500).json({ code: 0, message: "Error interno" });
    } finally {
        if (connection) connection.release();
    }
};

const importExcel = async (req, res) => {
    let connection;
    try {
        const { data } = req.body;

        if (!Array.isArray(data) || data.length === 0) {
            return res.status(400).json({ message: "No data provided or invalid format" });
        }

        if (data.length > 500) {
            return res.status(400).json({ message: "Limit exceeded. Max 500 rows allowed." });
        }

        connection = await getConnection();
        await connection.beginTransaction();

        let insertedCount = 0;
        let errors = [];

        for (const [index, item] of data.entries()) {
            // Basic validation
            if (!item.descripcion || !item.id_marca || !item.id_subcategoria || !item.undm || !item.precio) {
                errors.push(`Row ${index + 1}: Missing required fields`);
                continue;
            }

            const producto = {
                id_marca: item.id_marca,
                id_subcategoria: item.id_subcategoria,
                descripcion: item.descripcion,
                undm: item.undm,
                precio: item.precio,
                cod_barras: item.cod_barras || `T${req.id_tenant}-IMP${Date.now()}-${index}`, // Auto-generate if missing to avoid unique constraint error
                estado_producto: item.estado_producto !== undefined ? item.estado_producto : 1,
                id_tenant: req.id_tenant
            };

            try {
                await connection.query("INSERT INTO producto SET ?", producto);
                insertedCount++;
            } catch (err) {
                errors.push(`Row ${index + 1}: ${err.message}`);
            }
        }

        await connection.commit();

        // Clear cache
        queryCache.clear();

        res.json({
            code: 1,
            message: `Import completed. ${insertedCount} inserted.`,
            inserted: insertedCount,
            errors: errors.length > 0 ? errors : null
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error en importExcel:', error);
        res.status(500).json({ code: 0, message: "Internal Server Error" });
    } finally {
        if (connection) connection.release();
    }
};

export const methods = {
    getProductos,
    getUltimoIdProducto,
    getProducto,
    addProducto,
    updateProducto,
    deleteProducto,
    getProductVariants,
    getProductAttributes,
    getProductAttributes,
    registerVariants,
    generateSKUs,
    importExcel
};
