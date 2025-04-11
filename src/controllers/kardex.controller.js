import { getConnection } from "./../database/database";
import ExcelJS from "exceljs";
const getProductos = async (req, res) => {
    const { descripcion = '', almacen = '', idProducto = '', marca = '', cat = '', subcat = '', stock = '' } = req.query;
    let connection;
    console.log('Filtros recibidos:', { descripcion, almacen, idProducto, marca, cat, subcat, stock });
    try {
        connection = await getConnection();

        // Construir la condición del filtro de stock
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
              ${stockCondition} -- Agregar la condición del filtro de stock
            GROUP BY p.id_producto, p.descripcion, m.nom_marca, i.stock
            ORDER BY p.id_producto, p.descripcion
            `,
            [`%${descripcion}%`, almacen, `%${idProducto}`, `%${marca}`, `%${cat}`, `%${subcat}`]
        );

        console.log('Productos encontrados:', productosResult);

        res.json({ code: 1, data: productosResult });
    } catch (error) {
        res.status(500).send(error.message);
    } finally {
        if (connection) {
            connection.release(); // Liberar la conexión
        }
    }
};



const getMovimientosProducto = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();
        const [result] = await connection.query(`
                SELECT id_producto, id_marca, SC.id_categoria, PR.id_subcategoria, descripcion, precio, cod_barras, undm, estado_producto
                FROM producto PR
                INNER JOIN sub_categoria SC ON PR.id_subcategoria = SC.id_subcategoria
                WHERE PR.id_producto = ?`, id);

        if (result.length === 0) {
            return res.status(404).json({ data: result, message: "Producto no encontrado" });
        }

        res.json({ code: 1, data: result, message: "Producto encontrado" });
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }   finally {
        if (connection) {
            connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
        }
    }
};

const getAlmacen = async (req, res) => {
    let connection;
    try {
      connection = await getConnection();
      const [result] = await connection.query(`
              SELECT a.id_almacen AS id, a.nom_almacen AS almacen, COALESCE(s.nombre_sucursal,'Sin Sucursal') AS sucursal 
              FROM almacen a 
              LEFT JOIN sucursal_almacen sa ON a.id_almacen = sa.id_almacen
              LEFT JOIN sucursal s ON sa.id_sucursal = s.id_sucursal
              WHERE a.estado_almacen = 1
          `);
      res.json({ code: 1, data: result, message: "Almacenes listados" });
    } catch (error) {
      res.status(500);
      res.send(error.message);
    }  finally {
        if (connection) {
            connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
        }
    }
  };

  const getMarcas = async (req, res) => {
    let connection;
    try {
      connection = await getConnection();
      const [result] = await connection.query(`
                SELECT id_marca AS id, nom_marca AS marca FROM marca
                WHERE estado_marca = 1;
          `);
      res.json({ code: 1, data: result, message: "Marcas listadas" });
    } catch (error) {
      res.status(500);
      res.send(error.message);
    }  finally {
        if (connection) {
            connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
        }
    }
  };

  const getSubCategorias= async (req, res) => {
    let connection;
    const { cat= '' } = req.query;

    console.log('Filtros recibidos:', { cat });
    try {
      connection = await getConnection();
      const [result] = await connection.query(`
                   SELECT id_subcategoria AS id, nom_subcat AS sub_categoria FROM sub_categoria
                    WHERE estado_subcat = 1
                    AND id_categoria = ?;
          `,
          [cat]);
      res.json({ code: 1, data: result, message: "Sub categorias listadas" });
    } catch (error) {
      res.status(500);
      res.send(error.message);
    } finally {
        if (connection) {
            connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
        }
    }
  };

  const getCategorias= async (req, res) => {
    let connection;
    try {
      connection = await getConnection();
      const [result] = await connection.query(`
                      SELECT id_categoria as id, nom_categoria as categoria FROM categoria
                      WHERE estado_categoria = 1;
          `);
      res.json({ code: 1, data: result, message: "Categorias listadas" });
    } catch (error) {
      res.status(500);
      res.send(error.message);
    } finally {
        if (connection) {
            connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
        }
    }
  };

  const getDetalleKardex = async (req, res) => {
    let connection;
    const { fechaInicio, fechaFin, idProducto, idAlmacen } = req.query;

    try {
        connection = await getConnection();

        // Consulta principal para obtener el detalle del Kardex
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
                        COALESCE(n.glosa, 'VENTA DE PRODUCTOS') AS glosa
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
                    ORDER BY 
                        bn.fecha;
            `,
            [fechaInicio, fechaFin, idProducto, idAlmacen]
        );

        // Iterar sobre cada documento y agregar productos si corresponde
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
                    WHERE c.num_comprobante = ?;
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
                    WHERE c.num_comprobante = ? ORDER BY c.id_comprobante DESC LIMIT 1;
                `;
            }

            // Ejecutar la consulta adicional si corresponde
            if (queryProductos) {
                const [productosResult] = await connection.query(queryProductos, [documento]);
                detalle.productos = productosResult; // Agregar los productos al resultado actual
            }
        }

        res.json({ code: 1, data: detalleKardexResult });
    } catch (error) {
        res.status(500).send(error.message);
    } finally {
        if (connection) {
            connection.release(); // Liberar la conexión
        }
    }
};




const getDetalleKardexAnteriores = async (req, res) => {
    const { fecha = '2024-08-01', idProducto ,idAlmacen } = req.query;
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
                AND bn.id_almacen = ?;
            `,
            [fecha, idProducto,idAlmacen]
        );

        res.json({ code: 1, data: detalleKardexAnterioresResult });
    } catch (error) {
        res.status(500).send(error.message);
    } finally {
        if (connection) {
            connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
        }
    }
};

const getInfProducto = async (req, res) => {
    let connection;
    const { idProducto ,idAlmacen } = req.query;
    
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
            GROUP BY codigo, descripcion, marca, stock;
            `,
            [idProducto,idAlmacen]
        );

        res.json({ code: 1, data: infProductoResult });
    } catch (error) {
        res.status(500).send(error.message);
    } finally {
        if (connection) {
            connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
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
            cell.value = null;  // Limpiar el contenido
            cell.style = {};    // Limpiar el estilo
        }
    }
};

const generateExcelReport = async (req, res) => {
    const { mes, year, almacen } = req.query;
    let connection;
    try {
        connection = await getConnection();

        // Validar parámetros
        if (!mes || !year || !almacen) {
            return res.status(400).send("Faltan parámetros requeridos (mes, year, almacen).");
        }

        // Llamar al procedimiento almacenado
        const [rows] = await connection.query(
            `CALL GetStockByDayForMonth(?, ?, ?)`,
            [mes, year, almacen]
        );

        if (!rows || rows.length === 0 || !rows[0]) {
            return res.status(404).send("No se encontraron datos para los parámetros proporcionados.");
        }

        // Crear el archivo Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Reporte Kardex");

        // --- Información inicial ---
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

        // --- Configurar columnas ---
        const columns = [
            { header: "Mes", key: "mes", width: 10 },
            { header: "Almacén", key: "nom_almacen", width: 20 },
            { header: "Descripción", key: "descripcion", width: 60 },
            { header: "Stock Comienzo", key: "stock_comienzo", width: 15 },
        ];

        // Agregar columnas dinámicas (días del mes)
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

        // Mover 'Stock Final' y 'Total Transacciones' al final
        columns.push(
            { header: "Stock Final", key: "stock_final", width: 15 },
            { header: "Total Transacciones", key: "total_transacciones", width: 20 }
        );

        worksheet.columns = columns;

        // --- Limpiar solo filas después de la fila 7 ---
        while (worksheet.rowCount > 7) {
            worksheet.spliceRows(8, 1); // Eliminar filas desde la fila 8
        }

        // --- Encabezados en la fila 8 ---
        const headerRow = worksheet.getRow(8);
        headerRow.values = columns.map((col) => col.header);

        // Formato de los encabezados
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "4069E5" }, // Color de fondo azul
            };
            cell.font = {
                color: { argb: "FFFFFF" }, // Texto blanco
                bold: true,
            };
            cell.alignment = { vertical: "middle", horizontal: "center" };
        });

        // --- Mapear y agregar los datos desde la fila 9 ---
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

            // Asegurarse de que 'stock_final' y 'total_transacciones' estén al final
            rowData["stock_final"] = row.stock_final || ""; // Asegúrate de que esté presente
            rowData["total_transacciones"] = row.total_transacciones || ""; // Asegúrate de que esté presente

            return rowData;
        });

        let startRow = 9;
        dataRows.forEach((row) => {
            worksheet.getRow(startRow).values = Object.values(row);
            startRow++;
        });

        // --- Aplicar bordes ---
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

        // --- Configurar headers y enviar el archivo ---
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
        console.error("Error al generar el reporte Excel:", error);
        res.status(500).send("Error al generar el reporte Excel.");
    } finally {
        if (connection) {
            connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
        }
    }
};



const generateExcelReportByDateRange = async (req, res) => {
    let connection;
    const { startDate, endDate, almacen } = req.query;

    try {
        connection = await getConnection();

        if (!startDate || !endDate || !almacen) {
            return res.status(400).send("Faltan parámetros requeridos (startDate, endDate, almacen).");
        }

        const [rows] = await connection.query(
            `CALL GetStockByDayForPeriod(?, ?, ?)`,
            [startDate, endDate, almacen]
        );

        if (!rows || rows.length === 0 || !rows[0]) {
            return res.status(404).send("No se encontraron datos para los parámetros proporcionados.");
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Reporte Kardex");

        // Información inicial
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

        // Configuración de columnas
        const columns = [
            { header: "Almacén", key: "Almacen", width: 20 },
            { header: "Descripción", key: "descripcion", width: 60 },
            { header: "Stock Comienzo", key: "stock_comienzo", width: 15 },
        ];

        const start = new Date(startDate);
        const end = new Date(endDate);

        // Agregar columnas dinámicas (fechas)
        for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
            const dayKey = d.toISOString().split("T")[0];
            const formattedDate = d.toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "2-digit",
            });
            columns.push({ header: formattedDate, key: dayKey, width: 15 });
        }

        // Agregar las columnas de "Stock Final" y "Total Transacciones"
        columns.push(
            { header: "Stock Final", key: "stock_final", width: 15 },
            { header: "Total Transacciones", key: "total_transacciones", width: 20 }
        );

        worksheet.columns = columns;

        // Función para limpiar un rango de celdas (si se requiere)
        const limpiarRango = (worksheet, startRow, startCol, endRow, endCol) => {
            for (let row = startRow; row <= endRow; row++) {
                for (let col = startCol; col <= endCol; col++) {
                    const cell = worksheet.getCell(row, col);
                    cell.value = null;
                    cell.style = {};
                }
            }
        };

        // Agregar encabezado en la fila 8
        const headerRow = worksheet.getRow(8);
        headerRow.values = columns.map((col) => col.header);

        // Establecer bordes y colores para los encabezados
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "4069E5" }, // Color de fondo azul
            };
            cell.font = {
                color: { argb: "FFFFFF" }, // Texto blanco
                bold: true,
            };
            cell.alignment = { vertical: "middle", horizontal: "center" };
        });

        // Agregar los datos en la fila 9
        const dataRows = rows[0];
        let startRow = 9;
        dataRows.forEach((row, index) => {
            worksheet.getRow(startRow).values = Object.values(row);
            startRow++;
        });

        // Aplicar bordes a la tabla
        worksheet.eachRow({ includeEmpty: true }, (row, rowIndex) => {
            if (rowIndex >= 8) {  // Solo aplicar bordes a las filas de datos (a partir de la fila 8)
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

        // Limpiar el rango de celdas que no se necesita (por ejemplo, fuera de los datos)
        limpiarRango2(worksheet, 1, 1, 1 ,37 ); // Ajusta el rango según sea necesario

        // Enviar el archivo como descarga
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
        res.status(500).send(error.message);
    } finally {
        if (connection) {
            connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
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
    generateExcelReportByDateRange
};