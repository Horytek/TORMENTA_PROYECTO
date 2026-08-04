import { getConnection } from "./../database/database.js";
import { subMonths, format } from "date-fns";
import path from "path";
import ExcelJS from "exceljs";
import fs from "fs";
import { fileURLToPath } from 'url';
import { stockPorProducto } from "../services/inventario/stockRepository.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache para reportes (TTL más corto porque los datos cambian frecuentemente)
const queryCache = new Map();
const CACHE_TTL = 30000; // 30 segundos para reportes

// Limpieza periódica del caché
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of queryCache.entries()) {
    if (now - value.timestamp > CACHE_TTL * 2) {
      queryCache.delete(key);
    }
  }
}, CACHE_TTL * 2);

// Función auxiliar para generar clave de caché (para uso futuro en optimizaciones adicionales)
const _generateCacheKey = (prefix, params) => {
  return `${prefix}_${JSON.stringify(params)}`;
};


const getTotalProductosVendidos = async (req, res) => {
  let connection;
  const { id_sucursal, year, month, week, limit: _limit } = req.query;
  const id_tenant = req.id_tenant;

  try {
    connection = await getConnection();

    // Fechas para filtro
    let fechaInicioActual, fechaFinActual, fechaInicioAnterior, fechaFinAnterior;
    const now = new Date();
    const y = year ? parseInt(year) : now.getFullYear();
    const m = month ? parseInt(month) - 1 : now.getMonth();

    if (week && week !== "all" && month) {
      const diasEnMes = new Date(y, m + 1, 0).getDate();
      const weekNumber = parseInt(week.replace(/\D/g, ""));
      const startDay = (weekNumber - 1) * 7 + 1;
      const endDay = Math.min(weekNumber * 7, diasEnMes);

      fechaInicioActual = new Date(y, m, startDay);
      fechaFinActual = new Date(y, m, endDay);

      const prevMonth = subMonths(fechaInicioActual, 1);
      const diasEnMesAnterior = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).getDate();
      const prevStartDay = (weekNumber - 1) * 7 + 1;
      const prevEndDay = Math.min(weekNumber * 7, diasEnMesAnterior);

      fechaInicioAnterior = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevStartDay);
      fechaFinAnterior = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevEndDay);
    } else if (month) {
      fechaInicioActual = new Date(y, m, 1);
      fechaFinActual = new Date(y, m + 1, 0);
      const prevMonth = subMonths(fechaInicioActual, 1);
      fechaInicioAnterior = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1);
      fechaFinAnterior = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0);
    } else {
      fechaInicioActual = new Date(y, 0, 1);
      fechaFinActual = new Date(y, 11, 31);
      fechaInicioAnterior = new Date(y - 1, 0, 1);
      fechaFinAnterior = new Date(y - 1, 11, 31);
    }

    const f = (d) => format(d, "yyyy-MM-dd");

    // Query base para total productos vendidos (rango index-friendly)
    let baseQuery = `
      SELECT SUM(dv.cantidad) AS total_productos_vendidos
      FROM detalle_venta dv
      JOIN venta v ON dv.id_venta = v.id_venta
      WHERE v.estado_venta != 0
    `;
    const comunes = [];
    if (id_sucursal) {
      baseQuery += ` AND v.id_sucursal = ?`;
      comunes.push(id_sucursal);
    }
    if (id_tenant) {
      baseQuery += ` AND v.id_tenant = ?`;
      comunes.push(id_tenant);
    }

    const rangoSQL = ` AND v.f_venta >= ? AND v.f_venta < DATE_ADD(?, INTERVAL 1 DAY)`;
    const actualSQL = baseQuery + rangoSQL;
    const anteriorSQL = baseQuery + rangoSQL;
    const paramsActual = [...comunes, f(fechaInicioActual), f(fechaFinActual)];
    const paramsAnterior = [...comunes, f(fechaInicioAnterior), f(fechaFinAnterior)];

    const [[actualResult], [anteriorResult]] = await Promise.all([
      connection.query(actualSQL, paramsActual),
      connection.query(anteriorSQL, paramsAnterior)
    ]);
    const actual = Number(actualResult[0]?.total_productos_vendidos) || 0;
    const anterior = Number(anteriorResult[0]?.total_productos_vendidos) || 0;

    // Porcentaje
    let porcentaje = 0;
    if (anterior > 0) {
      porcentaje = ((actual - anterior) / anterior) * 100;
    }

    // Desglose por subcategoría (actual)
    let subcatQuery = `
      SELECT 
        sc.nom_subcat AS subcategoria,
        SUM(dv.cantidad) AS cantidad_vendida
      FROM detalle_venta dv
      JOIN producto p ON dv.id_producto = p.id_producto
      JOIN sub_categoria sc ON p.id_subcategoria = sc.id_subcategoria
      JOIN venta v ON dv.id_venta = v.id_venta
      WHERE v.estado_venta != 0
        AND v.f_venta >= ? AND v.f_venta < DATE_ADD(?, INTERVAL 1 DAY)
    `;
    const subcatParams = [f(fechaInicioActual), f(fechaFinActual)];
    if (id_sucursal) {
      subcatQuery += ` AND v.id_sucursal = ?`;
      subcatParams.push(id_sucursal);
    }
    if (id_tenant) {
      subcatQuery += ` AND v.id_tenant = ?`;
      subcatParams.push(id_tenant);
    }
    subcatQuery += `
      GROUP BY sc.nom_subcat
      ORDER BY cantidad_vendida DESC
    `;
    const [subcatResult] = await connection.query(subcatQuery, subcatParams);

    const subcategorias = {};
    subcatResult.forEach((row) => {
      if (row.subcategoria.toLowerCase().includes("short")) {
        subcategorias.Shorts = Number(row.cantidad_vendida);
      } else if (row.subcategoria.toLowerCase().includes("pantal")) {
        subcategorias.Pantalon = Number(row.cantidad_vendida);
      } else {
        subcategorias.Otros = (subcategorias.Otros || 0) + Number(row.cantidad_vendida);
      }
    });

    res.json({
      code: 1,
      totalProductosVendidos: actual,
      totalAnterior: anterior,
      porcentaje,
      subcategorias,
      message: "Total de productos vendidos obtenido correctamente"
    });
  } catch (error) {
    console.error('Error en reporte:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};


const getTotalSalesRevenue = async (req, res) => {
  let connection;
  const { id_sucursal, year, month, week } = req.query;
  const id_tenant = req.id_tenant;

  try {
    connection = await getConnection();

    // Fechas para filtro
    let fechaInicioActual, fechaFinActual, fechaInicioAnterior, fechaFinAnterior;
    const now = new Date();
    const y = year ? parseInt(year) : now.getFullYear();
    const m = month ? parseInt(month) - 1 : now.getMonth();

    if (week && week !== "all" && month) {
      const diasEnMes = new Date(y, m + 1, 0).getDate();
      const weekNumber = parseInt(week.replace(/\D/g, ""));
      const startDay = (weekNumber - 1) * 7 + 1;
      const endDay = Math.min(weekNumber * 7, diasEnMes);

      fechaInicioActual = new Date(y, m, startDay);
      fechaFinActual = new Date(y, m, endDay);

      const prevMonth = subMonths(fechaInicioActual, 1);
      const diasEnMesAnterior = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).getDate();
      const prevStartDay = (weekNumber - 1) * 7 + 1;
      const prevEndDay = Math.min(weekNumber * 7, diasEnMesAnterior);

      fechaInicioAnterior = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevStartDay);
      fechaFinAnterior = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevEndDay);
    } else if (month) {
      fechaInicioActual = new Date(y, m, 1);
      fechaFinActual = new Date(y, m + 1, 0);
      const prevMonth = subMonths(fechaInicioActual, 1);
      fechaInicioAnterior = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1);
      fechaFinAnterior = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0);
    } else {
      fechaInicioActual = new Date(y, 0, 1);
      fechaFinActual = new Date(y, 11, 31);
      fechaInicioAnterior = new Date(y - 1, 0, 1);
      fechaFinAnterior = new Date(y - 1, 11, 31);
    }

    const f = (d) => format(d, "yyyy-MM-dd");

    // Query base (rango index-friendly)
    let baseQuery = `
      SELECT SUM(dv.total) AS totalRevenue 
      FROM detalle_venta dv
      JOIN venta v ON dv.id_venta = v.id_venta
      WHERE v.estado_venta != 0
    `;
    const comunes = [];
    if (id_sucursal) {
      baseQuery += ` AND v.id_sucursal = ?`;
      comunes.push(id_sucursal);
    }
    if (id_tenant) {
      baseQuery += ` AND v.id_tenant = ?`;
      comunes.push(id_tenant);
    }

    const rangoSQL = ` AND v.f_venta >= ? AND v.f_venta < DATE_ADD(?, INTERVAL 1 DAY)`;
    const actualSQL = baseQuery + rangoSQL;
    const anteriorSQL = baseQuery + rangoSQL;
    const paramsActual = [...comunes, f(fechaInicioActual), f(fechaFinActual)];
    const paramsAnterior = [...comunes, f(fechaInicioAnterior), f(fechaFinAnterior)];

    const [[actualResult], [anteriorResult]] = await Promise.all([
      connection.query(actualSQL, paramsActual),
      connection.query(anteriorSQL, paramsAnterior)
    ]);
    const actual = Number(actualResult[0]?.totalRevenue) || 0;
    const anterior = Number(anteriorResult[0]?.totalRevenue) || 0;

    // Porcentaje
    let porcentaje = 0;
    if (anterior > 0) {
      porcentaje = ((actual - anterior) / anterior) * 100;
    }

    res.json({
      code: 1,
      totalRevenue: actual,
      totalAnterior: anterior,
      porcentaje,
      message: "Total de ventas obtenidas correctamente"
    });
  } catch (error) {
    console.error('Error en reporte:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};


const getSucursales = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const id_tenant = req.id_tenant;
    const limitParam = req.query.limit ? Math.max(parseInt(req.query.limit, 10) || 0, 0) : 0;

    let query = `
      SELECT 
        id_sucursal,
        nombre_sucursal as nombre
      FROM 
        sucursal
      WHERE 
        estado_sucursal = 1
        AND id_tenant = ?
      ORDER BY 
        nombre_sucursal
    `;
    const params = [id_tenant];
    if (limitParam > 0) {
      query += " LIMIT ?";
      params.push(limitParam);
    }

    const [sucursales] = await connection.query(query, params);

    res.json({
      code: 1,
      data: sucursales,
      message: "Sucursales obtenidas correctamente"
    });

  } catch (error) {
    console.error('Error en getSucursales:', error);
    res.status(500).json({
      code: 0,
      message: "Error al obtener las sucursales"
    });
  } finally {
    if (connection) connection.release();
  }
};


const getProductoMasVendido = async (req, res) => {
  let connection;
  const { id_sucursal, year, month, week } = req.query;
  const id_tenant = req.id_tenant;

  try {
    connection = await getConnection();

    // Calcular fechas según filtros
    let fechaInicioActual, fechaFinActual, fechaInicioAnterior, fechaFinAnterior;
    const now = new Date();
    const y = year ? parseInt(year) : now.getFullYear();
    const m = month ? parseInt(month) - 1 : now.getMonth();

    if (week && week !== "all" && month) {
      const diasEnMes = new Date(y, m + 1, 0).getDate();
      const weekNumber = parseInt(week.replace(/\D/g, ""));
      const startDay = (weekNumber - 1) * 7 + 1;
      const endDay = Math.min(weekNumber * 7, diasEnMes);

      fechaInicioActual = new Date(y, m, startDay);
      fechaFinActual = new Date(y, m, endDay);

      const prevMonth = subMonths(fechaInicioActual, 1);
      const diasEnMesAnterior = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).getDate();
      const prevStartDay = (weekNumber - 1) * 7 + 1;
      const prevEndDay = Math.min(weekNumber * 7, diasEnMesAnterior);

      fechaInicioAnterior = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevStartDay);
      fechaFinAnterior = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevEndDay);
    } else if (month) {
      fechaInicioActual = new Date(y, m, 1);
      fechaFinActual = new Date(y, m + 1, 0);
      const prevMonth = subMonths(fechaInicioActual, 1);
      fechaInicioAnterior = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1);
      fechaFinAnterior = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0);
    } else {
      fechaInicioActual = new Date(y, 0, 1);
      fechaFinActual = new Date(y, 11, 31);
      fechaInicioAnterior = new Date(y - 1, 0, 1);
      fechaFinAnterior = new Date(y - 1, 11, 31);
    }

    const f = (d) => format(d, "yyyy-MM-dd");

    // Producto más vendido actual
    let query = `
      SELECT 
        p.id_producto,
        p.descripcion,
        SUM(dv.cantidad) AS unidades,
        SUM(dv.total) AS ingresos
      FROM detalle_venta dv
      JOIN producto p ON dv.id_producto = p.id_producto
      JOIN venta v ON dv.id_venta = v.id_venta
      WHERE v.estado_venta != 0
        AND v.f_venta >= ? AND v.f_venta < DATE_ADD(?, INTERVAL 1 DAY)
    `;
    const params = [f(fechaInicioActual), f(fechaFinActual)];
    if (id_sucursal) {
      query += ` AND v.id_sucursal = ?`;
      params.push(id_sucursal);
    }
    if (id_tenant) {
      query += ` AND v.id_tenant = ?`;
      params.push(id_tenant);
    }
    query += `
      GROUP BY p.id_producto, p.descripcion
      ORDER BY unidades DESC
      LIMIT 1
    `;

    const [result] = await connection.query(query, params);
    if (result.length === 0) {
      return res.status(404).json({ message: "No se encontraron productos vendidos." });
    }
    const producto = result[0];

    // Total de unidades vendidas en el periodo actual (para porcentaje)
    let totalQuery = `
      SELECT SUM(dv.cantidad) AS total_unidades
      FROM detalle_venta dv
      JOIN venta v ON dv.id_venta = v.id_venta
      WHERE v.estado_venta != 0
        AND v.f_venta >= ? AND v.f_venta < DATE_ADD(?, INTERVAL 1 DAY)
    `;
    const totalParams = [f(fechaInicioActual), f(fechaFinActual)];
    if (id_sucursal) {
      totalQuery += ` AND v.id_sucursal = ?`;
      totalParams.push(id_sucursal);
    }
    if (id_tenant) {
      totalQuery += ` AND v.id_tenant = ?`;
      totalParams.push(id_tenant);
    }
    const [totalResult] = await connection.query(totalQuery, totalParams);
    const totalUnidades = Number(totalResult[0].total_unidades) || 0;
    const porcentajeSobreTotal = totalUnidades > 0 ? (producto.unidades / totalUnidades) * 100 : 0;

    // Producto más vendido periodo anterior
    let queryAnterior = `
      SELECT 
        p.id_producto,
        p.descripcion,
        SUM(dv.cantidad) AS unidades,
        SUM(dv.total) AS ingresos
      FROM detalle_venta dv
      JOIN producto p ON dv.id_producto = p.id_producto
      JOIN venta v ON dv.id_venta = v.id_venta
      WHERE v.estado_venta != 0
        AND v.f_venta >= ? AND v.f_venta < DATE_ADD(?, INTERVAL 1 DAY)
    `;
    const paramsAnterior = [f(fechaInicioAnterior), f(fechaFinAnterior)];
    if (id_sucursal) {
      queryAnterior += ` AND v.id_sucursal = ?`;
      paramsAnterior.push(id_sucursal);
    }
    if (id_tenant) {
      queryAnterior += ` AND v.id_tenant = ?`;
      paramsAnterior.push(id_tenant);
    }
    queryAnterior += `
      GROUP BY p.id_producto, p.descripcion
      ORDER BY unidades DESC
      LIMIT 1
    `;
    const [resultAnterior] = await connection.query(queryAnterior, paramsAnterior);
    const productoAnterior = resultAnterior[0];

    // Porcentaje de incremento/decremento respecto al periodo anterior
    let porcentajeCrecimiento = 0;
    if (productoAnterior && productoAnterior.unidades > 0) {
      porcentajeCrecimiento = ((producto.unidades - productoAnterior.unidades) / productoAnterior.unidades) * 100;
    }

    res.json({
      code: 1,
      data: {
        descripcion: producto.descripcion,
        unidades: producto.unidades,
        ingresos: producto.ingresos,
        porcentajeSobreTotal: porcentajeSobreTotal.toFixed(2),
        porcentajeCrecimiento: porcentajeCrecimiento.toFixed(2),
      },
      message: "Producto más vendido obtenido correctamente"
    });
  } catch (error) {
    console.error('Error en reporte:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getSucursalMayorRendimiento = async (req, res) => {
  let connection;
  const { year, month, week } = req.query;
  const id_tenant = req.id_tenant;

  try {
    connection = await getConnection();

    // Calcular fechas según filtros
    let fechaInicioActual, fechaFinActual, fechaInicioAnterior, fechaFinAnterior;
    const now = new Date();
    const y = year ? parseInt(year) : now.getFullYear();
    const m = month ? parseInt(month) - 1 : now.getMonth();

    if (week && week !== "all" && month) {
      const diasEnMes = new Date(y, m + 1, 0).getDate();
      const weekNumber = parseInt(week.replace(/\D/g, ""));
      const startDay = (weekNumber - 1) * 7 + 1;
      const endDay = Math.min(weekNumber * 7, diasEnMes);

      fechaInicioActual = new Date(y, m, startDay);
      fechaFinActual = new Date(y, m, endDay);

      const prevMonth = subMonths(fechaInicioActual, 1);
      const diasEnMesAnterior = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).getDate();
      const prevStartDay = (weekNumber - 1) * 7 + 1;
      const prevEndDay = Math.min(weekNumber * 7, diasEnMesAnterior);

      fechaInicioAnterior = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevStartDay);
      fechaFinAnterior = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevEndDay);
    } else if (month) {
      fechaInicioActual = new Date(y, m, 1);
      fechaFinActual = new Date(y, m + 1, 0);
      const prevMonth = subMonths(fechaInicioActual, 1);
      fechaInicioAnterior = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1);
      fechaFinAnterior = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0);
    } else {
      fechaInicioActual = new Date(y, 0, 1);
      fechaFinActual = new Date(y, 11, 31);
      fechaInicioAnterior = new Date(y - 1, 0, 1);
      fechaFinAnterior = new Date(y - 1, 11, 31);
    }

    const f = (d) => format(d, "yyyy-MM-dd");

    // Sucursal con mayor ventas actual
    let query = `
      SELECT 
        s.id_sucursal,
        s.nombre_sucursal,
        SUM(dv.total) AS total_ventas
      FROM sucursal s
      JOIN venta v ON s.id_sucursal = v.id_sucursal
      JOIN detalle_venta dv ON v.id_venta = dv.id_venta
      WHERE v.estado_venta != 0
        AND v.f_venta >= ? AND v.f_venta < DATE_ADD(?, INTERVAL 1 DAY)
    `;
    const params = [f(fechaInicioActual), f(fechaFinActual)];
    if (id_tenant) {
      query += ` AND v.id_tenant = ?`;
      params.push(id_tenant);
    }
    query += `
      GROUP BY s.id_sucursal, s.nombre_sucursal
      ORDER BY total_ventas DESC
      LIMIT 1
    `;
    const [result] = await connection.query(query, params);

    if (result.length === 0) {
      return res.status(404).json({ message: "No se encontraron ventas para ninguna sucursal." });
    }
    const sucursal = result[0];

    // Total ventas de todas las sucursales en el periodo actual
    let totalQuery = `
      SELECT SUM(dv.total) AS total_ventas
      FROM venta v
      JOIN detalle_venta dv ON v.id_venta = dv.id_venta
      WHERE v.estado_venta != 0
        AND v.f_venta >= ? AND v.f_venta < DATE_ADD(?, INTERVAL 1 DAY)
    `;
    const totalParams = [f(fechaInicioActual), f(fechaFinActual)];
    if (id_tenant) {
      totalQuery += ` AND v.id_tenant = ?`;
      totalParams.push(id_tenant);
    }
    const [totalResult] = await connection.query(totalQuery, totalParams);
    const totalVentas = Number(totalResult[0].total_ventas) || 0;
    const porcentajeSobreTotal = totalVentas > 0 ? (sucursal.total_ventas / totalVentas) * 100 : 0;

    // Sucursal con mayor ventas periodo anterior
    let queryAnterior = `
      SELECT 
        s.id_sucursal,
        s.nombre_sucursal,
        SUM(dv.total) AS total_ventas
      FROM sucursal s
      JOIN venta v ON s.id_sucursal = v.id_sucursal
      JOIN detalle_venta dv ON v.id_venta = dv.id_venta
      WHERE v.estado_venta != 0
        AND v.f_venta >= ? AND v.f_venta < DATE_ADD(?, INTERVAL 1 DAY)
    `;
    const paramsAnterior = [f(fechaInicioAnterior), f(fechaFinAnterior)];
    if (id_tenant) {
      queryAnterior += ` AND v.id_tenant = ?`;
      paramsAnterior.push(id_tenant);
    }
    queryAnterior += `
      GROUP BY s.id_sucursal, s.nombre_sucursal
      ORDER BY total_ventas DESC
      LIMIT 1
    `;
    const [resultAnterior] = await connection.query(queryAnterior, paramsAnterior);
    const sucursalAnterior = resultAnterior[0];

    // Porcentaje de incremento/decremento respecto al periodo anterior
    let porcentajeCrecimiento = 0;
    if (sucursalAnterior && sucursalAnterior.total_ventas > 0) {
      porcentajeCrecimiento = ((sucursal.total_ventas - sucursalAnterior.total_ventas) / sucursalAnterior.total_ventas) * 100;
    }

    res.json({
      code: 1,
      data: {
        nombre: sucursal.nombre_sucursal,
        totalVentas: sucursal.total_ventas,
        porcentajeSobreTotal: porcentajeSobreTotal.toFixed(2),
        porcentajeCrecimiento: porcentajeCrecimiento.toFixed(2),
      },
      message: "Sucursal con mayor rendimiento obtenida correctamente"
    });
  } catch (error) {
    console.error('Error en reporte:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getCantidadVentasPorSubcategoria = async (req, res) => {
  let connection;
  const { id_sucursal, year, month, week } = req.query;
  const id_tenant = req.id_tenant;

  try {
    connection = await getConnection();

    // Calcular fechas según filtros
    let fechaInicioActual, fechaFinActual;
    const now = new Date();
    const y = year ? parseInt(year) : now.getFullYear();
    const m = month ? parseInt(month) - 1 : now.getMonth();

    if (week && week !== "all" && month) {
      // Semana empieza el día 1 y termina el último día del mes
      const diasEnMes = new Date(y, m + 1, 0).getDate();
      const weekNumber = parseInt(week.replace(/\D/g, ""));
      const startDay = (weekNumber - 1) * 7 + 1;
      const endDay = Math.min(weekNumber * 7, diasEnMes);

      fechaInicioActual = new Date(y, m, startDay);
      fechaFinActual = new Date(y, m, endDay);
    } else if (month) {
      fechaInicioActual = new Date(y, m, 1);
      fechaFinActual = new Date(y, m + 1, 0);
    } else {
      fechaInicioActual = new Date(y, 0, 1);
      fechaFinActual = new Date(y, 11, 31);
    }

    const f = (d) => format(d, "yyyy-MM-dd");

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
      WHERE v.estado_venta != 0
        AND v.f_venta >= ? AND v.f_venta < DATE_ADD(?, INTERVAL 1 DAY)
    `;

    const params = [f(fechaInicioActual), f(fechaFinActual)];

    if (id_sucursal) {
      query += ` AND v.id_sucursal = ?`;
      params.push(id_sucursal);
    }
    if (id_tenant) {
      query += ` AND v.id_tenant = ?`;
      params.push(id_tenant);
    }

    query += `
      GROUP BY sc.nom_subcat
      ORDER BY cantidad_vendida DESC
    `;

    const [result] = await connection.query(query, params);
    res.json({ code: 1, data: result, message: "Cantidad de ventas por subcategoría obtenida correctamente" });
  } catch (error) {
    console.error('Error en reporte:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};



const getCantidadVentasPorProducto = async (req, res) => {
  let connection;
  // Se añade 'limit' al destructuring para evitar ReferenceError
  const { id_sucursal, year, month, week, limit } = req.query;
  const id_tenant = req.id_tenant;


  try {
    connection = await getConnection();

    // Calcular fechas según filtros
    let fechaInicioActual, fechaFinActual;
    const now = new Date();
    const y = year ? parseInt(year) : now.getFullYear();
    const m = month ? parseInt(month) - 1 : now.getMonth();

    if (week && week !== "all" && month) {
      const diasEnMes = new Date(y, m + 1, 0).getDate();
      const weekNumber = parseInt(week.replace(/\D/g, ""));
      const startDay = (weekNumber - 1) * 7 + 1;
      const endDay = Math.min(weekNumber * 7, diasEnMes);

      fechaInicioActual = new Date(y, m, startDay);
      fechaFinActual = new Date(y, m, endDay);
    } else if (month) {
      fechaInicioActual = new Date(y, m, 1);
      fechaFinActual = new Date(y, m + 1, 0);
    } else {
      fechaInicioActual = new Date(y, 0, 1);
      fechaFinActual = new Date(y, 11, 31);
    }

    const f = (d) => format(d, "yyyy-MM-dd");

    let query = `
      SELECT 
        p.id_producto,
        CASE 
            WHEN ps.sku IS NOT NULL AND ps.sku != '' AND ps.sku LIKE CONCAT(p.descripcion, '%') THEN ps.sku
            WHEN ps.sku IS NOT NULL AND ps.sku != '' THEN CONCAT(p.descripcion, ' - ', ps.sku)
            ELSE 
                TRIM(CONCAT(
                    p.descripcion,
                    CASE WHEN tal.nombre IS NOT NULL THEN CONCAT(' - ', tal.nombre) ELSE '' END,
                    CASE WHEN ton.nombre IS NOT NULL THEN CONCAT(' - ', ton.nombre) ELSE '' END
                ))
        END AS descripcion,
        SUM(dv.cantidad) AS cantidad_vendida,
        SUM(dv.total) AS dinero_generado
      FROM 
        detalle_venta dv
      JOIN 
        producto p ON dv.id_producto = p.id_producto
      JOIN 
        venta v ON dv.id_venta = v.id_venta
      LEFT JOIN
        producto_sku ps ON dv.id_sku = ps.id_sku
      LEFT JOIN
        talla tal ON dv.id_talla = tal.id_talla
      LEFT JOIN
        tonalidad ton ON dv.id_tonalidad = ton.id_tonalidad
      WHERE v.estado_venta != 0
        AND v.f_venta >= ? AND v.f_venta < DATE_ADD(?, INTERVAL 1 DAY)
    `;

    const params = [f(fechaInicioActual), f(fechaFinActual)];

    if (id_sucursal) {
      query += ` AND v.id_sucursal = ?`;
      params.push(id_sucursal);
    }
    if (id_tenant) {
      query += ` AND v.id_tenant = ?`;
      params.push(id_tenant);
    }

    query += `
      GROUP BY p.id_producto, p.descripcion, ps.sku, tal.nombre, ton.nombre
      ORDER BY cantidad_vendida DESC
    `;

    const limitNum = limit ? Math.max(parseInt(limit, 10) || 0, 0) : 0;
    if (limitNum > 0) {
      query += ` LIMIT ?`;
      params.push(limitNum);
    }

    const [result] = await connection.query(query, params);
    res.json({ code: 1, data: result, message: "Cantidad de ventas por producto obtenida correctamente" });
  } catch (error) {
    console.error('Error en reporte:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};


const getAnalisisGananciasSucursales = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const id_tenant = req.id_tenant;

    let query = `
      SELECT 
          s.nombre_sucursal AS sucursal,
          DATE_FORMAT(v.f_venta, '%b %y') AS mes,
          YEAR(v.f_venta) AS anio,
          MONTH(v.f_venta) AS mes_num,
          SUM(dv.total) AS ganancias
      FROM 
          sucursal s
      JOIN 
          venta v ON s.id_sucursal = v.id_sucursal
      JOIN 
          detalle_venta dv ON v.id_venta = dv.id_venta
      WHERE v.estado_venta !=0
        AND v.id_tenant = ?
      GROUP BY 
          s.id_sucursal, s.nombre_sucursal, anio, mes_num, mes
      ORDER BY 
          anio, mes_num, s.id_sucursal
    `;

    const [result] = await connection.query(query, [id_tenant]);

    res.json({ code: 1, data: result, message: "Análisis de ganancias por sucursal obtenido correctamente" });
  } catch (error) {
    console.error('Error en getAnalisisGananciasSucursales:', error);
    if (!res.headersSent) {
      res.status(500).json({ code: 0, message: "Error interno del servidor" });
    }
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getVentasPDF = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const id_tenant = req.id_tenant;
    const { startDate, endDate, id_sucursal, limit, year, month, week } = req.query;

    let fechaInicio, fechaFin;

    // Priorizar startDate/endDate si existen
    if (startDate && endDate) {
      fechaInicio = startDate;
      fechaFin = endDate;
    } else {
      // Lógica de cálculo de fechas basada en year, month, week (igual que otros endpoints)
      const now = new Date();
      const y = year ? parseInt(year) : now.getFullYear();
      const m = month ? parseInt(month) - 1 : now.getMonth();

      let fechaInicioActual, fechaFinActual;

      if (week && week !== "all" && month) {
        const diasEnMes = new Date(y, m + 1, 0).getDate();
        const weekNumber = parseInt(week.replace(/\D/g, ""));
        const startDay = (weekNumber - 1) * 7 + 1;
        const endDay = Math.min(weekNumber * 7, diasEnMes);

        fechaInicioActual = new Date(y, m, startDay);
        fechaFinActual = new Date(y, m, endDay);
      } else if (month) {
        fechaInicioActual = new Date(y, m, 1);
        fechaFinActual = new Date(y, m + 1, 0);
      } else {
        fechaInicioActual = new Date(y, 0, 1);
        fechaFinActual = new Date(y, 11, 31);
      }

      const f = (d) => format(d, "yyyy-MM-dd");
      fechaInicio = f(fechaInicioActual);
      fechaFin = f(fechaFinActual);
    }

    let query = `
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
          usu.usua, 
          v.observacion,
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'cantidad', dv.cantidad,
              'precio', dv.precio,
              'total', dv.total,
              'producto', p.descripcion,
              'marca', m.nom_marca,
              'categoria', sc.nom_subcat
            )
          ) as detalles
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
          producto p ON dv.id_producto = p.id_producto
      INNER JOIN 
          marca m ON p.id_marca = m.id_marca
      INNER JOIN 
          sub_categoria sc ON p.id_subcategoria = sc.id_subcategoria
      INNER JOIN 
          sucursal s ON s.id_sucursal = v.id_sucursal
      INNER JOIN 
          vendedor ve ON ve.dni = s.dni
      INNER JOIN 
          usuario usu ON usu.id_usuario = ve.id_usuario
      WHERE v.estado_venta != 0 AND v.id_tenant = ?`;

    const params = [id_tenant];
    if (id_sucursal) {
      query += ' AND v.id_sucursal = ?';
      params.push(id_sucursal);
    }

    // Aplicar filtro de fechas
    query += ' AND v.f_venta >= ? AND v.f_venta < DATE_ADD(?, INTERVAL 1 DAY)';
    params.push(fechaInicio, fechaFin);

    query += `
      GROUP BY 
          id, serieNum, num, tipoComprobante, cliente_n, cliente_r, dni, ruc, 
          DATE_FORMAT(v.f_venta, '%Y-%m-%d'), igv, cajero, cajeroId, estado,
          s.nombre_sucursal, s.ubicacion, cl.direccion, v.fecha_iso, v.metodo_pago,
          v.estado_sunat, usu.usua, v.observacion
      ORDER BY 
          v.id_venta DESC`;
    const limitNum = limit ? Math.max(parseInt(limit, 10) || 0, 0) : 0;
    if (limitNum > 0) {
      query += ' LIMIT ?';
      params.push(limitNum);
    }

    const [result] = await connection.query(query, params);

    res.json({ code: 1, data: result, message: "Reporte de ventas" });

  } catch (error) {
    console.error('Error en getVentasPDF:', error);
    res.status(500).json({ code: 0, message: 'Error al obtener los datos de ventas' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Función auxiliar para parsear método de pago
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
    connection = await getConnection();
    const { mes, ano, idSucursal, tipoComprobante } = req.query;
    const id_tenant = req.id_tenant;

    if (!mes || !ano) {
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

    // RUC y razón social de la empresa del tenant que exporta — antes venían
    // hardcodeados a un tenant específico, así que cualquier otro tenant
    // recibía el RUC ajeno en su propio Registro de Ventas.
    const [empresaResult] = await connection.query(
      "SELECT ruc, COALESCE(nombreComercial, razonSocial) AS nombre FROM empresa WHERE id_tenant = ? LIMIT 1",
      [id_tenant]
    );
    const rucEmpresa = empresaResult[0]?.ruc || "";
    const nombreEmpresa = empresaResult[0]?.nombre || "";

    // Inicializar los filtros y parámetros
    const filters = [];
    const startDate = format(new Date(Number(ano), Number(mes) - 1, 1), 'yyyy-MM-dd');
    const endDateExclusive = format(new Date(Number(ano), Number(mes)), 'yyyy-MM-dd');
    const queryParams = [startDate, endDateExclusive];

    // Tratamos el tipo de comprobante
    if (tipoComprobante) {
      const tipoComprobanteArray = tipoComprobante.split(',').map(tc => tc.trim()).filter(tc => tc !== '');
      if (tipoComprobanteArray.length > 0) {
        filters.push(`tc.nom_tipocomp IN (${tipoComprobanteArray.map(() => '?').join(', ')})`);
        queryParams.push(...tipoComprobanteArray);
      }
    }

    // Agregar filtro por sucursal si existe
    if (idSucursal) {
      filters.push("v.id_sucursal = ?");
      queryParams.push(idSucursal);
    }

    // Agregar filtro por id_tenant
    if (id_tenant) {
      filters.push("v.id_tenant = ?");
      queryParams.push(id_tenant);
    }

    // `comprobante_electronico` es la fuente fiscal real (tipo/serie/correlativo
    // ya separados, base gravada e IGV calculados al emitir, no recalculados
    // acá). Es 1:1 con `venta` (UNIQUE uq_cpe_tenant_venta), así que el LEFT
    // JOIN no duplica filas. Solo se cae al cálculo legado (dividir entre 1.18)
    // en ventas sin CPE emitido — antiguas, o `sin_respaldo`.
    const query = `
      SELECT
        ROW_NUMBER() OVER (ORDER BY v.id_venta) AS numero_correlativo,
        DAY(v.f_venta) AS dia_emision,
        DAY(v.f_venta) AS dia_vencimiento,
        c.num_comprobante AS num_comprobante,
        v.metodo_pago,
        COALESCE(ce.tipo_doc, '01') AS tipo_doc,
        COALESCE(ce.serie, SUBSTRING_INDEX(c.num_comprobante, '-', 1)) AS serie,
        COALESCE(ce.correlativo, SUBSTRING_INDEX(c.num_comprobante, '-', -1)) AS correlativo,
        COALESCE(ce.tipo_doc_cliente, CASE
            WHEN cl.dni IS NOT NULL AND cl.dni <> '' THEN '1'
            ELSE '6'
        END) AS tipo_doc_cliente,
        COALESCE(ce.num_doc_cliente, CASE
            WHEN cl.dni IS NOT NULL AND cl.dni <> '' THEN cl.dni
            ELSE cl.ruc
        END) AS documento_cliente,
        COALESCE(ce.nombre_cliente, CASE
            WHEN cl.nombres IS NOT NULL AND cl.nombres <> '' AND cl.apellidos IS NOT NULL AND cl.apellidos <> ''
            THEN CONCAT(cl.nombres, ' ', cl.apellidos)
            ELSE cl.razon_social
        END) AS nombre_cliente,
        s.nombre_sucursal,
        COALESCE(ce.mto_oper_gravadas, ROUND(SUM((dv.cantidad * dv.precio) - dv.descuento) / 1.18, 2)) AS base_imponible,
        COALESCE(ce.mto_igv, ROUND((SUM((dv.cantidad * dv.precio) - dv.descuento) / 1.18) * 0.18, 2)) AS igv,
        COALESCE(ce.mto_imp_venta, ROUND(SUM((dv.cantidad * dv.precio) - dv.descuento), 2)) AS total
      FROM venta v
      INNER JOIN detalle_venta dv ON v.id_venta = dv.id_venta
      INNER JOIN comprobante c ON c.id_comprobante = v.id_comprobante
      INNER JOIN cliente cl ON cl.id_cliente = v.id_cliente
      INNER JOIN sucursal s ON s.id_sucursal = v.id_sucursal
      INNER JOIN tipo_comprobante tc ON tc.id_tipocomprobante = c.id_tipocomprobante
      LEFT JOIN comprobante_electronico ce ON ce.id_tenant = v.id_tenant AND ce.id_venta = v.id_venta
      WHERE v.estado_venta != 0 AND v.f_venta >= ? AND v.f_venta < ?
      ${filters.length > 0 ? 'AND ' + filters.join(' AND ') : ''}
      GROUP BY v.id_venta, c.num_comprobante, cl.dni, cl.ruc, cl.nombres, cl.apellidos, cl.razon_social,
               v.f_venta, s.nombre_sucursal, v.metodo_pago,
               ce.tipo_doc, ce.serie, ce.correlativo, ce.tipo_doc_cliente, ce.num_doc_cliente,
               ce.nombre_cliente, ce.mto_oper_gravadas, ce.mto_igv, ce.mto_imp_venta
      ORDER BY v.id_venta`;

    const [resultados] = await connection.query(query, queryParams);

    const projectRoot = path.resolve(__dirname, '..', '..');
    const templatePath = path.join(projectRoot, "client", "src", "assets", "FormatoVentaSUNAT.xlsx");

    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({ message: "No se encontró la plantilla." });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    const worksheet = workbook.getWorksheet("Plantilla");
    if (!worksheet) {
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
    worksheet.getCell("B4").value = rucEmpresa;
    worksheet.getCell("E5").value = nombreEmpresa;

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
      worksheet.getCell(`D${currentRow}`).value = row.tipo_doc;
      worksheet.getCell(`E${currentRow}`).value = row.serie || "";
      worksheet.getCell(`F${currentRow}`).value = row.correlativo || "";
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
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
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

    ['K', 'O', 'Q', 'S', 'T'].forEach(col => {
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
    console.error('Error en exportarRegistroVentas:', error);
    res.status(500).json({ code: 0, message: "Error al exportar el archivo Excel" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const obtenerRegistroVentas = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const id_tenant = req.id_tenant;
    const { startDate: rvStart, endDate: rvEnd, id_sucursal: rvSucursal } = req.query;

    const params = [id_tenant];
    const extra = [];

    if (rvSucursal) {
      extra.push('AND v.id_sucursal = ?');
      params.push(rvSucursal);
    }
    if (rvStart && rvEnd) {
      extra.push('AND v.f_venta >= ? AND v.f_venta < DATE_ADD(?, INTERVAL 1 DAY)');
      params.push(rvStart, rvEnd);
    }

    const query = `
      SELECT
        ROW_NUMBER() OVER (ORDER BY v.id_venta) AS numero_correlativo,
        v.f_venta AS fecha,
        s.nombre_sucursal AS sucursal,
        s.ubicacion AS ubicacion_sucursal,
        s.id_sucursal,
        COALESCE(ce.num_doc_cliente, CASE
            WHEN cl.dni IS NOT NULL AND cl.dni <> '' THEN cl.dni
            ELSE cl.ruc
        END) AS documento_cliente,
        COALESCE(ce.nombre_cliente, CASE
            WHEN cl.nombres IS NOT NULL AND cl.nombres <> '' AND cl.apellidos IS NOT NULL AND cl.apellidos <> ''
            THEN CONCAT(cl.nombres, ' ', cl.apellidos)
            ELSE cl.razon_social
        END) AS nombre_cliente,
        c.num_comprobante AS num_comprobante,
        tc.nom_tipocomp AS tipo_comprobante,
        COALESCE(ce.moneda, 'PEN') AS moneda,
        ce.estado AS estado_sunat,
        (ce.id_cpe IS NOT NULL) AS tiene_cpe,
        COALESCE(ce.mto_oper_gravadas, ROUND(SUM((dv.cantidad * dv.precio) - dv.descuento) / 1.18, 2)) AS importe,
        COALESCE(ce.mto_igv, ROUND((SUM((dv.cantidad * dv.precio) - dv.descuento) / 1.18) * 0.18, 2)) AS igv,
        COALESCE(ce.mto_imp_venta, ROUND(SUM((dv.cantidad * dv.precio) - dv.descuento), 2)) AS total
      FROM venta v
      INNER JOIN detalle_venta dv ON v.id_venta = dv.id_venta
      INNER JOIN comprobante c ON c.id_comprobante = v.id_comprobante
      INNER JOIN tipo_comprobante tc ON tc.id_tipocomprobante = c.id_tipocomprobante
      INNER JOIN cliente cl ON cl.id_cliente = v.id_cliente
      INNER JOIN sucursal s ON s.id_sucursal = v.id_sucursal
      LEFT JOIN comprobante_electronico ce ON ce.id_tenant = v.id_tenant AND ce.id_venta = v.id_venta
      WHERE v.estado_venta != 0
        AND v.id_tenant = ?
        ${extra.join(' ')}
      GROUP BY
        v.id_venta, v.f_venta, s.nombre_sucursal, s.ubicacion,
        cl.dni, cl.ruc, cl.nombres, cl.apellidos, cl.razon_social,
        c.num_comprobante, tc.nom_tipocomp,
        ce.num_doc_cliente, ce.nombre_cliente, ce.moneda, ce.estado, ce.id_cpe,
        ce.mto_oper_gravadas, ce.mto_igv, ce.mto_imp_venta
      ORDER BY v.id_venta
    `;

    const [resultados] = await connection.query(query, params);

    // `fuente` es transparencia, no adorno: un registro fiscal armado con el
    // cálculo legado (1.18 fijo, sin desglose gravada/exonerada) no es lo
    // mismo que uno tomado del CPE realmente emitido a SUNAT.
    const registroVentas = resultados.map(r => ({
      numero_correlativo: r.numero_correlativo,
      fecha: r.fecha,
      sucursal: r.sucursal,
      ubicacion_sucursal: r.ubicacion_sucursal,
      id_sucursal: r.id_sucursal,
      documento_cliente: r.documento_cliente,
      nombre_cliente: r.nombre_cliente,
      num_comprobante: r.num_comprobante,
      tipo_comprobante: r.tipo_comprobante,
      moneda: r.moneda,
      estado_sunat: r.estado_sunat,
      fuente: r.tiene_cpe ? 'CPE' : 'LEGACY',
      importe: parseFloat(r.importe) || 0,
      igv: parseFloat(r.igv) || 0,
      total: parseFloat(r.total) || 0,
    }));

    res.json({ code: 1, data: registroVentas, message: "Registro de ventas obtenido correctamente" });
  } catch (error) {
    console.error('Error en obtenerRegistroVentas:', error);
    res.status(500).json({ code: 0, message: "Error al obtener el registro de ventas" });
  } finally {
    if (connection) connection.release();
  }
};

// Tendencia de ventas (por día en el rango filtrado)
const getTendenciaVentas = async (req, res) => {
  let connection;
  const { id_sucursal, year, month, week } = req.query;
  const id_tenant = req.id_tenant;

  try {
    connection = await getConnection();

    // Calcular fechas según filtros
    let fechaInicioActual, fechaFinActual;
    const now = new Date();
    const y = year ? parseInt(year) : now.getFullYear();
    const m = month ? parseInt(month) - 1 : now.getMonth();

    if (week && week !== "all" && month) {
      // Semana empieza el día 1 y termina el último día del mes
      const diasEnMes = new Date(y, m + 1, 0).getDate();
      const weekNumber = parseInt(week.replace(/\D/g, ""));
      const startDay = (weekNumber - 1) * 7 + 1;
      const endDay = Math.min(weekNumber * 7, diasEnMes);

      fechaInicioActual = new Date(y, m, startDay);
      fechaFinActual = new Date(y, m, endDay);
    } else if (month) {
      fechaInicioActual = new Date(y, m, 1);
      fechaFinActual = new Date(y, m + 1, 0);
    } else {
      fechaInicioActual = new Date(y, 0, 1);
      fechaFinActual = new Date(y, 11, 31);
    }

    const f = (d) => format(d, "yyyy-MM-dd");

    let query = `
      SELECT 
        DATE(v.f_venta) AS fecha,
        SUM(dv.total) AS total_ventas
      FROM venta v
      JOIN detalle_venta dv ON v.id_venta = dv.id_venta
      WHERE v.estado_venta != 0
        AND v.f_venta >= ? AND v.f_venta < DATE_ADD(?, INTERVAL 1 DAY)
    `;
    const params = [f(fechaInicioActual), f(fechaFinActual)];
    if (id_sucursal) {
      query += ` AND v.id_sucursal = ?`;
      params.push(id_sucursal);
    }
    if (id_tenant) {
      query += ` AND v.id_tenant = ?`;
      params.push(id_tenant);
    }
    query += `
      GROUP BY fecha
      ORDER BY fecha ASC
    `;

    const [result] = await connection.query(query, params);
    res.json({ code: 1, data: result, message: "Tendencia de ventas obtenida correctamente" });
  } catch (error) {
    console.error('Error en getTendenciaVentas:', error);
    res.status(500).json({ code: 0, message: "Error al obtener tendencia de ventas" });
  } finally {
    if (connection) connection.release();
  }
};

// Top productos por margen de ganancia
const getTopProductosMargen = async (req, res) => {
  let connection;
  const { id_sucursal, year, month, week, limit = 5 } = req.query;
  const id_tenant = req.id_tenant;

  try {
    connection = await getConnection();

    // Calcular fechas según filtros
    let fechaInicioActual, fechaFinActual;
    const now = new Date();
    const y = year ? parseInt(year) : now.getFullYear();
    const m = month ? parseInt(month) - 1 : now.getMonth();

    if (week && week !== "all" && month) {
      // Semana empieza el día 1 y termina el último día del mes
      const diasEnMes = new Date(y, m + 1, 0).getDate();
      const weekNumber = parseInt(week.replace(/\D/g, ""));
      const startDay = (weekNumber - 1) * 7 + 1;
      const endDay = Math.min(weekNumber * 7, diasEnMes);

      fechaInicioActual = new Date(y, m, startDay);
      fechaFinActual = new Date(y, m, endDay);
    } else if (month) {
      fechaInicioActual = new Date(y, m, 1);
      fechaFinActual = new Date(y, m + 1, 0);
    } else {
      fechaInicioActual = new Date(y, 0, 1);
      fechaFinActual = new Date(y, 11, 31);
    }

    const f = (d) => format(d, "yyyy-MM-dd");

    let query = `
      SELECT 
        CASE 
            WHEN ps.sku IS NOT NULL AND ps.sku != '' AND ps.sku LIKE CONCAT(p.descripcion, '%') THEN ps.sku
            WHEN ps.sku IS NOT NULL AND ps.sku != '' THEN CONCAT(p.descripcion, ' - ', ps.sku)
            ELSE 
                TRIM(CONCAT(
                    p.descripcion,
                    CASE WHEN tal.nombre IS NOT NULL THEN CONCAT(' - ', tal.nombre) ELSE '' END,
                    CASE WHEN ton.nombre IS NOT NULL THEN CONCAT(' - ', ton.nombre) ELSE '' END
                ))
        END AS nombre,
        -- Margen REAL: ingreso menos costo, y solo sobre las líneas cuyo costo
        -- quedó fotografiado al vender. Antes esta fórmula era
        -- (dv.precio - p.precio), o sea la diferencia contra el precio de
        -- LISTA: eso es el descuento aplicado, no el margen. Un producto
        -- vendido a precio pleno reportaba "margen 0%", que es exactamente lo
        -- contrario de la verdad.
        COALESCE(ROUND(
          (SUM(CASE WHEN dv.costo_unitario IS NOT NULL THEN dv.total END)
           - SUM(CASE WHEN dv.costo_unitario IS NOT NULL THEN dv.costo_unitario * dv.cantidad END))
          / NULLIF(SUM(CASE WHEN dv.costo_unitario IS NOT NULL THEN dv.total END), 0) * 100
        , 2), 0) AS margen,
        -- Cuántas líneas quedaron fuera por no tener costo: sin esto, un
        -- producto con 1 línea costeada de 50 se vería igual de confiable que
        -- uno con todas.
        SUM(dv.costo_unitario IS NULL) AS lineas_sin_costo,
        COALESCE(SUM(dv.total), 0) AS ventas
      FROM detalle_venta dv
      JOIN producto p ON dv.id_producto = p.id_producto
      JOIN venta v ON dv.id_venta = v.id_venta
      LEFT JOIN producto_sku ps ON dv.id_sku = ps.id_sku
      LEFT JOIN talla tal ON dv.id_talla = tal.id_talla
      LEFT JOIN tonalidad ton ON dv.id_tonalidad = ton.id_tonalidad
      WHERE v.estado_venta != 0
        AND v.f_venta >= ? AND v.f_venta < DATE_ADD(?, INTERVAL 1 DAY)
    `;
    const params = [f(fechaInicioActual), f(fechaFinActual)];
    if (id_sucursal) {
      query += ` AND v.id_sucursal = ?`;
      params.push(id_sucursal);
    }
    if (id_tenant) {
      query += ` AND v.id_tenant = ?`;
      params.push(id_tenant);
    }
    query += `
      GROUP BY p.id_producto, p.descripcion, ps.sku, tal.nombre, ton.nombre
      ORDER BY margen DESC, ventas DESC
      LIMIT ?
    `;
    params.push(Number(limit));

    const [result] = await connection.query(query, params);
    // Formatear ventas a string moneda
    result.forEach(r => {
      r.ventas = `S/. ${Number(r.ventas).toFixed(2)}`;
    });

    res.json({ code: 1, data: result, message: "Top productos por margen obtenidos correctamente" });
  } catch (error) {
    console.error('Error en getTopProductosMargen:', error);
    res.status(500).json({ code: 0, message: "Error al obtener top productos por margen" });
  } finally {
    if (connection) connection.release();
  }
};


// Antigüedad de Stock (Aging Report): DSI y clasificación 0-30/31-60/61-90/90+
// días por producto. "Antigüedad" = días desde la última entrada REAL de
// stock (nota con id_almacenO NULL — un traslado no es una entrada nueva,
// mismo criterio que ya usa `notaingreso.controller.js` para el costo
// promedio). Si un SKU nunca tuvo una nota de ingreso registrada (llegó por
// otra vía, ej. import inicial), se usa `producto_sku.f_creacion` como
// referencia — es la única fecha que sí está poblada en todos los casos.
const getStockAging = async (req, res) => {
  let connection;
  try {
    const id_tenant = req.id_tenant;
    connection = await getConnection();

    const [productos] = await connection.query(`
      SELECT PR.id_producto, PR.descripcion, MA.nom_marca, CA.nom_subcat AS categoria
      FROM producto PR
      INNER JOIN marca MA ON MA.id_marca = PR.id_marca
      INNER JOIN sub_categoria CA ON CA.id_subcategoria = PR.id_subcategoria
      WHERE PR.estado_producto = 1 AND PR.id_tenant = ?
    `, [id_tenant]);

    const stockMap = await stockPorProducto(connection, { id_tenant, ids_producto: productos.map((p) => p.id_producto) });

    // Última entrada real por SKU (ingresos, no traslados), agregada a nivel
    // de producto tomando la MÁS RECIENTE entre sus SKUs: si el producto tuvo
    // reposición reciente en cualquier variante, no está "parado" en su
    // conjunto aunque a alguna talla/color en particular le falte.
    const [entradas] = await connection.query(`
      SELECT ps.id_producto, MAX(n.fecha) AS ultima_entrada
      FROM detalle_nota dn
      INNER JOIN nota n ON n.id_nota = dn.id_nota
      INNER JOIN producto_sku ps ON ps.id_sku = dn.id_sku
      WHERE n.id_almacenO IS NULL AND n.estado_nota = 0 AND dn.id_tenant = ?
      GROUP BY ps.id_producto
    `, [id_tenant]);
    const ultimaEntradaPorProducto = new Map(entradas.map((e) => [e.id_producto, e.ultima_entrada]));

    const [creaciones] = await connection.query(`
      SELECT id_producto, MAX(f_creacion) AS f_creacion FROM producto_sku WHERE id_tenant = ? GROUP BY id_producto
    `, [id_tenant]);
    const creacionPorProducto = new Map(creaciones.map((c) => [c.id_producto, c.f_creacion]));

    const ahora = Date.now();
    const bucket = (dias) => {
      if (dias <= 30) return "0-30";
      if (dias <= 60) return "31-60";
      if (dias <= 90) return "61-90";
      return "90+";
    };

    const data = productos
      .map((p) => {
        const stock = stockMap.get(p.id_producto) ?? 0;
        const referencia = ultimaEntradaPorProducto.get(p.id_producto) ?? creacionPorProducto.get(p.id_producto) ?? null;
        const dias = referencia ? Math.max(0, Math.floor((ahora - new Date(referencia).getTime()) / 86400000)) : null;
        return {
          id_producto: p.id_producto,
          descripcion: p.descripcion,
          nom_marca: p.nom_marca,
          categoria: p.categoria,
          stock,
          dias_sin_movimiento: dias,
          rango: dias == null ? "Sin dato" : bucket(dias),
        };
      })
      .filter((p) => p.stock > 0)
      .sort((a, b) => (b.dias_sin_movimiento ?? -1) - (a.dias_sin_movimiento ?? -1));

    res.json({ code: 1, data });
  } catch (error) {
    console.error('Error en getStockAging:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

// Mapa de calor de horas pico: cantidad de ventas por hora del día × día de
// la semana, para decidir turnos de caja. `DAYOFWEEK` de MySQL: 1=domingo…7=sábado.
const getVentasHeatmap = async (req, res) => {
  let connection;
  try {
    const id_tenant = req.id_tenant;
    connection = await getConnection();

    const [filas] = await connection.query(`
      SELECT DAYOFWEEK(v.f_venta) AS dia_semana, HOUR(v.hora_creacion) AS hora, COUNT(*) AS ventas
      FROM venta v
      WHERE v.id_tenant = ? AND v.estado_venta = 1 AND v.f_venta IS NOT NULL AND v.hora_creacion IS NOT NULL
      GROUP BY dia_semana, hora
    `, [id_tenant]);

    res.json({
      code: 1,
      data: filas.map((f) => ({ dia_semana: f.dia_semana, hora: f.hora, ventas: Number(f.ventas) })),
    });
  } catch (error) {
    console.error('Error en getVentasHeatmap:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

export const methods = {
  getTotalSalesRevenue,
  getStockAging,
  getVentasHeatmap,
  getTotalProductosVendidos,
  getVentasPDF,
  getProductoMasVendido,
  getSucursalMayorRendimiento,
  getCantidadVentasPorProducto,
  getCantidadVentasPorSubcategoria,
  getAnalisisGananciasSucursales,
  obtenerRegistroVentas,
  exportarRegistroVentas,
  getSucursales,
  getTendenciaVentas,
  getTopProductosMargen,
};
