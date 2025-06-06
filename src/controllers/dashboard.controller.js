import { getConnection } from "./../database/database";
import { subDays, subWeeks, subMonths, subYears, format } from "date-fns";


// Función auxiliar para obtener el id_sucursal usando el nombre de usuario
const getSucursalIdForUser = async (usuario, connection) => {
  const [result] = await connection.query(
    `SELECT s.id_sucursal 
     FROM sucursal s 
     INNER JOIN vendedor v ON v.dni = s.dni 
     INNER JOIN usuario u ON u.id_usuario = v.id_usuario
     INNER JOIN sucursal_almacen sa ON sa.id_sucursal=s.id_sucursal 
     WHERE u.usua = ? AND s.estado_sucursal != 0`,
    [usuario]
  );
  if (result.length === 0) {
    throw new Error("No se encontró la sucursal para el usuario");
  }
  return result[0].id_sucursal;
};


const getSucursalInicio = async (req, res) => {
  let connection;
  const { nombre = '' } = req.query; 

  try {
      connection = await getConnection();
      if (!connection) throw new Error("Error en la conexión con la base de datos.");

      // Consulta SQL para obtener solo el nombre de las sucursales
      const query = `
                SELECT 
              s.id_sucursal AS id,
              s.nombre_sucursal AS nombre,
              sa.id_almacen AS almace_n
          FROM sucursal s
          INNER JOIN sucursal_almacen sa ON sa.id_sucursal=s.id_sucursal
          WHERE s.nombre_sucursal LIKE ? AND s.estado_sucursal != 0
      `;

      const params = [`%${nombre}%`];

      const [result] = await connection.query(query, params);

      // Enviar la respuesta con los resultados
      res.json({ code: 1, data: result, message: "Sucursales listadas" });

  } catch (error) {
      console.error("Error al obtener sucursales:", error);
      res.status(500).json({ code: 0, message: error.message });
  } finally {
      if (connection) connection.release(); 
  }
};

// Función auxiliar para obtener el rol del usuario si no se envía en la petición
const getUsuarioRol = async (usuario, connection) => {
  const [result] = await connection.query(
    `SELECT r.nom_rol 
     FROM rol r 
     INNER JOIN usuario u ON u.id_rol = r.id_rol 
     WHERE u.usua = ?`,
    [usuario]
  );
  if (result.length === 0) {
    throw new Error("No se encontró rol para el usuario");
  }
  return result[0].nom_rol;
};

const getUserRolController = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const { usuario } = req.query;
    
    if (!usuario) {
      return res.status(400).json({ message: "Falta el parámetro usuario" });
    }
    
    // Consulta para obtener el id_rol
    const [rolResult] = await connection.query(
      `SELECT u.id_rol as rol_id 
       FROM usuario u 
       WHERE u.usua = ?`,
      [usuario]
    );
    
    if (rolResult.length === 0) {
      return res.status(404).json({ message: "No se encontró el usuario" });
    }
    
    res.json({ code: 1, rol_id: rolResult[0].rol_id, message: "Rol obtenido correctamente" });
  } catch (error) {
    console.error("Error al obtener rol de usuario:", error);
    res.status(500).json({ message: error.message });
  } finally {
    if (connection) connection.release();
  }
};

const getProductoMasVendido = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    // Se obtiene el parámetro adicional "sucursal" (opcional)
    let { tiempo, usuario: usuarioQuery, rol, sucursal } = req.query;
    if (!tiempo) return res.status(400).json({ message: "Falta filtro de tiempo" });
    if (!usuarioQuery) return res.status(400).json({ message: "Falta el campo usuario" });
    if (!rol) {
      rol = await getUsuarioRol(usuarioQuery, connection);
    }

    let fechaInicio;
    const fechaFin = new Date();

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

    let query;
    let params;
    // Si el rol es ADMIN, se consulta sin filtro de sucursal a menos que se envíe el parámetro "sucursal"
    if (rol.toLowerCase() === "administrador") {
      query = `
        SELECT 
          p.id_producto,
          p.descripcion,
          SUM(dv.cantidad) AS total_vendido
        FROM detalle_venta dv
        JOIN producto p ON dv.id_producto = p.id_producto
        JOIN venta v ON dv.id_venta = v.id_venta
        WHERE v.f_venta BETWEEN ? AND ? AND v.estado_venta != 0
      `;
      params = [fechaInicioISO, fechaFinISO];
      if(sucursal) {
        query += " AND v.id_sucursal = ?";
        params.push(sucursal);
      }
      query += `
        GROUP BY p.id_producto, p.descripcion
        ORDER BY total_vendido DESC
        LIMIT 1;
      `;
    } else {
      const id_sucursal = await getSucursalIdForUser(usuarioQuery, connection);
      query = `
        SELECT 
          p.id_producto,
          p.descripcion,
          SUM(dv.cantidad) AS total_vendido
        FROM detalle_venta dv
        JOIN producto p ON dv.id_producto = p.id_producto
        JOIN venta v ON dv.id_venta = v.id_venta
        WHERE v.f_venta BETWEEN ? AND ? AND v.id_sucursal = ? AND v.estado_venta != 0
        GROUP BY p.id_producto, p.descripcion
        ORDER BY total_vendido DESC
        LIMIT 1;
      `;
      params = [fechaInicioISO, fechaFinISO, id_sucursal];
    }

    const [result] = await connection.query(query, params);
    if (result.length === 0) {
      return res.status(404).json({ message: "No se encontraron productos vendidos." });
    }
    res.json({ code: 1, data: result[0], message: "Producto más vendido obtenido correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
    if (connection) connection.release();
  }
};

const getTotalVentas = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    let { tiempo, usuario: usuarioQuery, rol, sucursal, comparacion } = req.query;

    if (!tiempo || !usuarioQuery) {
      return res.status(400).json({ message: "Falta filtro de tiempo o usuario" });
    }

    if (!rol) {
      rol = await getUsuarioRol(usuarioQuery, connection);
    }

    const fechaFin = new Date();
    let fechaInicio, fechaInicioAnterior, fechaFinAnterior;

    switch (tiempo) {
      case '24h':
        fechaInicio = subDays(fechaFin, 1);
        fechaInicioAnterior = subDays(fechaInicio, 1);
        fechaFinAnterior = subDays(fechaFin, 1);
        break;
      case 'semana':
        fechaInicio = subWeeks(fechaFin, 1);
        fechaInicioAnterior = subWeeks(fechaInicio, 1);
        fechaFinAnterior = subWeeks(fechaFin, 1);
        break;
      case 'mes':
        fechaInicio = subMonths(fechaFin, 1);
        fechaInicioAnterior = subMonths(fechaInicio, 1);
        fechaFinAnterior = subMonths(fechaFin, 1);
        break;
      case 'anio':
        fechaInicio = subYears(fechaFin, 1);
        fechaInicioAnterior = subYears(fechaInicio, 1);
        fechaFinAnterior = subYears(fechaFin, 1);
        break;
      default:
        return res.status(400).json({ message: "Filtro de tiempo no válido" });
    }

    fechaInicio.setHours(0, 0, 0, 0);
    fechaFin.setHours(23, 59, 59, 999);
    fechaInicioAnterior.setHours(0, 0, 0, 0);
    fechaFinAnterior.setHours(23, 59, 59, 999);

    const fechaInicioISO = format(fechaInicio, 'yyyy-MM-dd HH:mm:ss');
    const fechaFinISO = format(fechaFin, 'yyyy-MM-dd HH:mm:ss');
    const fechaInicioAnteriorISO = format(fechaInicioAnterior, 'yyyy-MM-dd HH:mm:ss');
    const fechaFinAnteriorISO = format(fechaFinAnterior, 'yyyy-MM-dd HH:mm:ss');

    const queryBase = `
      SELECT SUM(dv.total) AS total, COUNT(v.id_venta) AS totalClientes
      FROM detalle_venta dv
      JOIN venta v ON dv.id_venta = v.id_venta
      WHERE v.f_venta BETWEEN ? AND ? AND v.estado_venta != 0
    `;

    const extraSucursal = " AND v.id_sucursal LIKE ?";
    let actual, anterior;
    const paramsActual = [fechaInicioISO, fechaFinISO];
    const paramsAnterior = [fechaInicioAnteriorISO, fechaFinAnteriorISO];

    if (rol.toLowerCase() === "administrador") {
      if (sucursal) {
        paramsActual.push(sucursal);
        paramsAnterior.push(sucursal);
        actual = await connection.query(queryBase + extraSucursal, paramsActual);
        anterior = await connection.query(queryBase + extraSucursal, paramsAnterior);
      } else {
        actual = await connection.query(queryBase, paramsActual);
        anterior = await connection.query(queryBase, paramsAnterior);
      }
    } else {
      const id_sucursal = await getSucursalIdForUser(usuarioQuery, connection);
      paramsActual.push(id_sucursal);
      paramsAnterior.push(id_sucursal);
      actual = await connection.query(queryBase + extraSucursal, paramsActual);
      anterior = await connection.query(queryBase + extraSucursal, paramsAnterior);
    }

    const valorActual = actual[0][0].total || 0;
    const valorAnterior = anterior[0][0].total || 0;
    const totalClientesActual = actual[0][0].totalClientes || 0;

    const porcentajeCambio = valorAnterior > 0
      ? ((valorActual - valorAnterior) / valorAnterior) * 100
      : (valorActual > 0 ? 100 : 0);

res.json({
  code: 1,
  data: valorActual,
  anterior: valorAnterior,
  cambio: porcentajeCambio, // <-- solo el número
  totalRegistros: totalClientesActual,
  message: "Total de ventas y cambio calculado"
});

  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
    if (connection) connection.release();
  }
};

const getTotalProductosVendidos = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    let { tiempo, usuario: usuarioQuery, rol, sucursal } = req.query;
    if (!tiempo) return res.status(400).json({ message: "Falta filtro de tiempo" });
    if (!usuarioQuery) return res.status(400).json({ message: "Falta el campo usuario" });

    if (!rol) {
      rol = await getUsuarioRol(usuarioQuery, connection);
    }

    const fechaFin = new Date();
    let fechaInicio;
    let fechaComparacionInicio;
    let fechaComparacionFin;

    // Establecer rangos de fechas para actual y comparación
    switch (tiempo) {
      case '24h':
        fechaInicio = subDays(fechaFin, 1);
        fechaComparacionInicio = subDays(fechaInicio, 1);
        fechaComparacionFin = new Date(fechaInicio);
        break;
      case 'semana':
        fechaInicio = subWeeks(fechaFin, 1);
        fechaComparacionInicio = subWeeks(fechaInicio, 1);
        fechaComparacionFin = new Date(fechaInicio);
        break;
      case 'mes':
        fechaInicio = subMonths(fechaFin, 1);
        fechaComparacionInicio = subMonths(fechaInicio, 1);
        fechaComparacionFin = new Date(fechaInicio);
        break;
      case 'anio':
        fechaInicio = subYears(fechaFin, 1);
        fechaComparacionInicio = subYears(fechaInicio, 1);
        fechaComparacionFin = new Date(fechaInicio);
        break;
      default:
        return res.status(400).json({ message: "Filtro de tiempo no válido" });
    }

    fechaInicio.setHours(0, 0, 0, 0);
    fechaFin.setHours(23, 59, 59, 999);
    fechaComparacionInicio.setHours(0, 0, 0, 0);
    fechaComparacionFin.setHours(23, 59, 59, 999);

    const fechaInicioISO = format(fechaInicio, 'yyyy-MM-dd HH:mm:ss');
    const fechaFinISO = format(fechaFin, 'yyyy-MM-dd HH:mm:ss');
    const fechaComparacionInicioISO = format(fechaComparacionInicio, 'yyyy-MM-dd HH:mm:ss');
    const fechaComparacionFinISO = format(fechaComparacionFin, 'yyyy-MM-dd HH:mm:ss');

    let baseQuery = `
      SELECT SUM(dv.cantidad) AS total_productos_vendidos
      FROM detalle_venta dv
      JOIN venta v ON dv.id_venta = v.id_venta
      WHERE v.f_venta BETWEEN ? AND ? AND v.estado_venta != 0
    `;

    const isAdmin = rol.toLowerCase() === "administrador";
    const id_sucursal = !isAdmin ? await getSucursalIdForUser(usuarioQuery, connection) : null;

    // Construir consultas
    const buildQuery = (inicio, fin) => {
      let query = baseQuery;
      const params = [inicio, fin];
      if (isAdmin) {
        if (sucursal) {
          query += " AND v.id_sucursal = ?";
          params.push(sucursal);
        }
      } else {
        query += " AND v.id_sucursal LIKE ?";
        params.push(id_sucursal);
      }
      return { query, params };
    };

    const { query: actualQuery, params: actualParams } = buildQuery(fechaInicioISO, fechaFinISO);
    const { query: anteriorQuery, params: anteriorParams } = buildQuery(fechaComparacionInicioISO, fechaComparacionFinISO);

    const [[actualResult]] = await connection.query(actualQuery, actualParams);
    const [[anteriorResult]] = await connection.query(anteriorQuery, anteriorParams);

    const actual = actualResult.total_productos_vendidos || 0;
    const anterior = anteriorResult.total_productos_vendidos || 0;

    let porcentajeCambio = null;
    if (anterior === 0) {
      porcentajeCambio = actual === 0 ? 0 : 100;
    } else {
      porcentajeCambio = ((actual - anterior) / anterior) * 100;
    }

    res.json({
      code: 1,
      totalProductosVendidos: actual,
      cambio: porcentajeCambio.toFixed(2), // string con 2 decimales
      message: "Total de productos vendidos obtenido correctamente",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
    if (connection) connection.release();
  }
};


const getComparacionVentasPorRango = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    // Se reciben los parámetros vía query (ya que se usa GET)
    let { fechaInicio, fechaFin, usuario: usuarioQuery, rol, sucursal } = req.query;
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ message: "Se requieren fecha de inicio y fecha fin" });
    }
    // Si no se envía rol, se obtiene del usuario o se asume "admin"
    if (!rol || rol.trim() === "") {
      if (usuarioQuery) {
        // Si se recibe sucursal desde la query, asumimos que se quiere filtrar manualmente.
        // De lo contrario se obtiene el rol del usuario.
        if (sucursal && sucursal.trim() !== "") {
          rol = "administrador";
        } else {
          rol = await getUsuarioRol(usuarioQuery, connection);
        }
      } else {
        rol = "administrador";
      }
    }

    const fechaInicioFormatted = format(new Date(fechaInicio), "yyyy-MM-dd HH:mm:ss");
    const fechaFinFormatted = format(new Date(fechaFin), "yyyy-MM-dd HH:mm:ss");

    let query = `
      SELECT MONTH(v.f_venta) AS mes, SUM(dv.total) AS total_ventas
      FROM detalle_venta dv
      JOIN venta v ON dv.id_venta = v.id_venta
      WHERE v.f_venta BETWEEN ? AND ?
    `;
    let params = [fechaInicioFormatted, fechaFinFormatted];

    // Si se recibe un valor para sucursal, lo priorizamos y lo usamos en el filtro
    if (sucursal && sucursal.trim() !== "") {
      query += " AND v.id_sucursal = ?";
      params.push(sucursal);
    } else if (rol.toLowerCase() !== "administrador") {
      // Si el usuario no es admin y no se envió sucursal, se obtiene la sucursal por defecto del usuario
      if (!usuarioQuery)
        return res.status(401).json({ message: "Usuario no autenticado" });
      const id_sucursal = await getSucursalIdForUser(usuarioQuery, connection);
      query += " AND v.id_sucursal = ?";
      params.push(id_sucursal);
    }

    query += " AND v.estado_venta != 0 ";
    query += " GROUP BY mes ORDER BY mes;";

    const [result] = await connection.query(query, params);
    const ventasPorMes = Array.from({ length: 12 }, (_, index) => ({
      mes: index + 1,
      total_ventas: 0,
    }));

    result.forEach((row) => {
      const mesIndex = row.mes - 1;
      ventasPorMes[mesIndex].total_ventas = row.total_ventas;
    });

    res.json({
      code: 1,
      data: ventasPorMes,
      message: "Ventas por mes obtenidas correctamente",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
    if (connection) connection.release();
  }
};

const getVentasPorSucursalPeriodo = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const { tiempo = "24h", sucursal } = req.query;

    // Calcular fechas según filtro de tiempo
    const fechaFin = new Date();
    let fechaInicio;
    switch (tiempo) {
      case "24h":
        fechaInicio = subDays(fechaFin, 1);
        break;
      case "semana":
        fechaInicio = subWeeks(fechaFin, 1);
        break;
      case "mes":
        fechaInicio = subMonths(fechaFin, 1);
        break;
      case "anio":
        fechaInicio = subYears(fechaFin, 1);
        break;
      default:
        return res.status(400).json({ code: 0, message: "Filtro de tiempo no válido" });
    }
    fechaInicio.setHours(0, 0, 0, 0);
    fechaFin.setHours(23, 59, 59, 999);

    const f = (d) => format(d, "yyyy-MM-dd HH:mm:ss");

    // Filtro por sucursal (opcional)
    let where = `WHERE v.estado_venta != 0 AND v.f_venta BETWEEN ? AND ?`;
    let params = [f(fechaInicio), f(fechaFin)];
    if (sucursal) {
      where += " AND v.id_sucursal = ?";
      params.push(sucursal);
    }

    // Ventas por sucursal
    const [result] = await connection.query(
      `
      SELECT 
        s.id_sucursal,
        s.nombre_sucursal AS nombre,
        SUM(dv.total) AS ventas
      FROM sucursal s
      JOIN venta v ON s.id_sucursal = v.id_sucursal
      JOIN detalle_venta dv ON v.id_venta = dv.id_venta
      ${where}
      GROUP BY s.id_sucursal, s.nombre_sucursal
      ORDER BY ventas DESC
      `
      , params
    );

    // Promedio general de ventas entre sucursales
    const promedioGeneral =
      result.length > 0
        ? result.reduce((acc, s) => acc + Number(s.ventas), 0) / result.length
        : 0;

    res.json({
      code: 1,
      data: {
        sucursales: result,
        promedioGeneral,
      },
      message: "Ventas por sucursal obtenidas correctamente"
    });
  } catch (error) {
    res.status(500).json({ code: 0, message: error.message });
  } finally {
    if (connection) connection.release();
  }
};

export const getNotasPendientes = async (req, res) => {
  const { id_sucursal } = req.query;
  let connection;
  try {
    connection = await getConnection();

    let almacenIds = [];
    if (id_sucursal) {
      const [almacenes] = await connection.query(
        `SELECT a.id_almacen
         FROM almacen a
         INNER JOIN sucursal_almacen sa ON a.id_almacen = sa.id_almacen
         WHERE sa.id_sucursal = ?`,
        [id_sucursal]
      );
      almacenIds = almacenes.map(a => a.id_almacen);
      if (almacenIds.length === 0) {
        return res.json({ code: 1, data: [], message: "No hay almacenes para la sucursal" });
      }
    } else {
      const [almacenes] = await connection.query(
        `SELECT id_almacen FROM almacen WHERE estado_almacen = 1`
      );
      almacenIds = almacenes.map(a => a.id_almacen);
      if (almacenIds.length === 0) {
        return res.json({ code: 1, data: [], message: "No hay almacenes registrados" });
      }
    }

    // 1. Obtener notas de ingreso y salida con sus detalles
const [ingresos] = await connection.query(
  `SELECT n.id_nota, n.fecha, c.num_comprobante AS documento, n.id_almacenO, n.id_almacenD, n.glosa AS concepto,
          dn.id_producto, dn.cantidad, n.hora_creacion, n.id_destinatario, n.estado_espera
   FROM nota n
   INNER JOIN comprobante c ON n.id_comprobante = c.id_comprobante
   INNER JOIN detalle_nota dn ON n.id_nota = dn.id_nota
   WHERE n.id_tiponota = 1
     AND n.id_almacenD IN (?)
     AND n.estado_nota = 0
     AND NOT EXISTS (
       SELECT 1 FROM nota s
       WHERE s.id_tiponota = 2
         AND s.fecha = n.fecha
         AND s.hora_creacion = n.hora_creacion
         AND s.id_almacenO = n.id_almacenO
         AND s.id_almacenD = n.id_almacenD
         AND s.estado_nota = 0
     )
  `,
  [almacenIds]
);

const [salidas] = await connection.query(
  `SELECT n.id_nota, n.fecha, c.num_comprobante AS documento, n.id_almacenO, n.id_almacenD, n.glosa AS concepto,
          dn.id_producto, dn.cantidad, n.hora_creacion, n.id_destinatario, n.estado_espera
   FROM nota n
   INNER JOIN comprobante c ON n.id_comprobante = c.id_comprobante
   INNER JOIN detalle_nota dn ON n.id_nota = dn.id_nota
   WHERE n.id_tiponota = 2
     AND n.id_almacenO IN (?)
     AND n.estado_nota = 0
     AND NOT EXISTS (
       SELECT 1 FROM nota i
       WHERE i.id_tiponota = 1
         AND i.fecha = n.fecha
         AND i.hora_creacion = n.hora_creacion
         AND i.id_almacenO = n.id_almacenO
         AND i.id_almacenD = n.id_almacenD
         AND i.estado_nota = 0
     )
  `,
  [almacenIds]
);


    // Obtener detalles para todos los id_nota involucrados
    const allNotasIds = [
      ...new Set([...ingresos.map(n => n.id_nota), ...salidas.map(n => n.id_nota)])
    ];
    let detallesNotas = [];
    if (allNotasIds.length > 0) {
      const [detalles] = await connection.query(
        `SELECT id_nota, id_producto, cantidad FROM detalle_nota WHERE id_nota IN (?)`,
        [allNotasIds]
      );
      detallesNotas = detalles;
    }

    // Helper para obtener detalles por id_nota
    const getDetalles = (id_nota) =>
      detallesNotas.filter(d => d.id_nota === id_nota);

    // 2. Buscar ingresos sin salida (por producto y cantidad)
    const pendientesIngreso = ingresos.filter(ing =>
      ing.estado_espera === 0 && // <-- Solo estado_espera 0
      (ing.id_almacenO !== null && ing.id_almacenO !== 0) &&
      !salidas.some(sal =>
        sal.id_almacenO === ing.id_almacenO &&
        sal.id_almacenD === ing.id_almacenD &&
        sal.documento === ing.documento &&
        sal.id_producto === ing.id_producto &&
        Number(sal.cantidad) === Number(ing.cantidad)
      )
    );
    // 3. Buscar salidas sin ingreso (por producto y cantidad)
    const pendientesSalida = salidas.filter(sal =>
      sal.estado_espera === 0 && // <-- Solo estado_espera 0
      !ingresos.some(ing =>
        ing.id_almacenO === sal.id_almacenO &&
        ing.id_almacenD === sal.id_almacenD &&
        ing.documento === sal.documento &&
        ing.id_producto === sal.id_producto &&
        Number(ing.cantidad) === Number(sal.cantidad)
      )
    );

    // 4. Unir ambos resultados
    const pendientes = [
      ...pendientesIngreso.map(n => ({
        ...n,
        tipo: "Falta salida",
        detalles: getDetalles(n.id_nota)
      })),
      ...pendientesSalida.map(n => ({
        ...n,
        tipo: "Falta ingreso",
        detalles: getDetalles(n.id_nota)
      })),
    ];

    res.json({ code: 1, data: pendientes, message: "Notas pendientes obtenidas correctamente" });
  } catch (error) {
    res.status(500).json({ code: 0, message: error.message });
  } finally {
    if (connection) connection.release();
  }
};

export const actualizarEstadoEspera = async (req, res) => {
  const { num_comprobante } = req.body;
  if (!num_comprobante) {
    return res.status(400).json({ code: 0, message: "Falta el num_comprobante" });
  }
  let connection;
  try {
    connection = await getConnection();
    await connection.query(
      "UPDATE nota n INNER JOIN comprobante c ON n.id_comprobante = c.id_comprobante SET n.estado_espera = 1 WHERE c.num_comprobante = ?",
      [num_comprobante]
    );
    res.json({ code: 1, message: "estado_espera actualizado correctamente" });
  } catch (error) {
    res.status(500).json({ code: 0, message: error.message });
  } finally {
    if (connection) connection.release();
  }
};

export const methods = {
  getProductoMasVendido,
  getTotalVentas,
  getSucursalInicio,
  getTotalProductosVendidos,
  getComparacionVentasPorRango,
  getUsuarioRol,
  getUserRolController,
  getVentasPorSucursalPeriodo,
  getNotasPendientes,
  actualizarEstadoEspera
};