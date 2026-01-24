import { getConnection } from "./../database/database.js";
import ExcelJS from "exceljs";

// Cache para consultas frecuentes
const queryCache = new Map();
const CACHE_TTL = 60000; // 1 minuto

// Limpieza periódica del caché
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of queryCache.entries()) {
        if (now - value.timestamp > CACHE_TTL * 2) {
            queryCache.delete(key);
        }
    }
}, CACHE_TTL * 2);

// OBTENER PRODUCTOS - OPTIMIZADO
const getProductos = async (req, res) => {
    const { descripcion = '', almacen = '', idProducto = '', marca = '', cat = '', subcat = '', stock = '' } = req.query;
    const id_tenant = req.id_tenant;
    let connection;

    try {
        connection = await getConnection();

        // Construir filtros de manera dinámica con búsqueda flexible
        const whereClauses = ['p.id_tenant = ?'];
        const params = [id_tenant];

        if (almacen) {
            whereClauses.push('i.id_almacen = ?');
            params.push(almacen);
        }

        if (descripcion) {
            whereClauses.push('p.descripcion LIKE ?');
            params.push(`%${descripcion}%`);
        }

        if (idProducto) {
            whereClauses.push('p.id_producto = ?');
            params.push(idProducto);
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

        if (stock === 'con_stock') {
            whereClauses.push('i.stock > 0');
        } else if (stock === 'sin_stock') {
            whereClauses.push('i.stock = 0');
        }

        const where = `WHERE ${whereClauses.join(' AND ')}`;

        const [productosResult] = await connection.query(
            `SELECT 
                p.id_producto AS codigo, 
                p.descripcion AS descripcion, 
                m.nom_marca AS marca, 
                COALESCE(i.stock, 0) AS stock, 
                p.undm AS um, 
                CAST(p.precio AS DECIMAL(10, 2)) AS precio, 
                p.cod_barras, 
                p.estado_producto AS estado
            FROM producto p 
            INNER JOIN marca m ON p.id_marca = m.id_marca 
            INNER JOIN inventario i ON p.id_producto = i.id_producto 
            INNER JOIN sub_categoria CA ON CA.id_subcategoria = p.id_subcategoria
            ${where}
            ORDER BY p.descripcion
            LIMIT 500`,
            params
        );

        res.json({ code: 1, data: productosResult });
    } catch (error) {
        console.error('Error en getProductos:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// OBTENER PRODUCTOS CON STOCK MENOR A 10 - OPTIMIZADO
const getProductosMenorStock = async (req, res) => {
    const { sucursal = '' } = req.query;
    const id_tenant = req.id_tenant;
    let connection;

    try {
        connection = await getConnection();

        const whereClauses = ['i.stock < 10', 'p.id_tenant = ?'];
        const params = [id_tenant];

        if (sucursal) {
            whereClauses.push('sa.id_sucursal = ?');
            params.push(sucursal);
        }

        const where = `WHERE ${whereClauses.join(' AND ')}`;

        const [result] = await connection.query(
            `SELECT 
                p.id_producto AS codigo,
                p.descripcion AS nombre,
                m.nom_marca AS marca,
                COALESCE(i.stock, 0) AS stock
            FROM producto p
            INNER JOIN marca m ON p.id_marca = m.id_marca
            INNER JOIN inventario i ON p.id_producto = i.id_producto
            LEFT JOIN sucursal_almacen sa ON i.id_almacen = sa.id_almacen
            ${where}
            ORDER BY i.stock ASC, p.descripcion ASC
            LIMIT 100`,
            params
        );

        res.json({ code: 1, data: result });
    } catch (error) {
        console.error('Error en getProductosMenorStock:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// OBTENER MOVIMIENTOS DE UN PRODUCTO - OPTIMIZADO
const getMovimientosProducto = async (req, res) => {
    const { id } = req.params;
    const id_tenant = req.id_tenant;
    let connection;

    try {
        connection = await getConnection();

        const [result] = await connection.query(
            `SELECT 
                id_producto, 
                id_marca, 
                SC.id_categoria, 
                PR.id_subcategoria, 
                descripcion, 
                precio, 
                cod_barras, 
                undm, 
                estado_producto
            FROM producto PR
            INNER JOIN sub_categoria SC ON PR.id_subcategoria = SC.id_subcategoria
            WHERE PR.id_producto = ? AND PR.id_tenant = ?`,
            [id, id_tenant]
        );

        if (result.length === 0) {
            return res.status(404).json({
                code: 0,
                data: [],
                message: "Producto no encontrado"
            });
        }

        res.json({ code: 1, data: result, message: "Producto encontrado" });
    } catch (error) {
        console.error('Error en getMovimientosProducto:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// OBTENER ALMACENES - OPTIMIZADO CON CACHÉ
const getAlmacen = async (req, res) => {
    const id_tenant = req.id_tenant;
    const cacheKey = `almacenes_${id_tenant}`;

    // Verificar caché
    if (queryCache.has(cacheKey)) {
        const cached = queryCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return res.json({ code: 1, data: cached.data, message: "Almacenes listados (caché)" });
        }
        queryCache.delete(cacheKey);
    }

    let connection;
    try {
        connection = await getConnection();

        const [result] = await connection.query(
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

        // Guardar en caché
        queryCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });

        res.json({ code: 1, data: result, message: "Almacenes listados" });
    } catch (error) {
        console.error('Error en getAlmacen:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// OBTENER MARCAS - OPTIMIZADO CON CACHÉ
const getMarcas = async (req, res) => {
    const id_tenant = req.id_tenant;
    const cacheKey = `marcas_${id_tenant}`;

    // Verificar caché
    if (queryCache.has(cacheKey)) {
        const cached = queryCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return res.json({ code: 1, data: cached.data, message: "Marcas listadas (caché)" });
        }
        queryCache.delete(cacheKey);
    }

    let connection;
    try {
        connection = await getConnection();

        const [result] = await connection.query(
            `SELECT id_marca AS id, nom_marca AS marca 
            FROM marca
            WHERE estado_marca = 1 AND id_tenant = ?
            ORDER BY nom_marca`,
            [id_tenant]
        );

        // Guardar en caché
        queryCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });

        res.json({ code: 1, data: result, message: "Marcas listadas" });
    } catch (error) {
        console.error('Error en getMarcas:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// OBTENER SUBCATEGORÍAS - OPTIMIZADO CON CACHÉ
const getSubCategorias = async (req, res) => {
    const { cat = '' } = req.query;
    const id_tenant = req.id_tenant;
    const cacheKey = `subcategorias_${cat}_${id_tenant}`;

    // Verificar caché
    if (queryCache.has(cacheKey)) {
        const cached = queryCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return res.json({ code: 1, data: cached.data, message: "Subcategorías listadas (caché)" });
        }
        queryCache.delete(cacheKey);
    }

    let connection;
    try {
        connection = await getConnection();

        const [result] = await connection.query(
            `SELECT id_subcategoria AS id, nom_subcat AS sub_categoria 
            FROM sub_categoria
            WHERE estado_subcat = 1
                AND id_categoria = ?
                AND id_tenant = ?
            ORDER BY nom_subcat`,
            [cat, id_tenant]
        );

        // Guardar en caché
        queryCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });

        res.json({ code: 1, data: result, message: "Subcategorías listadas" });
    } catch (error) {
        console.error('Error en getSubCategorias:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// OBTENER CATEGORÍAS - OPTIMIZADO CON CACHÉ
const getCategorias = async (req, res) => {
    const id_tenant = req.id_tenant;
    const cacheKey = `categorias_${id_tenant}`;

    // Verificar caché
    if (queryCache.has(cacheKey)) {
        const cached = queryCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return res.json({ code: 1, data: cached.data, message: "Categorías listadas (caché)" });
        }
        queryCache.delete(cacheKey);
    }

    let connection;
    try {
        connection = await getConnection();

        const [result] = await connection.query(
            `SELECT id_categoria as id, nom_categoria as categoria 
            FROM categoria
            WHERE estado_categoria = 1 AND id_tenant = ?
            ORDER BY nom_categoria`,
            [id_tenant]
        );

        // Guardar en caché
        queryCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });

        res.json({ code: 1, data: result, message: "Categorías listadas" });
    } catch (error) {
        console.error('Error en getCategorias:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// OBTENER DETALLE KARDEX - OPTIMIZADO SIN N+1
const getDetalleKardex = async (req, res) => {
    const { fechaInicio, fechaFin, idProducto, idAlmacen } = req.query;
    const id_tenant = req.id_tenant;
    let connection;

    try {
        connection = await getConnection();

        // Query principal optimizada con LEFT JOIN para obtener productos en una sola consulta
        const [detalleKardexResult] = await connection.query(
            `SELECT
                bn.id_bitacora AS id,
                bn.fecha,
                DATE_FORMAT(bn.fecha, '%d/%m/%Y') AS fecha_formateada,
                COALESCE(c.num_comprobante, 'Sin comprobante') AS documento,
                COALESCE(n.nom_nota, 'Venta') AS nombre,
                bn.entra AS entra,
                bn.sale AS sale,
                bn.stock_actual AS stock,
                p.precio AS precio,
                COALESCE(n.glosa, 'VENTA DE PRODUCTOS') AS glosa,
                bn.hora_creacion,
                c.num_comprobante as num_comp_raw,
                -- Nuevos campos para historial detallado
                COALESCE(un.usua, uv.usua, 'Sistema') as usuario,
                COALESCE(ao.nom_almacen, abn.nom_almacen, 'N/A') as almacen_origen, 
                COALESCE(ad.nom_almacen, 'N/A') as almacen_destino,
                t.nombre as tonalidad,
                ta.nombre as talla,
                COALESCE(n.estado_nota, v.estado_venta, 1) as estado_doc,
                
                -- Productos de nota
                dn.id_producto AS nota_producto_codigo,
                pn.descripcion AS nota_producto_descripcion,
                mn.nom_marca AS nota_producto_marca,
                dn.cantidad AS nota_producto_cantidad,
                -- Productos de venta
                dv.id_producto AS venta_producto_codigo,
                pv.descripcion AS venta_producto_descripcion,
                mv.nom_marca AS venta_producto_marca,
                dv.cantidad AS venta_producto_cantidad
            FROM bitacora_nota bn
            INNER JOIN producto p ON bn.id_producto = p.id_producto 
            LEFT JOIN nota n ON bn.id_nota = n.id_nota
            LEFT JOIN venta v ON bn.id_venta = v.id_venta
            LEFT JOIN comprobante c ON COALESCE(n.id_comprobante, v.id_comprobante) = c.id_comprobante
            
            -- Joins para detalles extra
            LEFT JOIN usuario un ON n.id_usuario = un.id_usuario
            LEFT JOIN usuario uv ON v.u_modifica = uv.id_usuario
            LEFT JOIN almacen ao ON n.id_almacenO = ao.id_almacen       -- Almacen Origen Nota
            LEFT JOIN almacen ad ON n.id_almacenD = ad.id_almacen       -- Almacen Destino Nota
            LEFT JOIN almacen abn ON bn.id_almacen = abn.id_almacen     -- Almacen Bitacora (Origen Venta)
            
            LEFT JOIN tonalidad t ON bn.id_tonalidad = t.id_tonalidad
            LEFT JOIN talla ta ON bn.id_talla = ta.id_talla

            -- JOIN para productos de nota
            LEFT JOIN detalle_nota dn ON n.id_nota = dn.id_nota
            LEFT JOIN producto pn ON dn.id_producto = pn.id_producto
            LEFT JOIN marca mn ON pn.id_marca = mn.id_marca
            -- JOIN para productos de venta
            LEFT JOIN detalle_venta dv ON v.id_venta = dv.id_venta
            LEFT JOIN producto pv ON dv.id_producto = pv.id_producto
            LEFT JOIN marca mv ON pv.id_marca = mv.id_marca
            WHERE bn.fecha >= ?
                AND bn.fecha < DATE_ADD(?, INTERVAL 1 DAY)
                AND bn.id_producto = ?
                AND bn.id_almacen = ?
                AND bn.id_tenant = ?
            ORDER BY bn.fecha ASC, bn.hora_creacion ASC`, // Orden cronologico para consistencia
            [fechaInicio, fechaFin, idProducto, idAlmacen, id_tenant]
        );

        // Agrupar resultados por bitacora eliminando duplicados de productos
        const kardexMap = new Map();

        for (const row of detalleKardexResult) {
            const bitacoraId = row.id;

            if (!kardexMap.has(bitacoraId)) {
                kardexMap.set(bitacoraId, {
                    id: row.id,
                    fecha: row.fecha_formateada,
                    documento: row.documento,
                    nombre: row.nombre,
                    entra: row.entra,
                    sale: row.sale,
                    stock: row.stock,
                    precio: row.precio,
                    glosa: row.glosa,
                    hora_creacion: row.hora_creacion,
                    // Nuevos campos
                    usuario: row.usuario,
                    almacen_origen: row.almacen_origen,
                    almacen_destino: row.almacen_destino,
                    tonalidad: row.tonalidad || '-',
                    talla: row.talla || '-',
                    estado_doc: row.estado_doc,
                    productos: []
                });
            }

            const kardexItem = kardexMap.get(bitacoraId);

            // Agregar producto de nota si existe y no está duplicado
            if (row.nota_producto_codigo) {
                const exists = kardexItem.productos.some(p =>
                    p.codigo === row.nota_producto_codigo && p.cantidad === row.nota_producto_cantidad
                );
                if (!exists) {
                    kardexItem.productos.push({
                        codigo: row.nota_producto_codigo,
                        descripcion: row.nota_producto_descripcion,
                        marca: row.nota_producto_marca,
                        cantidad: row.nota_producto_cantidad
                    });
                }
            }

            // Agregar producto de venta si existe y no está duplicado
            if (row.venta_producto_codigo) {
                const exists = kardexItem.productos.some(p =>
                    p.codigo === row.venta_producto_codigo && p.cantidad === row.venta_producto_cantidad
                );
                if (!exists) {
                    kardexItem.productos.push({
                        codigo: row.venta_producto_codigo,
                        descripcion: row.venta_producto_descripcion,
                        marca: row.venta_producto_marca,
                        cantidad: row.venta_producto_cantidad
                    });
                }
            }
        }

        const resultado = Array.from(kardexMap.values());
        res.json({ code: 1, data: resultado });
    } catch (error) {
        console.error('Error en getDetalleKardex:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// OBTENER DETALLE KARDEX ANTERIORES - OPTIMIZADO
const getDetalleKardexAnteriores = async (req, res) => {
    const { fecha = '2024-08-01', idProducto, idAlmacen } = req.query;
    const id_tenant = req.id_tenant;
    let connection;

    try {
        connection = await getConnection();

        const [detalleKardexAnterioresResult] = await connection.query(
            `SELECT 
                COUNT(*) AS numero, 
                COALESCE(SUM(bn.entra), 0) AS entra, 
                COALESCE(SUM(bn.sale), 0) AS sale
            FROM bitacora_nota bn 
            WHERE bn.fecha < ?
                AND bn.id_producto = ?
                AND bn.id_almacen = ?
                AND bn.id_tenant = ?`,
            [fecha, idProducto, idAlmacen, id_tenant]
        );

        res.json({ code: 1, data: detalleKardexAnterioresResult });
    } catch (error) {
        console.error('Error en getDetalleKardexAnteriores:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// OBTENER INFORMACIÓN DE PRODUCTO - OPTIMIZADO
const getInfProducto = async (req, res) => {
    const { idProducto, idAlmacen } = req.query;
    const id_tenant = req.id_tenant;
    let connection;

    try {
        connection = await getConnection();

        const [infProductoResult] = await connection.query(
            `SELECT 
                p.id_producto AS codigo, 
                p.descripcion AS descripcion, 
                m.nom_marca AS marca, 
                COALESCE(i.stock, 0) AS stock
            FROM producto p 
            INNER JOIN marca m ON p.id_marca = m.id_marca
            LEFT JOIN inventario i ON p.id_producto = i.id_producto AND i.id_almacen = ?
            WHERE p.id_producto = ?
                AND p.id_tenant = ?
            LIMIT 1`,
            [idAlmacen, idProducto, id_tenant]
        );

        if (infProductoResult.length === 0) {
            return res.status(404).json({
                code: 0,
                data: [],
                message: "Producto no encontrado"
            });
        }

        res.json({ code: 1, data: infProductoResult });
    } catch (error) {
        console.error('Error en getInfProducto:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// Funciones auxiliares para Excel
const limpiarRango = (worksheet, startCol, endCol, row) => {
    for (let col = startCol; col <= endCol; col++) {
        worksheet.getCell(row, col).value = null;
        worksheet.getCell(row, col).style = {};
    }
};

const limpiarRango2 = (worksheet, startRow, startCol, endRow, endCol) => {
    for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
            const cell = worksheet.getCell(row, col);
            cell.value = null;
            cell.style = {};
        }
    }
};

// GENERAR REPORTE EXCEL POR MES - OPTIMIZADO
const generateExcelReport = async (req, res) => {
    const { mes, year, almacen } = req.query;
    const id_tenant = req.id_tenant;
    let connection;

    try {
        connection = await getConnection();

        if (!mes || !year || !almacen) {
            return res.status(400).json({
                code: 0,
                message: "Faltan parámetros requeridos (mes, year, almacen)"
            });
        }

        const [rows] = await connection.query(
            `CALL GetStockByDayForMonth(?, ?, ?, ?)`,
            [mes, year, almacen, id_tenant]
        );

        if (!rows || rows.length === 0 || !rows[0]) {
            return res.status(404).json({
                code: 0,
                message: "No se encontraron datos para los parámetros proporcionados"
            });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Reporte Kardex");

        worksheet.mergeCells("A2:F2");
        worksheet.getCell("A2").value =
            "FORMATO 13.1: REGISTRO DE INVENTARIO PERMANENTE VALORIZADO - DETALLE DEL INVENTARIO VALORIZADO";
        worksheet.getCell("A2").font = { bold: true, size: 14 };
        worksheet.getCell("A2").alignment = { horizontal: "left" };

        worksheet.mergeCells("A3:F3");
        worksheet.getCell("A3").value = `PERIODO: ${mes}/${year}`;
        worksheet.getCell("A3").font = { bold: true, size: 12 };
        worksheet.getCell("A3").alignment = { horizontal: "left" };

        worksheet.mergeCells("A4:F4");
        worksheet.getCell("A4").value = "RUC: 20610588981";
        worksheet.getCell("A4").font = { bold: true, size: 12 };
        worksheet.getCell("A4").alignment = { horizontal: "left" };

        worksheet.mergeCells("A5:F5");
        worksheet.getCell("A5").value =
            "APELLIDOS Y NOMBRES, DENOMINACIÓN O RAZÓN SOCIAL: Tormenta";
        worksheet.getCell("A5").font = { bold: true, size: 12 };
        worksheet.getCell("A5").alignment = { horizontal: "left" };

        const columns = [
            { header: "Mes", key: "mes", width: 10 },
            { header: "Almacén", key: "nom_almacen", width: 20 },
            { header: "Descripción", key: "descripcion", width: 60 },
            { header: "Stock Comienzo", key: "stock_comienzo", width: 15 },
        ];

        const daysInMonth = new Date(year, mes, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            const day = i.toString().padStart(2, "0");
            const formattedMonth = mes.toString().padStart(2, "0");
            columns.push({
                header: `${day}/${formattedMonth}`,
                key: `${day}/${formattedMonth}`,
                width: 15,
            });
        }

        columns.push(
            { header: "Stock Final", key: "stock_final", width: 15 },
            { header: "Total Transacciones", key: "total_transacciones", width: 20 }
        );

        worksheet.columns = columns;

        while (worksheet.rowCount > 7) {
            worksheet.spliceRows(8, 1);
        }

        const headerRow = worksheet.getRow(8);
        headerRow.values = columns.map((col) => col.header);

        headerRow.eachCell((cell) => {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "4069E5" },
            };
            cell.font = {
                color: { argb: "FFFFFF" },
                bold: true,
            };
            cell.alignment = { vertical: "middle", horizontal: "center" };
        });

        const dataRows = rows[0].map((row) => {
            const rowData = { ...row };
            for (let i = 1; i <= daysInMonth; i++) {
                const day = i.toString().padStart(2, "0");
                const formattedMonth = mes.toString().padStart(2, "0");
                const key = `${day}/${formattedMonth}`;
                if (!(key in rowData)) {
                    rowData[key] = "";
                }
            }
            rowData["stock_final"] = row.stock_final || "";
            rowData["total_transacciones"] = row.total_transacciones || "";
            return rowData;
        });

        let startRow = 9;
        dataRows.forEach((row) => {
            worksheet.getRow(startRow).values = Object.values(row);
            startRow++;
        });

        worksheet.eachRow({ includeEmpty: true }, (row, rowIndex) => {
            if (rowIndex >= 8) {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: "thin" },
                        left: { style: "thin" },
                        bottom: { style: "thin" },
                        right: { style: "thin" },
                    };
                });
            }
        });

        limpiarRango(worksheet, 1, 37, 1);

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=reporte-kardex-${mes}-${year}.xlsx`
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error al generar reporte Excel:', error);
        res.status(500).json({
            code: 0,
            message: "Error al generar el reporte Excel"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// GENERAR REPORTE EXCEL POR RANGO DE FECHAS - OPTIMIZADO
const generateExcelReportByDateRange = async (req, res) => {
    const { startDate, endDate, almacen } = req.query;
    const id_tenant = req.id_tenant;
    let connection;

    try {
        connection = await getConnection();

        if (!startDate || !endDate || !almacen) {
            return res.status(400).json({
                code: 0,
                message: "Faltan parámetros requeridos (startDate, endDate, almacen)"
            });
        }

        const [rows] = await connection.query(
            `CALL GetStockByDayForPeriod(?, ?, ?, ?)`,
            [startDate, endDate, almacen, id_tenant]
        );

        if (!rows || rows.length === 0 || !rows[0]) {
            return res.status(404).json({
                code: 0,
                message: "No se encontraron datos para los parámetros proporcionados"
            });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Reporte Kardex");

        worksheet.mergeCells("A2:F2");
        worksheet.getCell("A2").value =
            "FORMATO 13.1: REGISTRO DE INVENTARIO PERMANENTE VALORIZADO - DETALLE DEL INVENTARIO VALORIZADO";
        worksheet.getCell("A2").font = { bold: true, size: 14 };

        worksheet.mergeCells("A3:F3");
        worksheet.getCell("A3").value = `PERIODO: ${startDate} - ${endDate}`;
        worksheet.getCell("A3").font = { bold: true, size: 12 };

        worksheet.mergeCells("A4:F4");
        worksheet.getCell("A4").value = "RUC: 20610588981";
        worksheet.getCell("A4").font = { bold: true, size: 12 };
        worksheet.getCell("A4").alignment = { horizontal: "left" };

        worksheet.mergeCells("A5:F5");
        worksheet.getCell("A5").value =
            "APELLIDOS Y NOMBRES, DENOMINACIÓN O RAZÓN SOCIAL: Tormenta";
        worksheet.getCell("A5").font = { bold: true, size: 12 };
        worksheet.getCell("A5").alignment = { horizontal: "left" };

        const columns = [
            { header: "Almacén", key: "Almacen", width: 20 },
            { header: "Descripción", key: "descripcion", width: 60 },
            { header: "Stock Comienzo", key: "stock_comienzo", width: 15 },
        ];

        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
            const dayKey = d.toISOString().split("T")[0];
            const formattedDate = d.toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "2-digit",
            });
            columns.push({ header: formattedDate, key: dayKey, width: 15 });
        }

        columns.push(
            { header: "Stock Final", key: "stock_final", width: 15 },
            { header: "Total Transacciones", key: "total_transacciones", width: 20 }
        );

        worksheet.columns = columns;

        const headerRow = worksheet.getRow(8);
        headerRow.values = columns.map((col) => col.header);

        headerRow.eachCell((cell) => {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "4069E5" },
            };
            cell.font = {
                color: { argb: "FFFFFF" },
                bold: true,
            };
            cell.alignment = { vertical: "middle", horizontal: "center" };
        });

        const dataRows = rows[0];
        let startRow = 9;
        dataRows.forEach((_row) => {
            worksheet.getRow(startRow).values = Object.values(_row);
            startRow++;
        });

        worksheet.eachRow({ includeEmpty: true }, (row, rowIndex) => {
            if (rowIndex >= 8) {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: "thin" },
                        left: { style: "thin" },
                        bottom: { style: "thin" },
                        right: { style: "thin" },
                    };
                });
            }
        });

        limpiarRango2(worksheet, 1, 1, 1, 37);

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=reporte-kardex-${startDate}-${endDate}.xlsx`
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error al generar reporte Excel por rango:', error);
        res.status(500).json({
            code: 0,
            message: "Error al generar el reporte Excel"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

export const methods = {
    getProductos,
    getAlmacen,
    getMovimientosProducto,
    getMarcas,
    getSubCategorias,
    getCategorias,
    getDetalleKardex,
    getDetalleKardexAnteriores,
    getInfProducto,
    generateExcelReport,
    generateExcelReportByDateRange,
    getProductosMenorStock
};
