import { registrarLog } from '../utils/logActions.js';

/**
 * Obtiene la IP del cliente considerando proxies
 * @param {Object} req - Objeto de solicitud Express
 * @returns {string|null} IP del cliente
 */
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.connection?.socket?.remoteAddress ||
    null;
};

/**
 * Middleware para agregar funcionalidad de logging a las rutas
 * Inyecta req.log() que puede ser usado en cualquier controlador
 */
export const logMiddleware = (req, res, next) => {
  // Capturar IP al inicio de la petición
  const ip = getClientIp(req);

  /**
   * Función inyectada para registrar logs desde controladores
   * @param {string} accion - Código de la acción
   * @param {number} id_modulo - ID del módulo relacionado
   * @param {Object} opciones - Parámetros opcionales (id_usuario, descripcion, etc.)
   */
  req.log = async (accion, id_modulo, opciones = {}) => {
    try {
      // Construir objeto de log una sola vez
      const logData = {
        accion,
        id_modulo,
        id_submodulo: opciones.id_submodulo || null,
        id_usuario: req.id_usuario || opciones.id_usuario || null,
        recurso: opciones.recurso || null,
        descripcion: opciones.descripcion || null,
        ip,
        id_tenant: req.id_tenant || opciones.id_tenant
      };

      // Logging silencioso en consola para desarrollo
      if (process.env.NODE_ENV === 'development') {
        // console.debug(`[AUDIT] ${accion} | User: ${logData.id_usuario} | IP: ${ip}`);
      }

      // Registrar en base de datos
      await registrarLog(logData);

    } catch (error) {
      // Fallback seguro: nunca interrumpir el flujo principal por un error de log
      console.error(`[LOG_ERROR] Falló registro de log para ${accion}:`, error.message);
    }
  };

  // Helper de acceso rápido a IP
  req.getUserIP = () => ip;

  next();
};

/**
 * Decorator/Wrapper para registrar logs automáticamente en métodos de clase
 * @param {string} accion - Acción a registrar
 * @param {number} id_modulo - ID del módulo
 * @param {Object} opciones - Opciones adicionales
 */
export const withLog = (accion, id_modulo, opciones = {}) => {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (req, res, ...args) {
      try {
        // Ejecutar lógica principal
        const result = await originalMethod.call(this, req, res, ...args);

        // Registrar éxito si: existe req.log Y (no se enviaron headers O el status es éxito)
        const isSuccess = !res.headersSent || res.statusCode < 400;

        if (req.log && isSuccess) {
          req.log(accion, id_modulo, {
            ...opciones,
            recurso: opciones.recurso || `${req.method} ${req.path}`,
            descripcion: opciones.descripcion || 'Operación completada exitosamente'
          }).catch(err => console.error('[LOG_AUTO_ERROR]', err));
        }

        return result;
      } catch (error) {
        // Registrar error
        if (req.log) {
          req.log(`${accion}_ERROR`, id_modulo, {
            ...opciones,
            recurso: opciones.recurso || `${req.method} ${req.path}`,
            descripcion: `Error: ${error.message}`
          }).catch(err => console.error('[LOG_AUTO_ERROR]', err));
        }
        // Re-lanzar el error para que sea manejado por el middleware de errores global
        throw error;
      }
    };

    return descriptor;
  };
};

export default logMiddleware;
