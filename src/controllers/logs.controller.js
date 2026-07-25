import { LogsRepository } from "../repositories/LogsRepository.js";

const logsRepo = new LogsRepository();

export const addLog = async ({ id_usuario, accion, id_modulo, id_submodulo = null, recurso = null, descripcion = null, ip, id_tenant }) => {
  try {
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
    await logsRepo.create(log);
  } catch (e) {
    // silencioso
  }
};

/**
 * Limpia logs antiguos para mantener la base de datos optimizada
 * Por defecto elimina logs de más de 90 días, excepto logs críticos que se mantienen por 180 días
 */
export const cleanOldLogs = async ({ daysToKeep = 90, criticalDaysToKeep = 180 } = {}) => {
  try {
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

    const normalResult = await logsRepo.deleteOldLogs(normalCutoffDate, criticalActions, true);

    // Eliminar logs críticos muy antiguos
    const criticalCutoffDate = new Date();
    criticalCutoffDate.setDate(criticalCutoffDate.getDate() - criticalDaysToKeep);

    const criticalResult = await logsRepo.deleteOldLogs(criticalCutoffDate, criticalActions, false);

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
  }
};

/**
 * Obtiene estadísticas de la tabla de logs
 */
export const getLogStats = async (req, res) => {
  try {
    const id_tenant = req.id_tenant;

    const stats = await logsRepo.getStats(id_tenant);
    const actionStats = await logsRepo.getActionStats(id_tenant);

    res.json({
      code: 1,
      data: {
        general: stats,
        topActions: actionStats
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de logs:', error);
    res.status(500).json({ code: 0, message: "Error obteniendo estadísticas" });
  }
};

export const getLogs = async (req, res) => {
  try {
    const { from, to, usuario, accion, modulo, page = 1, limit = 25 } = req.query;
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 200);
    const offset = (pageNumber - 1) * limitNumber;
    const id_tenant = req.id_tenant;

    const { rows, total } = await logsRepo.findAllWithCount({
      from, to, usuario, accion, modulo, id_tenant, limit: limitNumber, offset
    });

    res.json({
      code: 1,
      data: rows,
      total: total,
      page: pageNumber,
      limit: limitNumber
    });
  } catch (e) {
    console.error('❌ Error obteniendo logs:', e);
    res.status(500).json({ code: 0, message: "Error obteniendo logs" });
  }
};

export const getLog = async (req, res) => {
  try {
    const { id } = req.params;
    const id_tenant = req.id_tenant;

    const log = await logsRepo.findById(id, id_tenant);

    if (!log) {
      return res.status(404).json({ code: 0, message: "Log no encontrado" });
    }

    res.json({ code: 1, data: log });
  } catch (e) {
    console.error('Error obteniendo log:', e);
    res.status(500).json({ code: 0, message: "Error obteniendo log" });
  }
};

export const methods = { getLogs, getLog, getLogStats, cleanOldLogs };
