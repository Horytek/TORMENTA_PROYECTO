import { getConnection } from "./../database/database";
import ExcelJS from "exceljs";

const { subDays, subWeeks, subMonths, subYears, format } = require("date-fns");

const getProductos = async (req, res) => {
    const { descripcion = '', almacen = '', idProducto = '', marca = '', cat = '', subcat = '', stock = '' } = req.query;
    const id_tenant = req.id_tenant;
    let connection;
    try {
        connection = await getConnection();

        let stockCondition = '';
        if (stock === 'con_stock') {
            stockCondition = 'AND i.stock > 0';
        } else if (stock === 'sin_stock') {
            stockCondition = 'AND i.stock = 0';
        }

        const [productosResult] = await connection.query(
            `
            SELECT 
                p.id_producto as codigo, 
                p.descripcion as descripcion, 
                m.nom_marca as marca, 
                COALESCE(i.stock, 0) AS stock, 
                p.undm as um, 
                CAST(p.precio AS DECIMAL(10, 2)) AS precio, 
                p.cod_barras, 
                p.estado_producto as estado
            FROM producto p 
            INNER JOIN marca m ON p.id_marca = m.id_marca 
            INNER JOIN inventario i ON p.id_producto = i.id_producto 
            INNER JOIN sub_categoria CA ON CA.id_subcategoria = p.id_subcategoria
            WHERE p.descripcion LIKE ?
              AND i.id_almacen = ?
              AND p.id_producto LIKE ?
              AND m.id_marca LIKE ?
              AND CA.id_categoria LIKE ?
              AND CA.id_subcategoria LIKE ?
              ${stockCondition}
              AND p.id_tenant = ?
            GROUP BY p.id_producto, p.descripcion, m.nom_marca, i.stock
            ORDER BY p.id_producto, p.descripcion
            `,
            [`%${descripcion}%`, almacen, `%${idProducto}`, `%${marca}`, `%${cat}`, `%${subcat}`, id_tenant]
        );

        res.json({ code: 1, data: productosResult });
    } catch (error) {
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const getProductosMenorStock = async (req, res) => {
    const { sucursal = '' } = req.query;
    const id_tenant = req.id_tenant;
    let connection;
    try {
        connection = await getConnection();

        let whereClauses = ['i.stock < 10', 'p.id_tenant = ?'];
        let params = [id_tenant];

        if (sucursal) {
            whereClauses.push('sa.id_sucursal LIKE ?');
            params.push(sucursal);
        }

        const where = `WHERE ${whereClauses.join(' AND ')}`;

        const [result] = await connection.query(
            `
            SELECT 
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
            `,
            params
        );

        res.json({ code: 1, data: result });
    } catch (error) {
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const getMovimientosProducto = async (req, res) => {
    let connection;
    const id_tenant = req.id_tenant;
    try {
        const { id } = req.params;
        connection = await getConnection();
        const [result] = await connection.query(`
                SELECT id_producto, id_marca, SC.id_categoria, PR.id_subcategoria, descripcion, precio, cod_barras, undm, estado_producto
                FROM producto PR
                INNER JOIN sub_categoria SC ON PR.id_subcategoria = SC.id_subcategoria
                WHERE PR.id_producto = ? AND PR.id_tenant = ?`, [id, id_tenant]);

        if (result.length === 0) {
            return res.status(404).json({ data: result, message: "Producto no encontrado" });
        }

        res.json({ code: 1, data: result, message: "Producto encontrado" });
    } catch (error) {
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    }   finally {
        if (connection) {
            connection.release();
        }
    }
};

const getAlmacen = async (req, res) => {
    let connection;
    const id_tenant = req.id_tenant;
    try {
      connection = await getConnection();
      const [result] = await connection.query(`
              SELECT a.id_almacen AS id, a.nom_almacen AS almacen, COALESCE(s.nombre_sucursal,'Sin Sucursal') AS sucursal 
              FROM almacen a 
              LEFT JOIN sucursal_almacen sa ON a.id_almacen = sa.id_almacen
              LEFT JOIN sucursal s ON sa.id_sucursal = s.id_sucursal
              WHERE a.estado_almacen = 1 AND a.id_tenant = ?
          `, [id_tenant]);
      res.json({ code: 1, data: result, message: "Almacenes listados" });
    } catch (error) {
      res.status(500).json({ code: 0, message: "Error interno del servidor" });
    }  finally {
        if (connection) {
            connection.release();
        }
    }
  };

const getMarcas = async (req, res) => {
    let connection;
    const id_tenant = req.id_tenant;
    try {
      connection = await getConnection();
      const [result] = await connection.query(`
                SELECT id_marca AS id, nom_marca AS marca FROM marca
                WHERE estado_marca = 1 AND id_tenant = ?;
          `, [id_tenant]);
      res.json({ code: 1, data: result, message: "Marcas listadas" });
    } catch (error) {
      res.status(500).json({ code: 0, message: "Error interno del servidor" });
    }  finally {
        if (connection) {
            connection.release();
        }
    }
  };

const getSubCategorias= async (req, res) => {
    let connection;
    const { cat= '' } = req.query;
    const id_tenant = req.id_tenant;
    try {
      connection = await getConnection();
      const [result] = await connection.query(`
                   SELECT id_subcategoria AS id, nom_subcat AS sub_categoria FROM sub_categoria
                    WHERE estado_subcat = 1
                    AND id_categoria = ?
                    AND id_tenant = ?;
          `,
          [cat, id_tenant]);
      res.json({ code: 1, data: result, message: "Sub categorias listadas" });
    } catch (error) {
      res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
  };

const getCategorias= async (req, res) => {
    let connection;
    const id_tenant = req.id_tenant;
    try {
      connection = await getConnection();
      const [result] = await connection.query(`
                      SELECT id_categoria as id, nom_categoria as categoria FROM categoria
                      WHERE estado_categoria = 1 AND id_tenant = ?;
          `, [id_tenant]);
      res.json({ code: 1, data: result, message: "Categorias listadas" });
    } catch (error) {
      res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
  };

const getDetalleKardex = async (req, res) => {
    let connection;
    const { fechaInicio, fechaFin, idProducto, idAlmacen } = req.query;
    const id_tenant = req.id_tenant;

    try {
        connection = await getConnection();

        const [detalleKardexResult] = await connection.query(
            `
                    SELECT
                        bn.id_bitacora AS id,	  
                        DATE_FORMAT(bn.fecha, '%d/%m/%Y') AS fecha,
                        COALESCE(c.num_comprobante, 'Sin comprobante') AS documento, 
                        COALESCE(n.nom_nota, 'Venta') AS nombre, 
                        bn.entra AS entra,
                        bn.sale AS sale,
                        bn.stock_actual AS stock, 
                        p.precio AS precio,
                        COALESCE(n.glosa, 'VENTA DE PRODUCTOS') AS glosa,
                        bn.hora_creacion
                    FROM 
                        bitacora_nota bn
                    INNER JOIN 
                        producto p ON bn.id_producto = p.id_producto 
                    LEFT JOIN 
                        nota n ON bn.id_nota = n.id_nota
                    LEFT JOIN 
                        venta v ON bn.id_venta = v.id_venta
                    LEFT JOIN 
                        comprobante c ON COALESCE(n.id_comprobante, v.id_comprobante) = c.id_comprobante 
                    WHERE 
                        DATE_FORMAT(bn.fecha, '%Y-%m-%d') >= ?
                        AND DATE_FORMAT(bn.fecha, '%Y-%m-%d') <= ?
                        AND bn.id_producto = ?
                        AND bn.id_almacen = ?
                        AND bn.id_tenant = ?
                    ORDER BY 
                        bn.fecha, bn.hora_creacion desc;
            `,
            [fechaInicio, fechaFin, idProducto, idAlmacen, id_tenant]
        );

        for (const detalle of detalleKardexResult) {
            const documento = detalle.documento;
            const letraInicial = documento.charAt(0);

            let queryProductos;

            if (letraInicial === 'I' || letraInicial === 'S') {
                queryProductos = `
                    SELECT 
                        dn.id_producto AS codigo,
                        p.descripcion AS descripcion,
                        m.nom_marca AS marca,
                        dn.cantidad AS cantidad
                    FROM nota n 
                    INNER JOIN detalle_nota dn ON n.id_nota = dn.id_nota
                    INNER JOIN comprobante c ON n.id_comprobante = c.id_comprobante
                    INNER JOIN producto p ON dn.id_producto = p.id_producto
                    INNER JOIN marca m ON p.id_marca = m.id_marca
                    WHERE c.num_comprobante = ? AND n.id_tenant = ?;
                `;
            } else if (letraInicial === 'N' || letraInicial === 'B' || letraInicial === 'F') {
                queryProductos = `
                    SELECT 
                        dv.id_producto AS codigo,
                        p.descripcion AS descripcion,
                        m.nom_marca AS marca,
                        dv.cantidad AS cantidad
                    FROM venta v 
                    INNER JOIN detalle_venta dv ON v.id_venta = dv.id_venta
                    INNER JOIN comprobante c ON v.id_comprobante = c.id_comprobante
                    INNER JOIN producto p ON dv.id_producto = p.id_producto
                    INNER JOIN marca m ON p.id_marca = m.id_marca
                    WHERE c.num_comprobante = ? AND v.id_tenant = ? ORDER BY c.id_comprobante DESC LIMIT 1;
                `;
            }

            if (queryProductos) {
                const [productosResult] = await connection.query(queryProductos, [documento, id_tenant]);
                detalle.productos = productosResult;
            }
        }

        res.json({ code: 1, data: detalleKardexResult });
    } catch (error) {
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const getDetalleKardexAnteriores = async (req, res) => {
    const { fecha = '2024-08-01', idProducto ,idAlmacen } = req.query;
    const id_tenant = req.id_tenant;
    let connection;
    try {
        connection = await getConnection();

        const [detalleKardexAnterioresResult] = await connection.query(
            `
            SELECT 
                COUNT(*) AS numero, 
                COALESCE(SUM(bn.entra), 0) AS entra, 
                COALESCE(SUM(bn.sale), 0) AS sale
            FROM 
                bitacora_nota bn 
            WHERE 
                DATE_FORMAT(bn.fecha, '%Y-%m-%d') < ?
                AND bn.id_producto = ?
                AND bn.id_almacen = ?
                AND bn.id_tenant = ?;
            `,
            [fecha, idProducto, idAlmacen, id_tenant]
        );

        res.json({ code: 1, data: detalleKardexAnterioresResult });
    } catch (error) {
       res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const getInfProducto = async (req, res) => {
    let connection;
    const { idProducto ,idAlmacen } = req.query;
    const id_tenant = req.id_tenant;
    try {
        connection = await getConnection();

        const [infProductoResult] = await connection.query(
            `
            SELECT p.id_producto AS codigo, p.descripcion AS descripcion, m.nom_marca AS marca, i.stock AS stock
            FROM producto p 
            INNER JOIN marca m on p.id_marca = m.id_marca
            INNER JOIN inventario i on p.id_producto = i.id_producto
            WHERE p.id_producto = ?
            AND i.id_almacen = ?
            AND p.id_tenant = ?
            GROUP BY codigo, descripcion, marca, stock;
            `,
            [idProducto, idAlmacen, id_tenant]
        );

        res.json({ code: 1, data: infProductoResult });
    } catch (error) {
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

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

const generateExcelReport = async (req, res) => {
    const { mes, year, almacen } = req.query;
    const id_tenant = req.id_tenant;
    let connection;
    try {
        connection = await getConnection();

        if (!mes || !year || !almacen) {
            return res.status(400).send("Faltan parámetros requeridos (mes, year, almacen).");
        }

        const [rows] = await connection.query(
            `CALL GetStockByDayForMonth(?, ?, ?, ?)`,
            [mes, year, almacen, id_tenant]
        );

        if (!rows || rows.length === 0 || !rows[0]) {
            return res.status(404).send("No se encontraron datos para los parámetros proporcionados.");
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
        res.status(500).send("Error al generar el reporte Excel.");
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const generateExcelReportByDateRange = async (req, res) => {
    let connection;
    const { startDate, endDate, almacen } = req.query;
    const id_tenant = req.id_tenant;

    try {
        connection = await getConnection();

        if (!startDate || !endDate || !almacen) {
            return res.status(400).send("Faltan parámetros requeridos (startDate, endDate, almacen).");
        }

        const [rows] = await connection.query(
            `CALL GetStockByDayForPeriod(?, ?, ?, ?)`,
            [startDate, endDate, almacen, id_tenant]
        );

        if (!rows || rows.length === 0 || !rows[0]) {
            return res.status(404).send("No se encontraron datos para los parámetros proporcionados.");
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

        const limpiarRango = (worksheet, startRow, startCol, endRow, endCol) => {
            for (let row = startRow; row <= endRow; row++) {
                for (let col = startCol; col <= endCol; col++) {
                    const cell = worksheet.getCell(row, col);
                    cell.value = null;
                    cell.style = {};
                }
            }
        };

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
        dataRows.forEach((row, index) => {
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

        limpiarRango2(worksheet, 1, 1, 1 ,37 );

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
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
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