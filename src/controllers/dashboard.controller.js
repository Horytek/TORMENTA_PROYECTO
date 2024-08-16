import { getConnection } from "./../database/database";
import { subDays, subWeeks, subMonths, subYears, format } from "date-fns";

const getProductoMasVendido = async (req, res) => {
  try {
    const connection = await getConnection();
    
    const { tiempo } = req.query;
    
    let fechaInicio;
    let fechaFin = new Date();

    switch (tiempo) {
      case '24h':
        fechaInicio = subDays(fechaFin, 1);
        break;
      case 'semana':
        fechaInicio = subWeeks(fechaFin, 1);
        break;
      case 'mes':
        fechaInicio = subMonths(fechaFin, 1);
        break;
      case 'anio':
        fechaInicio = subYears(fechaFin, 1);
        break;
      default:
        return res.status(400).json({ message: "Filtro de tiempo no válido" });
    }

    fechaInicio.setHours(0, 0, 0, 0);
    fechaFin.setHours(23, 59, 59, 999);

    const fechaInicioISO = format(fechaInicio, 'yyyy-MM-dd HH:mm:ss');
    const fechaFinISO = format(fechaFin, 'yyyy-MM-dd HH:mm:ss');

    console.log('Fecha de inicio:', fechaInicioISO);
    console.log('Fecha de fin:', fechaFinISO);

    const [result] = await connection.query(`
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
      WHERE 
        v.f_venta >= ? AND v.f_venta <= ?
      GROUP BY 
        p.id_producto, p.descripcion
      ORDER BY 
        total_vendido DESC
      LIMIT 1;
    `, [fechaInicioISO, fechaFinISO]);

    if (result.length === 0) {
      return res.status(404).json({ message: "No se encontraron productos vendidos." });
    }

    const productoMasVendido = result[0];

    res.json({ code: 1, data: productoMasVendido, message: "Producto más vendido obtenido correctamente" });
  } catch (error) {
    res.status(500).send(error.message);
  }
};


const getTotalVentas = async (req, res) => {
  try {
    const connection = await getConnection();

    const { tiempo } = req.query;

    let fechaInicio;
    let fechaFin = new Date();

    switch (tiempo) {
      case '24h':
        fechaInicio = subDays(fechaFin, 1);
        break;
      case 'semana':
        fechaInicio = subWeeks(fechaFin, 1);
        break;
      case 'mes':
        fechaInicio = subMonths(fechaFin, 1);
        break;
      case 'anio':
        fechaInicio = subYears(fechaFin, 1);
        break;
      default:
        return res.status(400).json({ message: "Filtro de tiempo no válido" });
    }

    fechaInicio.setHours(0, 0, 0, 0);
    fechaFin.setHours(23, 59, 59, 999);

    const fechaInicioISO = format(fechaInicio, 'yyyy-MM-dd HH:mm:ss');
    const fechaFinISO = format(fechaFin, 'yyyy-MM-dd HH:mm:ss');

    console.log('Fecha de inicio:', fechaInicioISO);
    console.log('Fecha de fin:', fechaFinISO);

    const [result] = await connection.query(`
      SELECT SUM(dv.total) AS total_dinero_ventas
      FROM detalle_venta dv
      JOIN venta v ON dv.id_venta = v.id_venta
      WHERE v.f_venta >= ? AND v.f_venta <= ?;
    `, [fechaInicioISO, fechaFinISO]);

    const totalVentas = result[0].total_dinero_ventas || 0;

    res.json({ code: 1, data: totalVentas, message: "Total de ventas obtenido correctamente" });
  } catch (error) {
    console.error('Error en getTotalVentas:', error);
    res.status(500).send(error.message);
  }
};



const getTotalProductosVendidos = async (req, res) => {
  try {
    const connection = await getConnection();

    const { tiempo } = req.query;
    
    let fechaInicio;
    let fechaFin = new Date();

    switch (tiempo) {
      case '24h':
        fechaInicio = subDays(fechaFin, 1);
        break;
      case 'semana':
        fechaInicio = subWeeks(fechaFin, 1);
        break;
      case 'mes':
        fechaInicio = subMonths(fechaFin, 1);
        break;
      case 'anio':
        fechaInicio = subYears(fechaFin, 1);
        break;
      default:
        return res.status(400).json({ message: "Filtro de tiempo no válido" });
    }

    fechaInicio.setHours(0, 0, 0, 0);
    fechaFin.setHours(23, 59, 59, 999);

    const fechaInicioISO = format(fechaInicio, 'yyyy-MM-dd HH:mm:ss');
    const fechaFinISO = format(fechaFin, 'yyyy-MM-dd HH:mm:ss');

    console.log('Fecha de inicio:', fechaInicioISO);
    console.log('Fecha de fin:', fechaFinISO);

    const [result] = await connection.query(`
      SELECT SUM(dv.cantidad) AS total_productos_vendidos
      FROM detalle_venta dv
      JOIN venta v ON dv.id_venta = v.id_venta
      WHERE v.f_venta >= ? AND v.f_venta <= ?;
    `, [fechaInicioISO, fechaFinISO]);
    
    const totalProductosVendidos = result[0].total_productos_vendidos || 0;

    res.json({ code: 1, totalProductosVendidos, message: "Total de productos vendidos obtenido correctamente" });
  } catch (error) {
    res.status(500).send(error.message);
  }
};


const getComparacionVentasPorRango = async (req, res) => {
  try {
    const connection = await getConnection();

    const { fechaInicio, fechaFin } = req.body;

    let query = `
      SELECT 
        MONTH(v.f_venta) AS mes,
        SUM(dv.total) AS total_ventas
      FROM 
        detalle_venta dv
      JOIN 
        venta v ON dv.id_venta = v.id_venta
      `;
    
    let params = [];

    if (fechaInicio && fechaFin) {
      const fechaInicioFormatted = format(new Date(fechaInicio), 'yyyy-MM-dd HH:mm:ss');
      const fechaFinFormatted = format(new Date(fechaFin), 'yyyy-MM-dd HH:mm:ss');
      query += ` WHERE v.f_venta BETWEEN ? AND ? `;
      params.push(fechaInicioFormatted, fechaFinFormatted);
    }
    
    query += ` GROUP BY mes ORDER BY mes;`;

    const [result] = await connection.query(query, params);

    const ventasPorMes = Array.from({ length: 12 }, (_, index) => ({
      mes: index + 1,
      total_ventas: 0,
    }));

    result.forEach(row => {
      const mesIndex = row.mes - 1;
      ventasPorMes[mesIndex].total_ventas = row.total_ventas;
    });

    res.json({
      code: 1,
      data: ventasPorMes,
      message: "Ventas por mes obtenidas correctamente"
    });
  } catch (error) {
    console.error('Error en getComparacionVentasPorRango:', error);
    res.status(500).send(error.message);
  }
};



export const methods = {
    getProductoMasVendido,
    getTotalProductosVendidos,
    getTotalVentas,
    getComparacionVentasPorRango
};
