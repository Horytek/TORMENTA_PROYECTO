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
                   cat.id_categoria
            FROM producto PR
            INNER JOIN marca MA ON MA.id_marca = PR.id_marca
            INNER JOIN sub_categoria CA ON CA.id_subcategoria = PR.id_subcategoria
            INNER JOIN categoria cat ON cat.id_categoria = CA.id_categoria
            ${whereSQL}
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
                cod_barras: item.cod_barras || '-',
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
    importExcel
};
