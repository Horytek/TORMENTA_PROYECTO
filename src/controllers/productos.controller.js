import { getConnection } from "./../database/database.js";
import { logProductos } from "../utils/logActions.js";
import { codigoBarrasSku, generarEan13 } from "../utils/skuHelper.js";
import { getComboItems, setComboItems } from "../services/combos/comboRepository.js";

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
            cod_barras,
            q,
            bajo_stock
        } = req.query;
        const filtrarBajoStock = bajo_stock === '1' || bajo_stock === 'true';

        const whereClauses = ['PR.id_tenant = ?'];
        const params = [req.id_tenant];

        if (id_marca) { whereClauses.push('PR.id_marca = ?'); params.push(id_marca); }
        if (id_subcategoria) { whereClauses.push('PR.id_subcategoria = ?'); params.push(id_subcategoria); }
        if (id_categoria) { whereClauses.push('CA.id_categoria = ?'); params.push(id_categoria); }
        if (typeof estado !== 'undefined' && estado !== '') { whereClauses.push('PR.estado_producto = ?'); params.push(estado); }
        if (descripcion) { whereClauses.push('PR.descripcion = ?'); params.push(descripcion); }
        if (id_producto) { whereClauses.push('PR.id_producto = ?'); params.push(id_producto); }
        if (cod_barras) { whereClauses.push('PR.cod_barras = ?'); params.push(cod_barras); }

        if (q && q.trim() !== '') {
            const searchVal = `%${q.trim()}%`;
            const qNum = parseInt(q, 10);
            if (!isNaN(qNum)) {
                whereClauses.push('(PR.descripcion LIKE ? OR PR.cod_barras LIKE ? OR PR.id_producto = ?)');
                params.push(searchVal, searchVal, qNum);
            } else {
                whereClauses.push('(PR.descripcion LIKE ? OR PR.cod_barras LIKE ?)');
                params.push(searchVal, searchVal);
            }
        }

        const whereSQL = `WHERE ${whereClauses.join(' AND ')}`;
        // "Bajo stock mínimo" es un HAVING sobre el stock agregado por SKU, no
        // un WHERE de producto: no se puede resolver antes del GROUP BY, así
        // que el conteo total también necesita agrupar cuando este filtro está activo.
        const havingSQL = filtrarBajoStock
            ? 'HAVING PR.stock_min IS NOT NULL AND SUM(COALESCE(INV.stock, 0)) <= PR.stock_min'
            : '';

        const [countResult] = filtrarBajoStock
            ? await connection.query(
                `
                SELECT COUNT(*) AS total FROM (
                    SELECT PR.id_producto
                    FROM producto PR
                    ${id_categoria ? 'INNER JOIN sub_categoria CA ON CA.id_subcategoria = PR.id_subcategoria' : ''}
                    LEFT JOIN producto_sku PSK ON PSK.id_producto = PR.id_producto AND PSK.id_tenant = PR.id_tenant
                    LEFT JOIN inventario_stock INV ON INV.id_sku = PSK.id_sku AND INV.id_tenant = PSK.id_tenant
                    ${whereSQL}
                    GROUP BY PR.id_producto, PR.stock_min
                    ${havingSQL}
                ) sub
                `,
                params
            )
            : await connection.query(
                `
                SELECT COUNT(*) AS total
                FROM producto PR
                ${id_categoria ? 'INNER JOIN sub_categoria CA ON CA.id_subcategoria = PR.id_subcategoria' : ''}
                ${whereSQL}
                `,
                params
            );
        const total = countResult[0]?.total || 0;

        const [result] = await connection.query(
            `
            SELECT PR.id_producto, PR.descripcion,
                   CA.nom_subcat, MA.nom_marca, PR.undm,
                   CAST(PR.precio AS DECIMAL(10, 2)) AS precio, PR.cod_barras,
                   PR.estado_producto AS estado, PR.id_marca, PR.id_subcategoria,
                   cat.id_categoria, PR.stock_min, PR.tipo_afectacion_igv,
                   SUM(COALESCE(INV.stock, 0)) AS stock_total,
                   (SELECT AVG(sub.costo_promedio) FROM producto_sku sub
                    WHERE sub.id_producto = PR.id_producto AND sub.id_tenant = PR.id_tenant
                      AND sub.costo_promedio IS NOT NULL) AS costo_promedio
            FROM producto PR
            INNER JOIN marca MA ON MA.id_marca = PR.id_marca
            INNER JOIN sub_categoria CA ON CA.id_subcategoria = PR.id_subcategoria
            INNER JOIN categoria cat ON cat.id_categoria = CA.id_categoria
            LEFT JOIN producto_sku PSK ON PSK.id_producto = PR.id_producto AND PSK.id_tenant = PR.id_tenant
            LEFT JOIN inventario_stock INV ON INV.id_sku = PSK.id_sku AND INV.id_tenant = PSK.id_tenant
            ${whereSQL}
            GROUP BY PR.id_producto, PR.descripcion, CA.nom_subcat, MA.nom_marca, PR.undm, PR.precio, PR.cod_barras, PR.estado_producto, PR.id_marca, PR.id_subcategoria, cat.id_categoria, PR.stock_min, PR.tipo_afectacion_igv
            ${havingSQL}
            ORDER BY ${sortBy} ${sortDir}
            LIMIT ? OFFSET ?
            `,
            [...params, limit, offset]
        );

        res.json({
            code: 1,
            data: result,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            message: "Productos listados"
        });
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
                SELECT id_producto, id_marca, SC.id_categoria, PR.id_subcategoria, descripcion, precio, cod_barras, undm, estado_producto, PR.stock_min, PR.tipo_afectacion_igv, PR.es_combo
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
        const { id_marca, id_subcategoria, descripcion, undm, precio, cod_barras, estado_producto, stock_min, tipo_afectacion_igv, es_combo } = req.body;

        if (id_marca === undefined || id_subcategoria === undefined || descripcion === undefined || undm === undefined || id_subcategoria === undefined || estado_producto === undefined || precio === undefined) {
            res.status(400).json({ message: "Bad Request. Please fill all field." });
        }

        const producto = { id_marca, id_subcategoria, descripcion, undm, precio, cod_barras, estado_producto, id_tenant: req.id_tenant, stock_min: stock_min ?? null, tipo_afectacion_igv: tipo_afectacion_igv || '10', es_combo: es_combo ? 1 : 0 };
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
        const { id_marca, id_subcategoria, descripcion, undm, precio, cod_barras, estado_producto, stock_min, tipo_afectacion_igv, es_combo } = req.body;

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

        const producto = { id_marca, id_subcategoria, descripcion, undm, precio, cod_barras, estado_producto, stock_min: stock_min ?? null, tipo_afectacion_igv: tipo_afectacion_igv || '10', es_combo: es_combo ? 1 : 0 };
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
        const { id_almacen } = req.query;
        connection = await getConnection();

        // Stock real por SKU (motor genérico atributo/producto_sku), no el legacy
        // tonalidad/talla. Si se filtra por almacén, solo trae esa fila de stock;
        // si no, suma el stock de todos los almacenes del SKU.
        const filtrarAlmacen = id_almacen && !isNaN(id_almacen);
        const almacenFilter = filtrarAlmacen ? "AND ist.id_almacen = ?" : "";
        // Orden de los `?`: el del JOIN aparece primero en el texto del SQL.
        const params = [...(filtrarAlmacen ? [id_almacen] : []), id, req.id_tenant];

        const [result] = await connection.query(`
            SELECT
                sku.id_sku,
                sku.sku,
                sku.cod_barras,
                sku.ean13,
                sku.precio,
                sku.attributes_json,
                COALESCE(SUM(ist.stock), 0) AS stock
            FROM producto_sku sku
            LEFT JOIN inventario_stock ist ON ist.id_sku = sku.id_sku ${almacenFilter}
            WHERE sku.id_producto = ?
              AND sku.id_tenant   = ?
              AND sku.estado = 1
            GROUP BY sku.id_sku, sku.sku, sku.cod_barras, sku.ean13, sku.precio, sku.attributes_json
            ORDER BY sku.id_sku
        `, params);

        const data = result.map(r => ({
            id_sku: r.id_sku,
            id_producto: Number(id),
            sku: r.sku,
            cod_barras: r.cod_barras,
            ean13: r.ean13,
            precio: r.precio,
            stock: Number(r.stock),
            attrs: typeof r.attributes_json === 'string' ? JSON.parse(r.attributes_json || '{}') : (r.attributes_json || {}),
        }));

        res.json({ code: 1, data });
    } catch (error) {
        console.error('Error en getProductVariants:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const getProductCombo = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();
        const items = await getComboItems(connection, { id_tenant: req.id_tenant, id_producto_combo: Number(id) });
        res.json({ code: 1, data: items });
    } catch (error) {
        console.error('Error en getProductCombo:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) connection.release();
    }
};

const updateProductCombo = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const id_producto_combo = Number(id);
        const items = Array.isArray(req.body?.items) ? req.body.items : [];

        connection = await getConnection();

        // Un componente no puede ser a su vez un combo: evita ciclos y que
        // vender un combo intente "descontar" otro combo (que no tiene stock
        // propio del que descontar).
        const idsComponentes = [...new Set(items.map((it) => Number(it.id_producto_componente)))];
        if (idsComponentes.length > 0) {
            const [combosEntreComponentes] = await connection.query(
                `SELECT id_producto FROM producto WHERE id_tenant = ? AND es_combo = 1 AND id_producto IN (${idsComponentes.map(() => "?").join(",")})`,
                [req.id_tenant, ...idsComponentes]
            );
            if (combosEntreComponentes.length > 0) {
                return res.status(400).json({ code: 0, message: "Un combo no puede tener otro combo como componente." });
            }
        }

        await setComboItems(connection, { id_tenant: req.id_tenant, id_producto_combo, items });
        queryCache.clear();
        res.json({ code: 1, message: "Composición del combo actualizada" });
    } catch (error) {
        console.error('Error en updateProductCombo:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) connection.release();
    }
};

// Resuelve un código escaneado a la variante exacta (SKU), no al producto
// padre: es lo que permite que un lector de código de barras distinga una M
// de una L en vez de solo llegar al producto y forzar una elección manual.
const buscarSkuPorBarcode = async (req, res) => {
    let connection;
    try {
        const { codigo, id_almacen } = req.query;
        if (!codigo) {
            return res.status(400).json({ code: 0, message: "Falta el código a buscar" });
        }
        connection = await getConnection();

        const filtrarAlmacen = id_almacen && !isNaN(id_almacen);
        const almacenFilter = filtrarAlmacen ? "AND ist.id_almacen = ?" : "";
        const params = [codigo, req.id_tenant, ...(filtrarAlmacen ? [id_almacen] : [])];

        const [result] = await connection.query(`
            SELECT
                sku.id_sku,
                sku.id_producto,
                sku.attributes_json,
                p.descripcion AS nombre,
                p.precio AS precio_producto,
                sku.precio AS precio_sku,
                p.tipo_afectacion_igv,
                m.nom_marca,
                COALESCE(SUM(ist.stock), 0) AS stock
            FROM producto_sku sku
            INNER JOIN producto p ON p.id_producto = sku.id_producto AND p.id_tenant = sku.id_tenant
            INNER JOIN marca m ON p.id_marca = m.id_marca
            LEFT JOIN inventario_stock ist ON ist.id_sku = sku.id_sku ${almacenFilter}
            WHERE sku.cod_barras = ? AND sku.id_tenant = ? AND sku.estado = 1
            GROUP BY sku.id_sku, sku.id_producto, sku.attributes_json, p.descripcion, p.precio, sku.precio, p.tipo_afectacion_igv, m.nom_marca
            LIMIT 1
        `, params);

        if (result.length === 0) {
            return res.json({ code: 0, message: "No se encontró una variante con ese código" });
        }

        const r = result[0];
        const attrs = typeof r.attributes_json === 'string' ? JSON.parse(r.attributes_json || '{}') : (r.attributes_json || {});
        res.json({
            code: 1,
            data: {
                id_producto: r.id_producto,
                id_sku: r.id_sku,
                nombre: r.nombre,
                nom_marca: r.nom_marca,
                precio: r.precio_sku ?? r.precio_producto,
                tipo_afectacion_igv: r.tipo_afectacion_igv,
                label: Object.values(attrs).filter(Boolean).join(" / "),
                stock: Number(r.stock),
            },
        });
    } catch (error) {
        console.error('Error en buscarSkuPorBarcode:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) connection.release();
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
                av.valor as val_name,
                av.metadata
            FROM producto_sku sku
            JOIN sku_atributo_valor sav ON sku.id_sku = sav.id_sku
            JOIN atributo a ON sav.id_atributo = a.id_atributo
            JOIN atributo_valor av ON sav.id_valor = av.id_valor AND av.id_atributo = a.id_atributo
            WHERE sku.id_producto = ? AND sku.id_tenant = ?
        `, [id, req.id_tenant]);

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
                const meta = typeof row.metadata === 'string' && row.metadata ? JSON.parse(row.metadata) : row.metadata;
                attr.values.push({ id: row.id_valor, valor: row.val_name, hex: meta?.hex });
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

                    const cod_barras_sku = codigoBarrasSku(product.cod_barras, id_sku);
                    if (cod_barras_sku) {
                        await connection.query("UPDATE producto_sku SET cod_barras = ? WHERE id_sku = ?", [cod_barras_sku, id_sku]);
                    }
                    await connection.query("UPDATE producto_sku SET ean13 = ? WHERE id_sku = ?", [generarEan13(id_sku), id_sku]);

                    for (const l of attrLinks) {
                        await connection.query("INSERT IGNORE INTO sku_atributo_valor (id_sku, id_atributo, id_valor, id_tenant) VALUES (?, ?, ?, ?)", [id_sku, l.id_atributo, l.id_valor, req.id_tenant]);
                    }
                }

// Fila inicial de stock en cero, ya por SKU.
                // Antes se insertaba en `inventario` con id_tonalidad/id_talla
                // en NULL: como el índice único los incluye y MySQL trata cada
                // NULL como distinto, el ON DUPLICATE KEY nunca colisionaba y
                // cada llamada creaba una fila nueva. El de `inventario_stock`
                // es (tenant, sku, almacén), las tres NOT NULL, así que sí.
                await connection.query(`
                    INSERT INTO inventario_stock (id_tenant, id_sku, id_almacen, stock, reservado)
                    VALUES (?, ?, ?, 0, 0)
                    ON DUPLICATE KEY UPDATE stock = stock
                `, [req.id_tenant, id_sku, id_almacen]);
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
        const { id_producto, attributes, combinaciones } = req.body;
        // attributes: [{ id_atributo, values: [id_valor, id_valor...] }, ...] — cartesian de TODOS los valores (flujo checkbox).
        // combinaciones (opcional): [{ valores: [{id_atributo, id_valor}], precio?, stock_inicial? }, ...] — lista
        // explícita (flujo de grilla matricial): permite excluir celdas y fijar precio/stock por combinación.

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

        const usaCombinacionesExplicitas = Array.isArray(combinaciones) && combinaciones.length > 0;

        // If no attributes, maybe just create 1 SKU default?
        // For now assume strictly for variants. If empty, do nothing.
        if (attributes.length === 0 && !usaCombinacionesExplicitas) {
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

        // Grilla matricial: la lista de combos ya viene armada por el usuario
        // (incluye solo las celdas activadas, no el cartesiano completo).
        const combinations = usaCombinacionesExplicitas
            ? combinaciones.map(c => Array.isArray(c.valores) ? c.valores : [])
            : cartesian(attributes);

        // Precio/stock por combinación, keyeado por sus id_valor ordenados —
        // así no depende de que el cliente replique el orden por id_atributo
        // que este endpoint usa internamente para armar attrs_key.
        const overridePorCombo = new Map();
        if (usaCombinacionesExplicitas) {
            for (const c of combinaciones) {
                const clave = (Array.isArray(c.valores) ? c.valores : [])
                    .map(v => v.id_valor).sort((a, b) => a - b).join(',');
                overridePorCombo.set(clave, { precio: c.precio, stock_inicial: c.stock_inicial });
            }
        }

        // Resolver los id_valor recibidos contra atributo_valor real: no confiar en el
        // `label` que manda el frontend para nombrar el SKU (podría venir manipulado
        // o de otro tenant). Un solo SELECT para todos los ids involucrados.
        const idsValores = [...new Set(combinations.flatMap(c => c.map(x => x.id_valor)))];
        const [valoresReales] = idsValores.length
            ? await connection.query(
                "SELECT id_valor, id_atributo, valor FROM atributo_valor WHERE id_valor IN (?) AND id_tenant = ?",
                [idsValores, req.id_tenant]
            )
            : [[]];
        const valorPorId = new Map(valoresReales.map(v => [v.id_valor, v]));

        // 4. Insert SKUs
        for (const combo of combinations) {
            // combo is [{id_atributo, id_valor, valor_label}, ...]

            // Sort by ID attribute to ensure consistent key
            combo.sort((a, b) => a.id_atributo - b.id_atributo);

            // Si algún id_valor no resuelve contra atributo_valor del tenant o no coincide id_atributo,
            // se descarta esta combinación en vez de guardar datos corruptos.
            if (combo.some(c => {
                const real = valorPorId.get(c.id_valor);
                return !real || Number(real.id_atributo) !== Number(c.id_atributo);
            })) {
                continue;
            }

            const attrs_json = {};
            const sku_parts = [product.descripcion];
            const attrLinks = [];
            const attrs_key_parts = [];

            combo.forEach(c => {
                const valorObj = valorPorId.get(c.id_valor);
                const valorReal = valorObj ? valorObj.valor : "";
                attrs_json[c.id_atributo] = valorReal; // Ideally Name: Value, but ID: Value is safer for JSON logic
                sku_parts.push(valorReal);
                attrLinks.push({ id_atributo: c.id_atributo, id_valor: c.id_valor });
                attrs_key_parts.push(`${c.id_atributo}:${c.id_valor}`);
            });

            const sku_name = sku_parts.join(" - ").substring(0, 150); // truncated
            const attrs_key = attrs_key_parts.join("|");

            const claveOverride = combo.map(c => c.id_valor).sort((a, b) => a - b).join(',');
            const override = overridePorCombo.get(claveOverride);
            const precioNum = Number(override?.precio);
            const precioSku = Number.isFinite(precioNum) && precioNum > 0 ? precioNum : product.precio;
            const stockNum = Number(override?.stock_inicial);
            const stockInicial = Number.isFinite(stockNum) && stockNum >= 0 ? stockNum : 0;

            // Check existence (filtrado también por tenant — Regla de Oro Nº1)
            const [existing] = await connection.query("SELECT id_sku FROM producto_sku WHERE id_producto = ? AND attrs_key = ? AND id_tenant = ?", [id_producto, attrs_key, req.id_tenant]);

            let id_sku;
            if (existing.length) {
                id_sku = existing[0].id_sku;
            } else {
                const [ins] = await connection.query(`
                    INSERT INTO producto_sku (id_producto, id_tenant, sku, precio, attributes_json, attrs_key)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [id_producto, req.id_tenant, sku_name, precioSku, JSON.stringify(attrs_json), attrs_key]);
                id_sku = ins.insertId;

                const cod_barras_sku = codigoBarrasSku(product.cod_barras, id_sku);
                if (cod_barras_sku) {
                    await connection.query("UPDATE producto_sku SET cod_barras = ? WHERE id_sku = ?", [cod_barras_sku, id_sku]);
                }
                await connection.query("UPDATE producto_sku SET ean13 = ? WHERE id_sku = ?", [generarEan13(id_sku), id_sku]);

                for (const l of attrLinks) {
                    await connection.query("INSERT IGNORE INTO sku_atributo_valor (id_sku, id_atributo, id_valor, id_tenant) VALUES (?, ?, ?, ?)", [id_sku, l.id_atributo, l.id_valor, req.id_tenant]);
                }
            }

// Fila inicial de stock para el SKU recién creado (0 salvo que la grilla matricial haya fijado un stock inicial).
            await connection.query(`
                INSERT INTO inventario_stock (id_tenant, id_sku, id_almacen, stock, reservado)
                VALUES (?, ?, 1, ?, 0)
                ON DUPLICATE KEY UPDATE stock = stock
            `, [req.id_tenant, id_sku, stockInicial]); // Almacén 1 por defecto
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

        // Resuelve marca/subcategoría por NOMBRE una sola vez (no por fila):
        // antes el import exigía conocer el id_marca/id_subcategoria numérico
        // de memoria, que el usuario no tiene forma de saber sin ir a otra
        // pantalla. Sigue aceptando id_marca/id_subcategoria numéricos si ya
        // vienen así (compatibilidad con la plantilla anterior).
        const [marcas] = await connection.query(
            "SELECT id_marca, nom_marca FROM marca WHERE id_tenant = ?", [req.id_tenant]
        );
        const [subcats] = await connection.query(
            "SELECT id_subcategoria, nom_subcat FROM sub_categoria WHERE id_tenant = ?", [req.id_tenant]
        );
        const idMarcaPorNombre = new Map(marcas.map(m => [m.nom_marca.trim().toLowerCase(), m.id_marca]));
        const idSubcatPorNombre = new Map(subcats.map(s => [s.nom_subcat.trim().toLowerCase(), s.id_subcategoria]));

        let insertedCount = 0;
        let errors = [];

        for (const [index, item] of data.entries()) {
            let id_marca = item.id_marca || null;
            if (!id_marca && item.marca) {
                id_marca = idMarcaPorNombre.get(String(item.marca).trim().toLowerCase()) || null;
                if (!id_marca) {
                    errors.push(`Fila ${index + 1}: la marca "${item.marca}" no existe.`);
                    continue;
                }
            }
            let id_subcategoria = item.id_subcategoria || null;
            if (!id_subcategoria && item.subcategoria) {
                id_subcategoria = idSubcatPorNombre.get(String(item.subcategoria).trim().toLowerCase()) || null;
                if (!id_subcategoria) {
                    errors.push(`Fila ${index + 1}: la subcategoría "${item.subcategoria}" no existe.`);
                    continue;
                }
            }

            // Basic validation
            if (!item.descripcion || !id_marca || !id_subcategoria || !item.undm || !item.precio) {
                errors.push(`Row ${index + 1}: Missing required fields`);
                continue;
            }

            const producto = {
                id_marca,
                id_subcategoria,
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

// Historial de cambios de precio — mismo patrón que clientes.getHistorialCliente
// (recurso = "producto_id:X"), filtrado a la acción de cambio de precio.
const getHistorialPrecioProducto = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 15, 1), 50);
        connection = await getConnection();

        const [rows] = await connection.query(`
            SELECT l.id_log, l.fecha, l.descripcion, u.usua AS usuario
            FROM log_sistema l
            LEFT JOIN usuario u ON l.id_usuario = u.id_usuario
            WHERE l.id_tenant = ? AND l.recurso = ? AND l.accion = 'PRODUCTO_CAMBIO_PRECIO'
            ORDER BY l.fecha DESC
            LIMIT ?
        `, [req.id_tenant, `producto_id:${id}`, limit]);

        res.json({ code: 1, data: rows });
    } catch (error) {
        console.error('Error en getHistorialPrecioProducto:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
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
    getProductCombo,
    updateProductCombo,
    buscarSkuPorBarcode,
    getProductAttributes,
    registerVariants,
    generateSKUs,
    importExcel,
    getHistorialPrecioProducto
};

