import { registrarLog } from '../utils/logActions.js';

/**
 * Middleware para agregar funcionalidad de logging a las rutas
 * Agrega req.log() que puede ser usado en cualquier controlador
 */
export const logMiddleware = (req, res, next) => {
  // Obtener IP una sola vez
  const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
            (req.connection.socket ? req.connection.socket.remoteAddress : null);

  // Agregar función helper al request
  req.log = async (accion, id_modulo, opciones = {}) => {
    try {
      await registrarLog({
        accion,
        id_modulo,
        id_submodulo: opciones.id_submodulo || null,
        id_usuario: req.id_usuario || opciones.id_usuario || null,
        recurso: opciones.recurso || null,
        descripcion: opciones.descripcion || null,
        ip,
        id_tenant: req.id_tenant || opciones.id_tenant
      });
    } catch (error) {
      // Log silencioso - no afectar el flujo principal
      console.error('Error registrando log:', error);
    }
  };

  // Agregar función para obtener IP
  req.getUserIP = () => ip;

  next();
};

/**
 * Decorator para funciones que registran logs automáticamente
 * @param {string} accion - Acción a registrar
 * @param {number} id_modulo - ID del módulo
 * @param {Object} opciones - Opciones adicionales
 */
export const withLog = (accion, id_modulo, opciones = {}) => {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(req, res, ...args) {
      try {
        // Ejecutar el método original
        const result = await originalMethod.call(this, req, res, ...args);
        
        // Registrar log si la operación fue exitosa
        if (req.log && (!res.headersSent || res.statusCode < 400)) {
          await req.log(accion, id_modulo, {
            ...opciones,
            recurso: opciones.recurso || `${req.method} ${req.path}`,
            descripcion: opciones.descripcion || `${accion} ejecutada exitosamente`
          });
        }
        
        return result;
      } catch (error) {
        // En caso de error, registrar el fallo
        if (req.log) {
          await req.log(`${accion}_ERROR`, id_modulo, {
            ...opciones,
            recurso: opciones.recurso || `${req.method} ${req.path}`,
            descripcion: `Error en ${accion}: ${error.message}`
          });
        }
        throw error;
      }
    };
    
    return descriptor;
  };
};

export default logMiddleware;
