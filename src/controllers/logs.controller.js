import { getConnection } from "../database/database.js";

export const addLog = async ({ id_usuario, accion, id_modulo, id_submodulo = null, recurso = null, descripcion = null, ip, id_tenant }) => {
  let connection;
  try {
    connection = await getConnection();
    const log = {
      id_tenant,
      id_usuario,
      id_modulo,
      id_submodulo,
      accion,
      recurso,
      descripcion,
      ip,
      fecha: new Date()
    };
    await connection.query("INSERT INTO log_sistema SET ?", log);
  } catch (e) {
    // silencioso
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Limpia logs antiguos para mantener la base de datos optimizada
 * Por defecto elimina logs de más de 90 días, excepto logs críticos que se mantienen por 180 días
 */
export const cleanOldLogs = async (daysToKeep = 90, criticalDaysToKeep = 180) => {
  let connection;
  try {
    connection = await getConnection();

    // Logs críticos que se mantienen más tiempo
    const criticalActions = [
      'LOGIN_FAIL',
      'USUARIO_BLOQUEAR',
      'USUARIO_DESBLOQUEAR',
      'VENTA_ANULAR',
      'SUNAT_RECHAZADA',
      'NOTA_ANULAR',
      'GUIA_ANULAR'
    ];

    // Eliminar logs no críticos antiguos
    const normalCutoffDate = new Date();
    normalCutoffDate.setDate(normalCutoffDate.getDate() - daysToKeep);

    const [normalResult] = await connection.query(
      `DELETE FROM log_sistema 
       WHERE fecha < ? 
       AND accion NOT IN (${criticalActions.map(() => '?').join(',')})`,
      [normalCutoffDate, ...criticalActions]
    );

    // Eliminar logs críticos muy antiguos
    const criticalCutoffDate = new Date();
    criticalCutoffDate.setDate(criticalCutoffDate.getDate() - criticalDaysToKeep);

    const [criticalResult] = await connection.query(
      `DELETE FROM log_sistema 
       WHERE fecha < ? 
       AND accion IN (${criticalActions.map(() => '?').join(',')})`,
      [criticalCutoffDate, ...criticalActions]
    );

    const totalDeleted = normalResult.affectedRows + criticalResult.affectedRows;

    if (totalDeleted > 0) {
      console.log(`🗑️  Logs limpiados: ${normalResult.affectedRows} normales, ${criticalResult.affectedRows} críticos. Total: ${totalDeleted}`);
    }

    return {
      normalDeleted: normalResult.affectedRows,
      criticalDeleted: criticalResult.affectedRows,
      totalDeleted
    };

  } catch (error) {
    console.error('❌ Error limpiando logs antiguos:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Obtiene estadísticas de la tabla de logs
 */
export const getLogStats = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();

    let tenantFilter = "";
    let params = [];

    if (req.id_tenant) {
      tenantFilter = "WHERE id_tenant = ?";
      params.push(req.id_tenant);
    }

    const [stats] = await connection.query(`
      SELECT 
        COUNT(*) as total_logs,
        COUNT(DISTINCT id_usuario) as unique_users,
        COUNT(DISTINCT ip) as unique_ips,
        MIN(fecha) as oldest_log,
        MAX(fecha) as newest_log,
        COUNT(CASE WHEN fecha >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as logs_last_24h,
        COUNT(CASE WHEN fecha >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as logs_last_week,
        COUNT(CASE WHEN accion IN ('LOGIN_OK', 'LOGIN_FAIL', 'LOGOUT') THEN 1 END) as access_logs
      FROM log_sistema 
      ${tenantFilter}
    `, params);

    const [actionStats] = await connection.query(`
      SELECT 
        accion, 
        COUNT(*) as count,
        MAX(fecha) as last_occurrence
      FROM log_sistema 
      ${tenantFilter}
      GROUP BY accion 
      ORDER BY count DESC 
      LIMIT 10
    `, params);

    res.json({
      code: 1,
      data: {
        general: stats[0],
        topActions: actionStats
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de logs:', error);
    res.status(500).json({ code: 0, message: "Error obteniendo estadísticas" });
  } finally {
    if (connection) connection.release();
  }
};

export const getLogs = async (req, res) => {
  let connection;
  try {

    const { from, to, usuario, accion, modulo, page = 1, limit = 25 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const filtros = [];
    const params = [];

    // Agregar filtro por tenant
    if (req.id_tenant) {
      filtros.push("l.id_tenant = ?");
      params.push(req.id_tenant);

    }

    // Filtros de fecha
    if (from) {
      filtros.push("l.fecha >= ?");
      params.push(from + " 00:00:00");
    }
    if (to) {
      filtros.push("l.fecha <= ?");
      params.push(to + " 23:59:59");
    }

    // Filtros por campos específicos
    if (usuario) {
      filtros.push("l.id_usuario = ?");
      params.push(usuario);
    }
    if (accion) {
      filtros.push("l.accion LIKE ?");
      params.push(`%${accion}%`);
    }
    if (modulo) {
      filtros.push("l.id_modulo = ?");
      params.push(modulo);
    }

    const where = filtros.length ? `WHERE ${filtros.join(" AND ")}` : "";



    connection = await getConnection();

    // Query principal con JOINs para obtener nombres de usuario y módulo
    const query = `
      SELECT SQL_CALC_FOUND_ROWS 
        l.id_log,
        l.fecha,
        l.id_usuario,
        u.usua,
        l.id_modulo,
        m.nombre_modulo,
        l.id_submodulo,
        s.nombre_sub,
        l.accion,
        l.recurso,
        l.descripcion,
        l.ip
      FROM log_sistema l
      LEFT JOIN usuario u ON l.id_usuario = u.id_usuario
      LEFT JOIN modulo m ON l.id_modulo = m.id_modulo  
      LEFT JOIN submodulos s ON l.id_submodulo = s.id_submodulo
      ${where}
      ORDER BY l.fecha DESC 
      LIMIT ? OFFSET ?
    `;


    const [rows] = await connection.query(query, [...params, parseInt(limit), offset]);
    const [totalRows] = await connection.query("SELECT FOUND_ROWS() AS total");





    res.json({
      code: 1,
      data: rows,
      total: totalRows[0].total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (e) {
    console.error('❌ Error obteniendo logs:', e);
    res.status(500).json({ code: 0, message: "Error obteniendo logs" });
  } finally {
    if (connection) connection.release();
  }
};

export const getLog = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await getConnection();

    let query = `
      SELECT 
        l.*,
        u.nombre_usuario,
        m.nombre_modulo,
        s.nombre_submodulo
      FROM log_sistema l
      LEFT JOIN usuario u ON l.id_usuario = u.id_usuario
      LEFT JOIN modulo m ON l.id_modulo = m.id_modulo  
      LEFT JOIN submodulos s ON l.id_submodulo = s.id_submodulo
      WHERE l.id_log = ?
    `;

    const params = [id];

    if (req.id_tenant) {
      query += " AND l.id_tenant = ?";
      params.push(req.id_tenant);
    }

    const [rows] = await connection.query(query, params);

    if (!rows.length) {
      return res.status(404).json({ code: 0, message: "Log no encontrado" });
    }

    res.json({ code: 1, data: rows[0] });
  } catch (e) {
    console.error('Error obteniendo log:', e);
    res.status(500).json({ code: 0, message: "Error obteniendo log" });
  } finally {
    if (connection) connection.release();
  }
};

export const methods = { getLogs, getLog, getLogStats, cleanOldLogs };
