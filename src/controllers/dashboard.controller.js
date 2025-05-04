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
              s.nombre_sucursal AS nombre
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
    let { tiempo, usuario: usuarioQuery, rol, sucursal } = req.query;
    if (!tiempo) return res.status(400).json({ message: "Falta filtro de tiempo" });
    if (!usuarioQuery) return res.status(400).json({ message: "Falta el campo usuario" });

    // Si no se envía rol, se intenta obtenerlo de la BD
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
    // Si el rol es ADMIN (sin importar mayúsculas o minúsculas), se consulta sin filtro de sucursal
    if (rol.toLowerCase() === "administrador") {
      query = `
        SELECT SUM(dv.total) AS total_dinero_ventas
        FROM detalle_venta dv
        JOIN venta v ON dv.id_venta = v.id_venta
        WHERE v.f_venta BETWEEN ? AND ? AND v.estado_venta != 0
      `;
      params = [fechaInicioISO, fechaFinISO];
      if(sucursal) {
        query += " AND v.id_sucursal = ?";
        params.push(sucursal);
      }
    } else {
      const id_sucursal = await getSucursalIdForUser(usuarioQuery, connection);
      query = `
        SELECT SUM(dv.total) AS total_dinero_ventas
        FROM detalle_venta dv
        JOIN venta v ON dv.id_venta = v.id_venta
        WHERE v.f_venta BETWEEN ? AND ? AND v.estado_venta != 0 AND v.id_sucursal = ?
      `;
      params = [fechaInicioISO, fechaFinISO, id_sucursal];
    }
    const [result] = await connection.query(query, params);
    const totalVentas = result[0].total_dinero_ventas || 0;
    res.json({ code: 1, data: totalVentas, message: "Total de ventas obtenido correctamente" });
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
    if (rol.toLowerCase() === "administrador") {
      query = `
        SELECT SUM(dv.cantidad) AS total_productos_vendidos
        FROM detalle_venta dv
        JOIN venta v ON dv.id_venta = v.id_venta
        WHERE v.f_venta BETWEEN ? AND ? AND v.estado_venta != 0
      `;
      params = [fechaInicioISO, fechaFinISO];
      if(sucursal) {
        query += " AND v.id_sucursal = ?";
        params.push(sucursal);
      }
    } else {
      const id_sucursal = await getSucursalIdForUser(usuarioQuery, connection);
      query = `
        SELECT SUM(dv.cantidad) AS total_productos_vendidos
        FROM detalle_venta dv
        JOIN venta v ON dv.id_venta = v.id_venta
        WHERE v.f_venta BETWEEN ? AND ? AND v.estado_venta != 0 AND v.id_sucursal = ?
      `;
      params = [fechaInicioISO, fechaFinISO, id_sucursal];
    }
    const [result] = await connection.query(query, params);
    const totalProductosVendidos = result[0].total_productos_vendidos || 0;
    res.json({ code: 1, totalProductosVendidos, message: "Total de productos vendidos obtenido correctamente" });
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


export const methods = {
  getProductoMasVendido,
  getTotalVentas,
  getSucursalInicio,
  getTotalProductosVendidos,
  getComparacionVentasPorRango,
  getUsuarioRol,
  getUserRolController,
};