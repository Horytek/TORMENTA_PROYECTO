import { getConnection } from "./../database/database";

const getTotalProductosVendidos = async (req, res) => {
  let connection;
  const { id_sucursal } = req.query;

  try {
    connection = await getConnection();

    let query = `
      SELECT SUM(dv.cantidad) AS total_productos_vendidos
      FROM detalle_venta dv
      JOIN venta v ON dv.id_venta = v.id_venta
    `;

    const params = [];

    if (id_sucursal) {
      query += ` WHERE v.id_sucursal = ?`;
      params.push(id_sucursal);
    }

    const [result] = await connection.query(query, params);
    const totalProductosVendidos = result[0].total_productos_vendidos || 0;

    res.json({ code: 1, totalProductosVendidos, message: "Total de productos vendidos obtenido correctamente" });
  } catch (error) {
    res.status(500).send(error.message);
  }  finally {
    if (connection) {
        connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
    }
}
};


const getTotalSalesRevenue = async (req, res) => {
  let connection;
  const { id_sucursal } = req.query;

  try {
    connection = await getConnection();

    let query = `
      SELECT SUM(dv.total) AS totalRevenue 
      FROM detalle_venta dv
      JOIN venta v ON dv.id_venta = v.id_venta
    `;

    const params = [];

    if (id_sucursal) {
      query += ` WHERE v.id_sucursal = ?`;
      params.push(id_sucursal);
    }

    const [result] = await connection.query(query, params);
    res.status(200).json({ totalRevenue: result[0].totalRevenue || 0 });
  } catch (error) {
    console.error('Error en el servidor:', error.message);
    res.status(500).json({ message: "Error al obtener el total de ventas", error: error.message });
  }   finally {
    if (connection) {
        connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
    }
}
};


const getProductoMasVendido = async (req, res) => {
  let connection;
  const { id_sucursal } = req.query;

  try {
    connection = await getConnection();

    let query = `
      SELECT 
        p.id_producto,
        p.descripcion,
        SUM(dv.cantidad) AS total_vendido
      FROM 
        detalle_venta dv
      JOIN 
        producto p ON dv.id_producto = p.id_producto
      JOIN 
        venta v ON dv.id_venta = v.id_venta
    `;

    const params = [];

    if (id_sucursal) {
      query += ` WHERE v.id_sucursal = ?`;
      params.push(id_sucursal);
    }

    query += `
      GROUP BY 
        p.id_producto, p.descripcion
      ORDER BY 
        total_vendido DESC
      LIMIT 1
    `;

    const [result] = await connection.query(query, params);

    if (result.length === 0) {
      return res.status(404).json({ message: "No se encontraron productos vendidos." });
    }

    const productoMasVendido = result[0];
    res.json({ code: 1, data: productoMasVendido, message: "Producto más vendido obtenido correctamente" });
  } catch (error) {
    res.status(500).send(error.message);
  }  finally {
    if (connection) {
        connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
    }
}
};


const getCantidadVentasPorSubcategoria = async (req, res) => {
  let connection;
  const { id_sucursal } = req.query;

  try {
    connection = await getConnection();

    let query = `
      SELECT 
        sc.nom_subcat AS subcategoria,
        SUM(dv.cantidad) AS cantidad_vendida
      FROM 
        detalle_venta dv
      JOIN 
        producto p ON dv.id_producto = p.id_producto
      JOIN 
        sub_categoria sc ON p.id_subcategoria = sc.id_subcategoria
      JOIN 
        venta v ON dv.id_venta = v.id_venta
    `;

    const params = [];

    if (id_sucursal) {
      query += ` WHERE v.id_sucursal = ?`;
      params.push(id_sucursal);
    }

    query += `
      GROUP BY 
        sc.nom_subcat
      ORDER BY 
        cantidad_vendida DESC
    `;

    const [result] = await connection.query(query, params);
    res.json({ code: 1, data: result, message: "Cantidad de ventas por subcategoría obtenida correctamente" });
  } catch (error) {
    res.status(500).send(error.message);
  }  finally {
    if (connection) {
        connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
    }
}
};


const getCantidadVentasPorProducto = async (req, res) => {
  let connection;
  const { id_sucursal } = req.query;

  try {
    connection = await getConnection();

    let query = `
      SELECT 
        p.id_producto,
        p.descripcion,
        SUM(dv.cantidad) AS cantidad_vendida,
        SUM(dv.total) AS dinero_generado
      FROM 
        detalle_venta dv
      JOIN 
        producto p ON dv.id_producto = p.id_producto
      JOIN 
        venta v ON dv.id_venta = v.id_venta
    `;

    const params = [];

    if (id_sucursal) {
      query += ` WHERE v.id_sucursal = ?`;
      params.push(id_sucursal);
    }

    query += `
      GROUP BY 
        p.id_producto, p.descripcion
      ORDER BY 
        cantidad_vendida DESC
    `;

    const [result] = await connection.query(query, params);
    res.json({ code: 1, data: result, message: "Cantidad de ventas por producto obtenida correctamente" });
  } catch (error) {
    res.status(500).send(error.message);
  }  finally {
    if (connection) {
        connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
    }
}
};


const getAnalisisGananciasSucursales = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const [result] = await connection.query(`
          SELECT 
              s.nombre_sucursal AS sucursal,
              DATE_FORMAT(v.f_venta, '%b %y') AS mes,
              SUM(dv.total) AS ganancias
          FROM 
              sucursal s
          JOIN 
              venta v ON s.id_sucursal = v.id_sucursal
          JOIN 
              detalle_venta dv ON v.id_venta = dv.id_venta
          GROUP BY 
              s.id_sucursal, mes
          ORDER BY 
              mes, s.id_sucursal
      `);

    res.json({ code: 1, data: result, message: "Análisis de ganancias por sucursal obtenido correctamente" });
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).send(error.message);
    }
  }   finally {
    if (connection) {
        connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
    }
}
};

const getVentasPDF = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();

    const [result] = await connection.query(`
      SELECT 
          v.id_venta AS id, 
          SUBSTRING(com.num_comprobante, 2, 3) AS serieNum, 
          SUBSTRING(com.num_comprobante, 6, 8) AS num,
          CASE 
              WHEN tp.nom_tipocomp = 'Nota de venta' THEN 'Nota' 
              ELSE tp.nom_tipocomp 
          END AS tipoComprobante, 
          CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente_n, 
          cl.razon_social AS cliente_r,
          cl.dni AS dni, 
          cl.ruc AS ruc, 
          DATE_FORMAT(v.f_venta, '%Y-%m-%d') AS fecha, 
          v.igv AS igv, 
          SUM(dv.total) AS total, 
          CONCAT(ve.nombres, ' ', ve.apellidos) AS cajero,
          ve.dni AS cajeroId, 
          v.estado_venta AS estado, 
          s.nombre_sucursal, 
          s.ubicacion, 
          cl.direccion, 
          v.fecha_iso, 
          v.metodo_pago, 
          v.estado_sunat, 
          vb.id_venta_boucher, 
          usu.usua, 
          v.observacion
      FROM 
          venta v
      INNER JOIN 
          comprobante com ON com.id_comprobante = v.id_comprobante
      INNER JOIN 
          tipo_comprobante tp ON tp.id_tipocomprobante = com.id_tipocomprobante
      INNER JOIN 
          cliente cl ON cl.id_cliente = v.id_cliente
      INNER JOIN 
          detalle_venta dv ON dv.id_venta = v.id_venta
      INNER JOIN 
          sucursal s ON s.id_sucursal = v.id_sucursal
      INNER JOIN 
          vendedor ve ON ve.dni = s.dni
      INNER JOIN 
          venta_boucher vb ON vb.id_venta_boucher = v.id_venta_boucher
      INNER JOIN 
          usuario usu ON usu.id_usuario = ve.id_usuario
      GROUP BY 
          id, serieNum, num, tipoComprobante, cliente_n, cliente_r, dni, ruc, 
          DATE_FORMAT(v.f_venta, '%Y-%m-%d'), igv, cajero, cajeroId, estado
      ORDER BY 
          v.id_venta DESC;
    `);

    res.json({ code: 1, data: result, message: "Reporte de ventas" });

  } catch (error) {
    console.error('Error al obtener los datos de ventas:', error);
    res.status(500).json({ message: 'Error al obtener los datos de ventas' });
  }   finally {
    if (connection) {
        connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
    }
}
};


const path = require("path");
const ExcelJS = require("exceljs");
const fs = require("fs");

const parseMetodoPago = (metodoPago) => {
  if (!metodoPago) return { efectivo: 0, electronico: 0 };
  
  const metodos = metodoPago.split(',').map(metodo => metodo.trim());
  let montoEfectivo = 0;
  let montoElectronico = 0;

  metodos.forEach(metodo => {
    const [tipo, monto] = metodo.split(':').map(part => part.trim());
    const valor = parseFloat(monto) || 0;

    if (tipo === 'EFECTIVO') {
      montoEfectivo += valor;
    } else if ([
      'PLIN', 'YAPE', 'VISA', 'AMERICAN EXPRESS', 'DEPOSITO BBVA',
      'DEPOSITO BCP', 'DEPOSITO CAJA PIURA', 'DEPOSITO INTERBANK',
      'MASTER CARD'
    ].includes(tipo)) {
      montoElectronico += valor;
    }
  });

  return { efectivo: montoEfectivo, electronico: montoElectronico };
};

const exportarRegistroVentas = async (req, res) => {
  let connection;
  try {
    console.log("Iniciando exportarRegistroVentas...");

    connection = await getConnection();
    const { mes, ano, idSucursal } = req.query;

    if (!mes || !ano) {
      console.error("No se proporcionaron mes y año.");
      return res.status(400).json({ message: "Debe proporcionar mes y año." });
    }

    let nombreSucursal = "TODAS LAS SUCURSALES";
    if (idSucursal) {
      const [sucursalResult] = await connection.query(
        "SELECT nombre_sucursal FROM sucursal WHERE id_sucursal = ?",
        [idSucursal]
      );
      if (sucursalResult.length > 0) {
        nombreSucursal = sucursalResult[0].nombre_sucursal;
      }
    }

    const query = `
    SELECT 
        ROW_NUMBER() OVER (ORDER BY v.id_venta) AS numero_correlativo,
        DAY(v.f_venta) AS dia_emision,
        DAY(v.f_venta) AS dia_vencimiento,
        c.num_comprobante AS num_comprobante,
        v.metodo_pago,
        CASE 
            WHEN cl.dni IS NOT NULL AND cl.dni <> '' THEN '1'
            ELSE '6'
        END AS tipo_doc_cliente,
        CASE 
            WHEN cl.dni IS NOT NULL AND cl.dni <> '' THEN cl.dni 
            ELSE cl.ruc 
        END AS documento_cliente,
        CASE 
            WHEN cl.nombres IS NOT NULL AND cl.nombres <> '' AND cl.apellidos IS NOT NULL AND cl.apellidos <> '' 
            THEN CONCAT(cl.nombres, ' ', cl.apellidos) 
            ELSE cl.razon_social 
        END AS nombre_cliente,
        s.nombre_sucursal,
        ROUND(SUM((dv.cantidad * dv.precio) - dv.descuento) / 1.18, 2) AS base_imponible,
        ROUND((SUM((dv.cantidad * dv.precio) - dv.descuento) / 1.18) * 0.18, 2) AS igv,
        ROUND(SUM((dv.cantidad * dv.precio) - dv.descuento), 2) AS total
    FROM venta v
    INNER JOIN detalle_venta dv ON v.id_venta = dv.id_venta
    INNER JOIN comprobante c ON c.id_comprobante = v.id_comprobante
    INNER JOIN cliente cl ON cl.id_cliente = v.id_cliente
    INNER JOIN sucursal s ON s.id_sucursal = v.id_sucursal
    INNER JOIN tipo_comprobante tc ON tc.id_tipocomprobante = c.id_tipocomprobante
    WHERE MONTH(v.f_venta) = ? AND tc.nom_tipocomp != 'Nota de venta' AND v.estado_venta !=0 AND YEAR(v.f_venta) = ?
    ${idSucursal ? 'AND v.id_sucursal = ?' : ''}
    GROUP BY v.id_venta, c.num_comprobante, cl.dni, cl.ruc, cl.nombres, cl.apellidos, cl.razon_social, 
             v.f_venta, s.nombre_sucursal, v.metodo_pago
    ORDER BY v.id_venta`;

    const queryParams = [mes, ano];
    if (idSucursal) queryParams.push(idSucursal);

    const [resultados] = await connection.query(query, queryParams);

    const projectRoot = path.resolve(__dirname, '..', '..');
    const templatePath = path.join(projectRoot, "client", "src", "assets", "FormatoVentaSUNAT.xlsx");

    if (!fs.existsSync(templatePath)) {
      console.error("No se encontró la plantilla en la ruta:", templatePath);
      return res.status(500).json({ message: "No se encontró la plantilla." });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    const worksheet = workbook.getWorksheet("Plantilla");
    if (!worksheet) {
      console.error("No se pudo encontrar la hoja 'Plantilla' en el workbook.");
      return res.status(500).json({ message: "No se encontró la hoja requerida en la plantilla." });
    }

    const getMonthAbbreviation = (monthNumber) => {
      const months = {
        '01': 'ene', '02': 'feb', '03': 'mar', '04': 'abr',
        '05': 'may', '06': 'jun', '07': 'jul', '08': 'ago',
        '09': 'sep', '10': 'oct', '11': 'nov', '12': 'dic'
      };
      return months[monthNumber];
    };

    worksheet.getCell("B2").value = nombreSucursal;
    worksheet.getCell("B3").value = `${getMonthAbbreviation(mes)}-${ano.slice(-2)}`;
    worksheet.getCell("B4").value = "20610588981";
    worksheet.getCell("E5").value = "TEXTILES CREANDO MODA S.A.C.";

    const startRow = 12;
    const totalColumns = 22;

    resultados.forEach((row, index) => {
      const currentRow = startRow + index;
      const { efectivo, electronico } = parseMetodoPago(row.metodo_pago);

      for (let col = 1; col <= totalColumns; col++) {
        const cell = worksheet.getCell(currentRow, col);
        cell.value = null;
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center',
          wrapText: true,
        };
        cell.font = { size: 11 };
      }

      worksheet.getCell(`A${currentRow}`).value = row.numero_correlativo;
      worksheet.getCell(`B${currentRow}`).value = row.dia_emision;
      worksheet.getCell(`C${currentRow}`).value = row.dia_vencimiento;
      worksheet.getCell(`D${currentRow}`).value = "01";
      worksheet.getCell(`E${currentRow}`).value = (row.num_comprobante || "").split("-")[0] || "";
      worksheet.getCell(`F${currentRow}`).value = (row.num_comprobante || "").split("-")[1] || "";
      worksheet.getCell(`G${currentRow}`).value = row.tipo_doc_cliente;
      worksheet.getCell(`H${currentRow}`).value = row.documento_cliente;
      worksheet.getCell(`I${currentRow}`).value = row.nombre_cliente;
      worksheet.getCell(`K${currentRow}`).value = parseFloat(row.base_imponible || 0).toFixed(2);
      worksheet.getCell(`O${currentRow}`).value = parseFloat(row.igv || 0).toFixed(2);
      worksheet.getCell(`Q${currentRow}`).value = parseFloat(row.total || 0).toFixed(2);
      worksheet.getCell(`R${currentRow}`).value = row.metodo_pago;
      worksheet.getCell(`S${currentRow}`).value = efectivo.toFixed(2);
      worksheet.getCell(`T${currentRow}`).value = electronico.toFixed(2);
    });

    const lastDataRow = startRow + resultados.length;
    const totalsRow = lastDataRow + 1;

    // Format totals row
    for (let col = 1; col <= totalColumns; col++) {
      const cell = worksheet.getCell(totalsRow, col);
      cell.border = {
        top: {style:'thin'},
        left: {style:'thin'},
        bottom: {style:'thin'},
        right: {style:'thin'}
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center'
      };
      cell.font = { size: 11 };
    }

    worksheet.mergeCells(`I${totalsRow}:J${totalsRow}`);
    const mergedCell = worksheet.getCell(`I${totalsRow}`);
    mergedCell.value = 'TOTALES';
    mergedCell.font = { bold: true, size: 11 };
    mergedCell.alignment = {
      vertical: 'middle',
      horizontal: 'center'
    };

    const totales = resultados.reduce((acc, row) => {
      const { efectivo, electronico } = parseMetodoPago(row.metodo_pago);
      return {
        baseImponible: acc.baseImponible + parseFloat(row.base_imponible || 0),
        igv: acc.igv + parseFloat(row.igv || 0),
        total: acc.total + parseFloat(row.total || 0),
        efectivo: acc.efectivo + efectivo,
        electronico: acc.electronico + electronico
      };
    }, { baseImponible: 0, igv: 0, total: 0, efectivo: 0, electronico: 0 });

    worksheet.getCell(`K${totalsRow}`).value = totales.baseImponible.toFixed(2);
    worksheet.getCell(`O${totalsRow}`).value = totales.igv.toFixed(2);
    worksheet.getCell(`Q${totalsRow}`).value = totales.total.toFixed(2);
    worksheet.getCell(`S${totalsRow}`).value = totales.efectivo.toFixed(2);
    worksheet.getCell(`T${totalsRow}`).value = totales.electronico.toFixed(2);

    ['K','O','Q','S','T'].forEach(col => {
      const cell = worksheet.getCell(`${col}${totalsRow}`);
      cell.font = { bold: true, size: 11 };
    });

    const buffer = await workbook.xlsx.writeBuffer();

    const fileName = idSucursal 
      ? `RegistroVentasSUNAT-${nombreSucursal.replace(/\s+/g, '_')}-${mes}-${ano}.xlsx`
      : `RegistroVentasSUNAT-${mes}-${ano}.xlsx`;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.send(buffer);

  } catch (error) {
    console.error("Error al exportar registro de ventas:", error);
    res.status(500).json({ message: "Error al exportar el archivo Excel." });
  }    finally {
    if (connection) {
        connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
    }
}
};




const obtenerRegistroVentas = async (req, res) => { 
  let connection;
  try {
    connection = await getConnection();
    
    // Parámetros de consulta
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const tipoComprobante = req.query.tipoComprobante || null;
    const fechaInicio = req.query.fechaInicio || null;
    const fechaFin = req.query.fechaFin || null;
    const idSucursal = req.query.idSucursal || null;

    // Construcción dinámica de filtros
    let filters = [];
    let queryParams = [];

    if (idSucursal) {
      filters.push(`v.id_sucursal = ?`);
      queryParams.push(idSucursal);
    }

    if (tipoComprobante) {
      filters.push(`tc.nom_tipocomp = ?`);
      queryParams.push(tipoComprobante);
    }

    // Excluir 'Nota de venta'
    filters.push(`tc.nom_tipocomp != 'Nota de venta'`);

    filters.push(`v.estado_venta != 0`);

    // Filtro de fechas
    if (fechaInicio && fechaFin) {
      if (new Date(fechaInicio) > new Date(fechaFin)) {
        return res.status(400).json({
          code: 0,
          message: "La fecha de inicio no puede ser mayor a la fecha fin"
        });
      }
      filters.push(`DATE(v.f_venta) BETWEEN STR_TO_DATE(?, '%Y-%m-%d') AND STR_TO_DATE(?, '%Y-%m-%d')`);
      queryParams.push(fechaInicio, fechaFin);
    }

    // Construir la cláusula WHERE
    const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

    // Contar los registros totales
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM (
        SELECT v.id_venta
        FROM venta v
        INNER JOIN comprobante c ON c.id_comprobante = v.id_comprobante
        INNER JOIN tipo_comprobante tc ON tc.id_tipocomprobante = c.id_tipocomprobante
        INNER JOIN cliente cl ON cl.id_cliente = v.id_cliente
        INNER JOIN sucursal s ON s.id_sucursal = v.id_sucursal
        ${whereClause}
        GROUP BY v.id_venta
      ) AS subquery
    `;

    const [[{ total }]] = await connection.query(countQuery, [...queryParams]);

    if (total === 0) {
      return res.json({
        code: 1,
        data: { 
          registroVentas: [], 
          totales: {
            total_importe: 0,
            total_igv: 0,
            total_general: 0
          }
        },
        metadata: {
          total_records: 0,
          current_page: page,
          per_page: limit,
          total_pages: 0,
        },
        message: "No se encontraron registros de ventas",
      });
    }

    // Consulta principal de ventas
    const query = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY v.id_venta) AS numero_correlativo,
        v.f_venta AS fecha,
        s.nombre_sucursal AS sucursal,
        s.ubicacion AS ubicacion_sucursal,
        CASE 
            WHEN cl.dni IS NOT NULL AND cl.dni <> '' THEN cl.dni 
            ELSE cl.ruc 
        END AS documento_cliente,
        CASE 
            WHEN cl.nombres IS NOT NULL AND cl.nombres <> '' AND cl.apellidos IS NOT NULL AND cl.apellidos <> '' 
            THEN CONCAT(cl.nombres, ' ', cl.apellidos) 
            ELSE cl.razon_social 
        END AS nombre_cliente,
        c.num_comprobante AS num_comprobante,
        tc.nom_tipocomp AS tipo_comprobante,
        ROUND(SUM((dv.cantidad * dv.precio) - dv.descuento) / 1.18, 2) AS importe,
        ROUND((SUM((dv.cantidad * dv.precio) - dv.descuento) / 1.18) * 0.18, 2) AS igv,
        ROUND(SUM((dv.cantidad * dv.precio) - dv.descuento), 2) AS total
      FROM 
        venta v
      INNER JOIN 
        detalle_venta dv ON v.id_venta = dv.id_venta
      INNER JOIN 
        comprobante c ON c.id_comprobante = v.id_comprobante
      INNER JOIN 
        tipo_comprobante tc ON tc.id_tipocomprobante = c.id_tipocomprobante
      INNER JOIN 
        cliente cl ON cl.id_cliente = v.id_cliente
      INNER JOIN
        sucursal s ON s.id_sucursal = v.id_sucursal
      ${whereClause}
      GROUP BY 
        v.id_venta, v.f_venta, s.nombre_sucursal, s.ubicacion, 
        cl.dni, cl.ruc, cl.nombres, cl.apellidos, cl.razon_social,
        c.num_comprobante, tc.nom_tipocomp
      ORDER BY 
        v.id_venta
      LIMIT ? OFFSET ?
    `;

    const [resultados] = await connection.query(query, [...queryParams, limit, offset]);

    const registroVentas = resultados.map((row) => ({
      numero_correlativo: row.numero_correlativo,
      fecha: row.fecha,
      sucursal: row.sucursal,
      ubicacion_sucursal: row.ubicacion_sucursal,
      documento_cliente: row.documento_cliente,
      nombre_cliente: row.nombre_cliente,
      num_comprobante: row.num_comprobante,
      tipo_comprobante: row.tipo_comprobante,
      importe: parseFloat(row.importe) || 0.0,
      igv: parseFloat(row.igv) || 0.0,
      total: parseFloat(row.total) || 0.0,
    }));

    const totales = {
      total_importe: resultados.reduce((sum, row) => sum + (parseFloat(row.importe) || 0), 0),
      total_igv: resultados.reduce((sum, row) => sum + (parseFloat(row.igv) || 0), 0),
      total_general: resultados.reduce((sum, row) => sum + (parseFloat(row.total) || 0), 0),
    };

    res.json({
      code: 1,
      data: { registroVentas, totales },
      metadata: {
        total_records: total,
        current_page: page,
        per_page: limit,
        total_pages: Math.ceil(total / limit),
      },
      message: "Registro de ventas obtenido correctamente",
    });
  } catch (error) {
    console.error("Error al obtener el registro de ventas:", error.message);
    res.status(500).json({
      message: "Error al obtener el registro de ventas",
      error: error.message, 
    });
  }   finally {
    if (connection) {
        connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
    }
}
};


export const methods = {
  getTotalSalesRevenue,
  getTotalProductosVendidos,
  getVentasPDF,
  getProductoMasVendido,
  getCantidadVentasPorProducto,
  getCantidadVentasPorSubcategoria,
  getAnalisisGananciasSucursales,
  obtenerRegistroVentas,
  exportarRegistroVentas
};
