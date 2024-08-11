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


const getComparacionVentasActualVsAnterior = async (req, res) => {
  try {
    const connection = await getConnection();

    const hoy = new Date();
    const anioActual = hoy.getFullYear();
    const anioAnterior = anioActual - 1;

    const fechaInicioAnioActual = format(new Date(anioActual, 0, 1), 'yyyy-MM-dd HH:mm:ss');
    const fechaFinAnioActual = format(new Date(anioActual, 11, 31, 23, 59, 59), 'yyyy-MM-dd HH:mm:ss');
    
    const fechaInicioAnioAnterior = format(new Date(anioAnterior, 0, 1), 'yyyy-MM-dd HH:mm:ss');
    const fechaFinAnioAnterior = format(new Date(anioAnterior, 11, 31, 23, 59, 59), 'yyyy-MM-dd HH:mm:ss');

    console.log('Año actual:', anioActual, ' | Inicio:', fechaInicioAnioActual, ' | Fin:', fechaFinAnioActual);
    console.log('Año anterior:', anioAnterior, ' | Inicio:', fechaInicioAnioAnterior, ' | Fin:', fechaFinAnioAnterior);

    const [result] = await connection.query(`
      SELECT 
        MONTH(v.f_venta) AS mes,
        SUM(CASE WHEN YEAR(v.f_venta) = ? THEN dv.total ELSE 0 END) AS total_ventas_anio_actual,
        SUM(CASE WHEN YEAR(v.f_venta) = ? THEN dv.total ELSE 0 END) AS total_ventas_anio_anterior
      FROM 
        detalle_venta dv
      JOIN 
        venta v ON dv.id_venta = v.id_venta
      WHERE 
        v.f_venta BETWEEN ? AND ?
        OR v.f_venta BETWEEN ? AND ?
      GROUP BY 
        mes
      ORDER BY 
        mes;
    `, [anioActual, anioAnterior, fechaInicioAnioActual, fechaFinAnioActual, fechaInicioAnioAnterior, fechaFinAnioAnterior]);

    const ventasPorMes = {};
    result.forEach(row => {
      const mes = row.mes;
      ventasPorMes[mes] = {
        [`${anioActual}`]: row.total_ventas_anio_actual,
        [`${anioAnterior}`]: row.total_ventas_anio_anterior,
      };
    });

    res.json({
      code: 1,
      data: ventasPorMes,
      message: "Comparación de ventas por mes entre el año actual y el año anterior obtenida correctamente"
    });
  } catch (error) {
    console.error('Error en getComparacionVentasActualVsAnterior:', error);
    res.status(500).send(error.message);
  }
};

export const methods = {
    getProductoMasVendido,
    getTotalProductosVendidos,
    getTotalVentas,
    getComparacionVentasActualVsAnterior
};
