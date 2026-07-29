import { getConnection } from "./../database/database.js";

/**
 * Kardex "simple" — vista por PRODUCTO, sin desglosar variantes.
 *
 * Lee de `inventario_stock` (una fila por SKU y almacén) y suma los SKU de cada
 * producto. Hasta hace poco leía la tabla `inventario`, que quedó vacía en la
 * migración a SKU: por eso este módulo mostraba todo en cero. `inventario` ya no
 * se consulta desde ningún lado.
 *
 * Sigue siendo SOLO lectura: las altas y bajas pasan por notas de almacén,
 * ventas y guías, que escriben vía `services/inventario/stockRepository.js`.
 *
 * Multi-tenant: `id_tenant` sale siempre de `req.id_tenant` y viaja en cada
 * JOIN — `producto_sku` e `inventario_stock` guardan su propio `id_tenant`, así
 * que omitirlo en el JOIN mezcla stock entre clientes.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Catálogo de productos con su stock en `inventario` (sin variantes).
// ─────────────────────────────────────────────────────────────────────────────
const getProductos = async (req, res) => {
    const { descripcion = '', almacen = '', marca = '', cat = '', subcat = '', stock = '' } = req.query;
    const id_tenant = req.id_tenant;
    let connection;

    try {
        connection = await getConnection();

        const whereClauses = [
            'p.estado_producto = 1',
            'p.id_tenant = ?',
        ];
        const params = [id_tenant];

        // Si hay almacén filtramos directo en la join (evita producto cartesiano).
        // El almacén va ANTES que el id_tenant en `params` porque en el SQL la
        // join precede al WHERE.
        const SKU_JOIN = `LEFT JOIN producto_sku psk ON psk.id_producto = p.id_producto AND psk.id_tenant = p.id_tenant`;
        let invJoin = `${SKU_JOIN}
            LEFT JOIN inventario_stock i ON i.id_sku = psk.id_sku AND i.id_tenant = psk.id_tenant`;
        if (almacen) {
            invJoin = `${SKU_JOIN}
            LEFT JOIN inventario_stock i ON i.id_sku = psk.id_sku AND i.id_tenant = psk.id_tenant AND i.id_almacen = ?`;
            params.unshift(almacen);
        }

        if (descripcion) {
            whereClauses.push('p.descripcion LIKE ?');
            params.push(`%${descripcion}%`);
        }
        if (marca) {
            whereClauses.push('m.id_marca = ?');
            params.push(marca);
        }
        if (cat) {
            whereClauses.push('CA.id_categoria = ?');
            params.push(cat);
        }
        if (subcat) {
            whereClauses.push('CA.id_subcategoria = ?');
            params.push(subcat);
        }

        let havingClause = '';
        if (stock === 'con_stock') havingClause = 'HAVING stock > 0';
        else if (stock === 'sin_stock') havingClause = 'HAVING stock <= 0';

        const where = `WHERE ${whereClauses.join(' AND ')}`;

        const [rows] = await connection.query(
            `SELECT
                p.id_producto        AS codigo,
                p.descripcion        AS descripcion,
                m.nom_marca          AS marca,
                COALESCE(SUM(i.stock), 0) AS stock,
                p.undm               AS um,
                CAST(p.precio AS DECIMAL(10, 2)) AS precio,
                p.cod_barras         AS cod_barras,
                p.estado_producto    AS estado,
                (SELECT AVG(sub.costo_promedio) FROM producto_sku sub
                 WHERE sub.id_producto = p.id_producto AND sub.id_tenant = p.id_tenant
                   AND sub.costo_promedio IS NOT NULL) AS costo_promedio
            FROM producto p
            INNER JOIN marca m         ON p.id_marca        = m.id_marca
            INNER JOIN sub_categoria CA ON CA.id_subcategoria = p.id_subcategoria
            ${invJoin}
            ${where}
            GROUP BY p.id_producto, p.descripcion, m.nom_marca, p.undm, p.precio, p.cod_barras, p.estado_producto
            ${havingClause}
            ORDER BY p.descripcion
            LIMIT 500`,
            params
        );

        res.json({ code: 1, data: rows });
    } catch (error) {
        console.error('Error en kardex-inventario.getProductos:', error);
        res.status(500).json({ code: 0, message: 'Error interno del servidor' });
    } finally {
        if (connection) connection.release();
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Info puntual de un producto (stock consolidado desde `inventario`).
// ─────────────────────────────────────────────────────────────────────────────
const getInfProducto = async (req, res) => {
    const { idProducto, idAlmacen } = req.query;
    const id_tenant = req.id_tenant;
    let connection;

    try {
        connection = await getConnection();

        const [rows] = await connection.query(
            `SELECT
                p.id_producto AS codigo,
                p.descripcion AS descripcion,
                m.nom_marca   AS marca,
                COALESCE(SUM(i.stock), 0) AS stock
            FROM producto p
            INNER JOIN marca m ON p.id_marca = m.id_marca
            LEFT JOIN producto_sku psk ON psk.id_producto = p.id_producto AND psk.id_tenant = p.id_tenant
            LEFT JOIN inventario_stock i ON i.id_sku = psk.id_sku AND i.id_tenant = psk.id_tenant
                ${idAlmacen && idAlmacen !== '%' ? 'AND i.id_almacen = ?' : ''}
            WHERE p.id_producto = ?
              AND p.id_tenant = ?
            GROUP BY p.id_producto`,
            idAlmacen && idAlmacen !== '%'
                ? [idAlmacen, idProducto, id_tenant]
                : [idProducto, id_tenant]
        );

        if (rows.length === 0) {
            return res.status(404).json({ code: 0, data: [], message: 'Producto no encontrado' });
        }

        res.json({ code: 1, data: rows });
    } catch (error) {
        console.error('Error en kardex-inventario.getInfProducto:', error);
        res.status(500).json({ code: 0, message: 'Error interno del servidor' });
    } finally {
        if (connection) connection.release();
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Productos con stock bajo (< 10) desde `inventario`, opcionalmente filtrados por sucursal.
// ─────────────────────────────────────────────────────────────────────────────
const getProductosMenorStock = async (req, res) => {
    const { sucursal = '' } = req.query;
    const id_tenant = req.id_tenant;
    let connection;

    try {
        connection = await getConnection();

        const whereClauses = ['p.id_tenant = ?'];
        const params = [id_tenant];
        let invJoin = `LEFT JOIN producto_sku psk ON psk.id_producto = p.id_producto AND psk.id_tenant = p.id_tenant
            LEFT JOIN inventario_stock i ON i.id_sku = psk.id_sku AND i.id_tenant = psk.id_tenant`;

        if (sucursal) {
            invJoin += ' LEFT JOIN sucursal_almacen sa ON i.id_almacen = sa.id_almacen AND sa.id_tenant = p.id_tenant';
            whereClauses.push('sa.id_sucursal = ?');
            params.push(sucursal);
        }

        const where = `WHERE ${whereClauses.join(' AND ')}`;

        const [rows] = await connection.query(
            `SELECT
                p.id_producto AS codigo,
                p.descripcion AS nombre,
                m.nom_marca   AS marca,
                COALESCE(SUM(i.stock), 0) AS stock
            FROM producto p
            INNER JOIN marca m ON p.id_marca = m.id_marca
            ${invJoin}
            ${where}
            GROUP BY p.id_producto
            HAVING SUM(i.stock) < 10
            ORDER BY SUM(i.stock) ASC, p.descripcion ASC
            LIMIT 100`,
            params
        );

        res.json({ code: 1, data: rows });
    } catch (error) {
        console.error('Error en kardex-inventario.getProductosMenorStock:', error);
        res.status(500).json({ code: 0, message: 'Error interno del servidor' });
    } finally {
        if (connection) connection.release();
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Stock mínimo con punto de reorden por producto (opcional, devuelve registros
// cuyo stock actual esté por debajo de su punto de reorden si existe; si no,
// devuelve los que tengan stock <= 0 como fallback conservador).
// ─────────────────────────────────────────────────────────────────────────────
const getStockMinimo = async (req, res) => {
    const id_tenant = req.id_tenant;
    let connection;

    try {
        connection = await getConnection();

        // Alerta contra `producto.stock_min` cuando el usuario lo configuró; si
        // no (NULL), cae al comportamiento anterior: "stock <= 0" literal.
        const [rows] = await connection.query(
            `SELECT
                p.id_producto AS codigo,
                p.descripcion AS nombre,
                m.nom_marca   AS marca,
                COALESCE(SUM(i.stock), 0) AS stock,
                p.stock_min
            FROM producto p
            INNER JOIN marca m   ON p.id_marca        = m.id_marca
            LEFT JOIN producto_sku psk ON psk.id_producto = p.id_producto AND psk.id_tenant = p.id_tenant
            LEFT JOIN inventario_stock i ON i.id_sku = psk.id_sku AND i.id_tenant = psk.id_tenant
            WHERE p.id_tenant = ?
            GROUP BY p.id_producto, p.stock_min
            HAVING stock <= COALESCE(p.stock_min, 0)
            ORDER BY stock ASC, p.descripcion ASC
            LIMIT 200`,
            [id_tenant]
        );

        res.json({ code: 1, data: rows });
    } catch (error) {
        console.error('Error en kardex-inventario.getStockMinimo:', error);
        res.status(500).json({ code: 0, message: 'Error interno del servidor' });
    } finally {
        if (connection) connection.release();
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Almacenes (réplica ligera del listado de kardex.controller.js, sin caché todavía).
// Se mantiene aquí para no obligar al frontend a duplicar dos endpoints.
// ─────────────────────────────────────────────────────────────────────────────
const getAlmacenes = async (req, res) => {
    const id_tenant = req.id_tenant;
    let connection;

    try {
        connection = await getConnection();

        const [rows] = await connection.query(
            `SELECT
                a.id_almacen AS id,
                a.nom_almacen AS almacen,
                COALESCE(s.nombre_sucursal, 'Sin Sucursal') AS sucursal
            FROM almacen a
            LEFT JOIN sucursal_almacen sa ON a.id_almacen = sa.id_almacen
            LEFT JOIN sucursal s ON sa.id_sucursal = s.id_sucursal
            WHERE a.estado_almacen = 1 AND a.id_tenant = ?
            ORDER BY a.nom_almacen`,
            [id_tenant]
        );

        res.json({ code: 1, data: rows, message: 'Almacenes listados' });
    } catch (error) {
        console.error('Error en kardex-inventario.getAlmacenes:', error);
        res.status(500).json({ code: 0, message: 'Error interno del servidor' });
    } finally {
        if (connection) connection.release();
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Detalle del kardex (movimientos de UN producto en un rango de fechas).
// Lee directo de `bitacora_nota` SIN joins a variantes: por construcción, el flujo
// "viejo" de notas de almacén apunta a `inventario` (producto + almacén) y no crea
// filas por variante, así que esta lectura es ya "limpia".
// ─────────────────────────────────────────────────────────────────────────────
const getDetalleKardex = async (req, res) => {
    const { fechaInicio, fechaFin, idProducto } = req.query;
    const { idAlmacen } = req.query;
    const id_tenant = req.id_tenant;
    let connection;

    try {
        connection = await getConnection();

        const [rows] = await connection.query(
            `SELECT
                bn.id_bitacora       AS id,
                DATE_FORMAT(bn.fecha, '%d/%m/%Y') AS fecha,
                COALESCE(c.num_comprobante, IF(bn.id_nota IS NULL AND bn.id_venta IS NULL, 'N/A', 'Sin comprobante')) AS documento,
                CASE
                    WHEN n.nom_nota IS NOT NULL THEN n.nom_nota
                    WHEN v.id_venta  IS NOT NULL THEN 'Venta'
                    ELSE 'Ajuste Manual / Carga Inicial'
                END AS nombre,
                bn.entra              AS entra,
                bn.sale               AS sale,
                bn.stock_actual       AS stock,
                CAST(p.precio AS DECIMAL(10, 2)) AS precio,
                CASE
                    WHEN n.glosa IS NOT NULL THEN n.glosa
                    WHEN v.id_venta IS NOT NULL THEN 'VENTA DE PRODUCTOS'
                    ELSE 'MOVIMIENTO DIRECTO DE INVENTARIO'
                END AS glosa,
                bn.hora_creacion      AS hora_creacion,
                COALESCE(un.usua, uv.usua, 'Sistema') AS usuario,
                COALESCE(ao.nom_almacen, abn.nom_almacen, 'N/A') AS almacen_origen,
                COALESCE(ad.nom_almacen, 'N/A')                AS almacen_destino,
                COALESCE(n.estado_nota, v.estado_venta, 1)      AS estado_doc
            FROM bitacora_nota bn
            INNER JOIN producto p ON bn.id_producto = p.id_producto
            LEFT  JOIN nota n    ON bn.id_nota     = n.id_nota
            LEFT  JOIN venta v   ON bn.id_venta    = v.id_venta
            LEFT  JOIN comprobante c
                   ON COALESCE(n.id_comprobante, v.id_comprobante) = c.id_comprobante
            LEFT  JOIN usuario un ON n.id_usuario  = un.id_usuario
            LEFT  JOIN usuario uv ON v.u_modifica  = uv.id_usuario
            LEFT  JOIN almacen ao ON n.id_almacenO = ao.id_almacen
            LEFT  JOIN almacen ad ON n.id_almacenD = ad.id_almacen
            LEFT  JOIN almacen abn ON bn.id_almacen = abn.id_almacen
            WHERE bn.fecha >= ?
              AND bn.fecha < DATE_ADD(?, INTERVAL 1 DAY)
              AND bn.id_producto = ?
              ${idAlmacen && idAlmacen !== '%' ? 'AND bn.id_almacen = ?' : ''}
              AND bn.id_tenant = ?
            ORDER BY bn.fecha ASC, bn.hora_creacion ASC`,
            idAlmacen && idAlmacen !== '%'
                ? [fechaInicio, fechaFin, idProducto, idAlmacen, id_tenant]
                : [fechaInicio, fechaFin, idProducto, id_tenant]
        );

        res.json({ code: 1, data: rows });
    } catch (error) {
        console.error('Error en kardex-inventario.getDetalleKardex:', error);
        res.status(500).json({ code: 0, message: 'Error interno del servidor' });
    } finally {
        if (connection) connection.release();
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Acumulado previo al rango (para mostrar "Saldo anterior").
// ─────────────────────────────────────────────────────────────────────────────
const getDetalleKardexAnteriores = async (req, res) => {
    const { fecha, idProducto } = req.query;
    const { idAlmacen } = req.query;
    const id_tenant = req.id_tenant;
    let connection;

    try {
        connection = await getConnection();

        const [rows] = await connection.query(
            `SELECT
                COUNT(*) AS numero,
                COALESCE(SUM(bn.entra), 0) AS entra,
                COALESCE(SUM(bn.sale),  0) AS sale
            FROM bitacora_nota bn
            WHERE bn.fecha < ?
              AND bn.id_producto = ?
              ${idAlmacen && idAlmacen !== '%' ? 'AND bn.id_almacen = ?' : ''}
              AND bn.id_tenant = ?`,
            idAlmacen && idAlmacen !== '%'
                ? [fecha, idProducto, idAlmacen, id_tenant]
                : [fecha, idProducto, id_tenant]
        );

        res.json({ code: 1, data: rows });
    } catch (error) {
        console.error('Error en kardex-inventario.getDetalleKardexAnteriores:', error);
        res.status(500).json({ code: 0, message: 'Error interno del servidor' });
    } finally {
        if (connection) connection.release();
    }
};

export const methods = {
    getProductos,
    getInfProducto,
    getProductosMenorStock,
    getStockMinimo,
    getAlmacenes,
    getDetalleKardex,
    getDetalleKardexAnteriores,
};
