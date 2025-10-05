import { getConnection } from "./../database/database.js";
import { startOfWeek, endOfWeek, subWeeks, subMonths, format } from "date-fns";


const getTotalProductosVendidos = async (req, res) => {
  let connection;
  const { id_sucursal, year, month, week, limit } = req.query;
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
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  }  finally {
    if (connection) {
        connection.release();
    }
  }
};



const getCantidadVentasPorProducto = async (req, res) => {
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
        p.descripcion,
        SUM(dv.cantidad) AS cantidad_vendida,
        SUM(dv.total) AS dinero_generado
      FROM 
        detalle_venta dv
      JOIN 
        producto p ON dv.id_producto = p.id_producto
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
      GROUP BY p.id_producto, p.descripcion
      ORDER BY cantidad_vendida DESC
    `;

    const limitNum = limit ? Math.max(parseInt(limit, 10) || 0, 0) : 0;
    if (limitNum > 0) {
      query += `\r\n      LIMIT ?\r\n    `;
      params.push(limitNum);
    }

    const [result] = await connection.query(query, params);
    res.json({ code: 1, data: result, message: "Cantidad de ventas por producto obtenida correctamente" });
  } catch (error) {
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  }  finally {
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
          s.id_sucursal, mes
      ORDER BY 
          YEAR(v.f_venta), MONTH(v.f_venta), s.id_sucursal
    `;

    const [result] = await connection.query(query, [id_tenant]);

    res.json({ code: 1, data: result, message: "Análisis de ganancias por sucursal obtenido correctamente" });
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ code: 0, message: "Error interno del servidor" });
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
    const id_tenant = req.id_tenant;
    const { startDate, endDate, id_sucursal, limit } = req.query;

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
      WHERE v.estado_venta != 0 AND v.id_tenant = ?`;

    const params = [id_tenant];
    if (id_sucursal) {
      query += ' AND v.id_sucursal = ?';
      params.push(id_sucursal);
    }
    if (startDate && endDate) {
      query += ' AND v.f_venta >= ? AND v.f_venta < DATE_ADD(?, INTERVAL 1 DAY)';
      params.push(startDate, endDate);
    }

    query += `
      GROUP BY 
          id, serieNum, num, tipoComprobante, cliente_n, cliente_r, dni, ruc, 
          DATE_FORMAT(v.f_venta, '%Y-%m-%d'), igv, cajero, cajeroId, estado
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
    res.status(500).json({ message: 'Error al obtener los datos de ventas' });
  }   finally {
    if (connection) {
        connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
    }
  }
};


import path from "path";
import ExcelJS from "exceljs";
import fs from "fs";

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
      WHERE v.estado_venta != 0 AND v.f_venta >= ? AND v.f_venta < ?
      ${filters.length > 0 ? 'AND ' + filters.join(' AND ') : ''}
      GROUP BY v.id_venta, c.num_comprobante, cl.dni, cl.ruc, cl.nombres, cl.apellidos, cl.razon_social, 
               v.f_venta, s.nombre_sucursal, v.metodo_pago
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
    const id_tenant = req.id_tenant;

    // Consulta principal de ventas filtrando por id_tenant
    let query = `
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
      WHERE v.estado_venta != 0
        AND v.id_tenant = ?
      GROUP BY 
        v.id_venta, v.f_venta, s.nombre_sucursal, s.ubicacion, 
        cl.dni, cl.ruc, cl.nombres, cl.apellidos, cl.razon_social,
        c.num_comprobante, tc.nom_tipocomp
      ORDER BY 
        v.id_venta
    `;
    const params = [id_tenant];
    const { startDate: rvStart, endDate: rvEnd, id_sucursal: rvSucursal } = req.query;
    //
    // Añadir filtros opcionales
    if (rvSucursal) {
      query = query.replace('ORDER BY', ' AND v.id_sucursal = ? ORDER BY');
      params.push(rvSucursal);
    }
    if (rvStart && rvEnd) {
      // handled below in queryFinal composition
    }

    // Compose final query with extra WHERE parts before GROUP BY
    let extraWhere = '';
    if (rvSucursal) {
      extraWhere += ' AND v.id_sucursal = ?';
      params.push(rvSucursal);
    }
    if (rvStart && rvEnd) {
      extraWhere += ' AND v.f_venta >= ? AND v.f_venta < DATE_ADD(?, INTERVAL 1 DAY)';
      params.push(rvStart, rvEnd);
    }
    const queryFinal = query.replace('GROUP BY', `${extraWhere}\r\n      GROUP BY`);

    const [resultados] = await connection.query(queryFinal, params);

    // Mapear resultados
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

    res.json({
      code: 1,
      data: registroVentas,
      message: "Registro de ventas obtenido correctamente",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener el registro de ventas"
    });
  } finally {
    if (connection) {
      connection.release();
    }
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
    res.status(500).send("Tendencia de ventas no obtenida correctamente");
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
        p.descripcion AS nombre,
        ROUND(AVG((dv.precio - p.precio) / NULLIF(dv.precio,0) * 100), 2) AS margen,
        SUM(dv.total) AS ventas
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
    res.status(500).send("Top productos por margen no obtenidos correctamente");
  } finally {
    if (connection) connection.release();
  }
};


export const methods = {
  getTotalSalesRevenue,
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
