// Constantes de acciones para logs del sistema
export const LOG_ACTIONS = {
  // Acceso/Usuarios
  LOGIN_OK: 'LOGIN_OK',
  LOGIN_FAIL: 'LOGIN_FAIL',
  LOGOUT: 'LOGOUT',
  USUARIO_BLOQUEAR: 'USUARIO_BLOQUEAR',
  USUARIO_DESBLOQUEAR: 'USUARIO_DESBLOQUEAR',
  USUARIO_CAMBIAR_CONTRASENA: 'USUARIO_CAMBIAR_CONTRASENA',

  // Ventas/Comprobantes/SUNAT
  VENTA_CREAR: 'VENTA_CREAR',
  VENTA_ANULAR: 'VENTA_ANULAR',
  COMPROBANTE_EMITIR: 'COMPROBANTE_EMITIR',
      SUNAT_ENVIAR: 'SUNAT_ENVIAR',
  SUNAT_ACEPTADA: 'SUNAT_ACEPTADA',
  SUNAT_RECHAZADA: 'SUNAT_RECHAZADA',

  // Inventario/Notas
  NOTA_INGRESO_CREAR: 'NOTA_INGRESO_CREAR',
  NOTA_SALIDA_CREAR: 'NOTA_SALIDA_CREAR',
  NOTA_ANULAR: 'NOTA_ANULAR',

  // Guía de remisión
  GUIA_CREAR: 'GUIA_CREAR',
  GUIA_ANULAR: 'GUIA_ANULAR',

  // Maestros críticos
  CLIENTE_CREAR: 'CLIENTE_CREAR',
  CLIENTE_EDITAR: 'CLIENTE_EDITAR',

  // Productos
  PRODUCTO_CAMBIO_PRECIO: 'PRODUCTO_CAMBIO_PRECIO'
};

// IDs de módulos (ajustar según tu tabla modulo)
export const MODULOS = {
  ACCESO: 1,
  USUARIOS: 2,
  VENTAS: 3,
  COMPROBANTES: 4,
  SUNAT: 5,
  INVENTARIO: 6,
  NOTAS: 7,
  GUIA_REMISION: 8,
  CLIENTES: 9,
  PRODUCTOS: 10
};

import { addLog } from '../controllers/logs.controller.js';

/**
 * SISTEMA DE CONTROL DE LOGS DUPLICADOS
 * ====================================
 * 
 * Este sistema previene la inserción de logs duplicados mediante un cache temporal
 * que considera: acción + usuario + IP + tenant + recurso
 * 
 * CONFIGURACIONES DE TIEMPO POR TIPO DE ACCIÓN:
 * - Acceso (LOGIN/LOGOUT): 2-5 minutos
 * - Comprobantes/SUNAT: 2-3 minutos  
 * - Inventario: 5 minutos
 * - Maestros (clientes/productos): 8-15 minutos
 * 
 * EVENTOS QUE SIEMPRE SE REGISTRAN (forceSave=true):
 * - Ventas y anulaciones
 * - Respuestas de SUNAT
 * - Anulaciones de notas/guías
 * - Cambios administrativos de usuarios
 */

// Cache temporal para evitar logs duplicados (se limpia automáticamente cada hora)
const logCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos por defecto

// Configuraciones específicas de duración del cache por tipo de acción
const ACTION_CACHE_DURATIONS = {
  // Acceso - 5 minutos (usuarios que refrescan página o reconectan)
  [LOG_ACTIONS.LOGIN_OK]: 5 * 60 * 1000,
  [LOG_ACTIONS.LOGIN_FAIL]: 2 * 60 * 1000, // Más corto para intentos fallidos
  [LOG_ACTIONS.LOGOUT]: 3 * 60 * 1000,
  
  // Cambios de usuario - 10 minutos (cambios administrativos)
  [LOG_ACTIONS.USUARIO_CAMBIAR_CONTRASENA]: 10 * 60 * 1000,
  
  // Comprobantes - 3 minutos (operaciones rápidas de facturación)
  [LOG_ACTIONS.COMPROBANTE_EMITIR]: 3 * 60 * 1000,
  [LOG_ACTIONS.SUNAT_ENVIAR]: 2 * 60 * 1000,
  
  // Inventario - 5 minutos (movimientos de stock)
  [LOG_ACTIONS.NOTA_INGRESO_CREAR]: 5 * 60 * 1000,
  [LOG_ACTIONS.NOTA_SALIDA_CREAR]: 5 * 60 * 1000,
  
  // Maestros - 10 minutos (creación/edición de datos maestros)
  [LOG_ACTIONS.CLIENTE_CREAR]: 10 * 60 * 1000,
  [LOG_ACTIONS.CLIENTE_EDITAR]: 8 * 60 * 1000,
  [LOG_ACTIONS.PRODUCTO_CAMBIO_PRECIO]: 15 * 60 * 1000 // Más tiempo para cambios de precio
};

// Acciones que requieren control de duplicados
const ACTIONS_WITH_DUPLICATE_CONTROL = [
  // Acceso y usuarios
  LOG_ACTIONS.LOGIN_OK,
  LOG_ACTIONS.LOGIN_FAIL,
  LOG_ACTIONS.LOGOUT,
  LOG_ACTIONS.USUARIO_CAMBIAR_CONTRASENA,
  
  // Ventas y comprobantes (eventos rápidos que pueden duplicarse)
  LOG_ACTIONS.COMPROBANTE_EMITIR,
  LOG_ACTIONS.SUNAT_ENVIAR,
  
  // Inventario (operaciones que pueden repetirse accidentalmente)
  LOG_ACTIONS.NOTA_INGRESO_CREAR,
  LOG_ACTIONS.NOTA_SALIDA_CREAR,
  
  // Maestros (creación/edición rápida)
  LOG_ACTIONS.CLIENTE_CREAR,
  LOG_ACTIONS.CLIENTE_EDITAR,
  LOG_ACTIONS.PRODUCTO_CAMBIO_PRECIO
];

/**
 * Limpia entradas expiradas del cache
 */
const cleanExpiredCache = () => {
  const now = Date.now();
  for (const [key, data] of logCache.entries()) {
    // Extraer la acción de la clave para obtener su duración específica
    const accion = key.split('_')[0];
    const cacheDuration = ACTION_CACHE_DURATIONS[accion] || CACHE_DURATION;
    
    if (now - data.timestamp > cacheDuration) {
      logCache.delete(key);
    }
  }
};

/**
 * Genera una clave única para el cache basada en los parámetros críticos
 */
const generateCacheKey = (accion, id_usuario, ip, id_tenant, recurso = null) => {
  return `${accion}_${id_usuario || 'null'}_${ip}_${id_tenant}_${recurso || ''}`;
};

/**
 * Verifica si un log es duplicado dentro del período de tiempo especificado
 */
const isDuplicateLog = (accion, id_usuario, ip, id_tenant, recurso = null) => {
  if (!ACTIONS_WITH_DUPLICATE_CONTROL.includes(accion)) {
    return false; // No aplicar control para otras acciones
  }

  cleanExpiredCache(); // Limpiar cache expirado
  
  const cacheKey = generateCacheKey(accion, id_usuario, ip, id_tenant, recurso);
  const now = Date.now();
  
  // Obtener duración específica para esta acción o usar la por defecto
  const cacheDuration = ACTION_CACHE_DURATIONS[accion] || CACHE_DURATION;
  
  if (logCache.has(cacheKey)) {
    const cachedData = logCache.get(cacheKey);
    const timeDiff = now - cachedData.timestamp;
    
    // Si el último registro fue hace menos de la duración específica, es duplicado
    if (timeDiff < cacheDuration) {
      console.log(`⚠️  Log duplicado detectado: ${accion} para usuario ${id_usuario || 'null'} desde IP ${ip}. Tiempo desde último: ${Math.round(timeDiff/1000)}s (límite: ${Math.round(cacheDuration/1000)}s)`);
      return true;
    }
  }
  
  // Registrar en cache
  logCache.set(cacheKey, { timestamp: now });
  return false;
};

/**
 * Helper para registrar logs de manera estandarizada
 * @param {Object} params - Parámetros del log
 * @param {string} params.accion - Acción realizada (usar LOG_ACTIONS)
 * @param {number} params.id_modulo - ID del módulo
 * @param {number} params.id_submodulo - ID del submódulo (opcional)
 * @param {number} params.id_usuario - ID del usuario que realiza la acción
 * @param {string} params.recurso - Recurso afectado (ej: /ventas/123, cliente_id:456)
 * @param {string} params.descripcion - Descripción detallada de la acción
 * @param {string} params.ip - Dirección IP del usuario
 * @param {number} params.id_tenant - ID del tenant
 * @param {boolean} params.forceSave - Forzar guardado sin verificar duplicados (opcional)
 */
export const registrarLog = async ({
  accion,
  id_modulo,
  id_submodulo = null,
  id_usuario,
  recurso = null,
  descripcion = null,
  ip,
  id_tenant,
  forceSave = false
}) => {
  try {
    // Verificar duplicados solo si no se fuerza el guardado
    if (!forceSave && isDuplicateLog(accion, id_usuario, ip, id_tenant, recurso)) {
      console.log(`🚫 Log duplicado omitido: ${accion}`);
      return; // No registrar log duplicado
    }

    await addLog({
      accion,
      id_modulo,
      id_submodulo,
      id_usuario,
      recurso,
      descripcion,
      ip,
      id_tenant
    });
    
    console.log(`✅ Log registrado: ${accion} para usuario ${id_usuario || 'system'}`);
  } catch (error) {
    console.error('Error registrando log:', error);
    // No lanzar error para no afectar el flujo principal
  }
};

// Limpiar cache cada hora
setInterval(cleanExpiredCache, 60 * 60 * 1000);

/**
 * Helpers específicos por categoría
 */

// Logs de acceso y usuarios
export const logAcceso = {
  loginOk: (id_usuario, ip, id_tenant) => registrarLog({
    accion: LOG_ACTIONS.LOGIN_OK,
    id_modulo: MODULOS.ACCESO,
    id_usuario,
    descripcion: 'Usuario autenticado correctamente',
    ip,
    id_tenant
  }),

  loginFail: (usuario, ip, id_tenant, motivo = 'Credenciales incorrectas') => {
    // Para intentos fallidos, usar el nombre de usuario como parte del recurso para mejor control
    return registrarLog({
      accion: LOG_ACTIONS.LOGIN_FAIL,
      id_modulo: MODULOS.ACCESO,
      id_usuario: null,
      recurso: `usuario:${usuario}`,
      descripcion: motivo,
      ip,
      id_tenant
    });
  },

  logout: (id_usuario, ip, id_tenant) => registrarLog({
    accion: LOG_ACTIONS.LOGOUT,
    id_modulo: MODULOS.ACCESO,
    id_usuario,
    descripcion: 'Usuario cerró sesión',
    ip,
    id_tenant
  }),

  bloquearUsuario: (id_usuario_bloqueado, id_usuario_admin, ip, id_tenant) => registrarLog({
    accion: LOG_ACTIONS.USUARIO_BLOQUEAR,
    id_modulo: MODULOS.USUARIOS,
    id_usuario: id_usuario_admin,
    recurso: `usuario_id:${id_usuario_bloqueado}`,
    descripcion: `Usuario ${id_usuario_bloqueado} bloqueado`,
    ip,
    id_tenant,
    forceSave: true // Siempre registrar cambios administrativos
  }),

  desbloquearUsuario: (id_usuario_desbloqueado, id_usuario_admin, ip, id_tenant) => registrarLog({
    accion: LOG_ACTIONS.USUARIO_DESBLOQUEAR,
    id_modulo: MODULOS.USUARIOS,
    id_usuario: id_usuario_admin,
    recurso: `usuario_id:${id_usuario_desbloqueado}`,
    descripcion: `Usuario ${id_usuario_desbloqueado} desbloqueado`,
    ip,
    id_tenant,
    forceSave: true // Siempre registrar cambios administrativos
  }),

  cambiarContrasena: (id_usuario, ip, id_tenant, esAdministrador = false) => registrarLog({
    accion: LOG_ACTIONS.USUARIO_CAMBIAR_CONTRASENA,
    id_modulo: MODULOS.USUARIOS,
    id_usuario,
    recurso: `usuario_id:${id_usuario}`,
    descripcion: esAdministrador ? 'Contraseña cambiada por administrador' : 'Contraseña cambiada por el usuario',
    ip,
    id_tenant,
    forceSave: true // Siempre registrar cambios de contraseña
  })
};

// Logs de ventas
export const logVentas = {
  crear: (id_venta, id_usuario, ip, id_tenant, monto) => registrarLog({
    accion: LOG_ACTIONS.VENTA_CREAR,
    id_modulo: MODULOS.VENTAS,
    id_usuario,
    recurso: `venta_id:${id_venta}`,
    descripcion: `Venta creada por S/ ${monto}`,
    ip,
    id_tenant,
    forceSave: true // Las ventas siempre se registran
  }),

  anular: (id_venta, id_usuario, ip, id_tenant, motivo) => registrarLog({
    accion: LOG_ACTIONS.VENTA_ANULAR,
    id_modulo: MODULOS.VENTAS,
    id_usuario,
    recurso: `venta_id:${id_venta}`,
    descripcion: `Venta anulada. Motivo: ${motivo}`,
    ip,
    id_tenant,
    forceSave: true // Las anulaciones siempre se registran
  })
};

// Logs de comprobantes
export const logComprobantes = {
  emitir: (id_comprobante, id_usuario, ip, id_tenant, tipo_comprobante) => registrarLog({
    accion: LOG_ACTIONS.COMPROBANTE_EMITIR,
    id_modulo: MODULOS.COMPROBANTES,
    id_usuario,
    recurso: `comprobante_id:${id_comprobante}`,
    descripcion: `${tipo_comprobante} emitido`,
    ip,
    id_tenant
    // Aplica control de duplicados automáticamente
  })
};

// Logs de SUNAT
export const logSunat = {
  enviar: (id_venta, id_usuario, ip, id_tenant) => registrarLog({
    accion: LOG_ACTIONS.SUNAT_ENVIAR,
    id_modulo: MODULOS.SUNAT,
    id_usuario,
    recurso: `venta_id:${id_venta}`,
    descripcion: 'Comprobante enviado a SUNAT',
    ip,
    id_tenant
    // Aplica control de duplicados automáticamente
  }),

  aceptada: (id_venta, id_usuario, ip, id_tenant, cdr) => registrarLog({
    accion: LOG_ACTIONS.SUNAT_ACEPTADA,
    id_modulo: MODULOS.SUNAT,
    id_usuario,
    recurso: `venta_id:${id_venta}`,
    descripcion: `SUNAT aceptó el comprobante. CDR: ${cdr}`,
    ip,
    id_tenant,
    forceSave: true // Las respuestas de SUNAT siempre se registran
  }),

  rechazada: (id_venta, id_usuario, ip, id_tenant, error) => registrarLog({
    accion: LOG_ACTIONS.SUNAT_RECHAZADA,
    id_modulo: MODULOS.SUNAT,
    id_usuario,
    recurso: `venta_id:${id_venta}`,
    descripcion: `SUNAT rechazó el comprobante. Error: ${error}`,
    ip,
    id_tenant,
    forceSave: true // Los rechazos siempre se registran
  })
};

// Logs de inventario
export const logInventario = {
  notaIngreso: (id_nota, id_usuario, ip, id_tenant) => registrarLog({
    accion: LOG_ACTIONS.NOTA_INGRESO_CREAR,
    id_modulo: MODULOS.NOTAS,
    id_usuario,
    recurso: `nota_ingreso_id:${id_nota}`,
    descripcion: 'Nota de ingreso creada',
    ip,
    id_tenant
    // Aplica control de duplicados automáticamente
  }),

  notaSalida: (id_nota, id_usuario, ip, id_tenant) => registrarLog({
    accion: LOG_ACTIONS.NOTA_SALIDA_CREAR,
    id_modulo: MODULOS.NOTAS,
    id_usuario,
    recurso: `nota_salida_id:${id_nota}`,
    descripcion: 'Nota de salida creada',
    ip,
    id_tenant
    // Aplica control de duplicados automáticamente
  }),

  anularNota: (id_nota, tipo, id_usuario, ip, id_tenant) => registrarLog({
    accion: LOG_ACTIONS.NOTA_ANULAR,
    id_modulo: MODULOS.NOTAS,
    id_usuario,
    recurso: `nota_${tipo}_id:${id_nota}`,
    descripcion: `Nota de ${tipo} anulada`,
    ip,
    id_tenant,
    forceSave: true // Las anulaciones siempre se registran
  })
};

// Logs de guías de remisión
export const logGuias = {
  crear: (id_guia, id_usuario, ip, id_tenant) => registrarLog({
    accion: LOG_ACTIONS.GUIA_CREAR,
    id_modulo: MODULOS.GUIA_REMISION,
    id_usuario,
    recurso: `guia_id:${id_guia}`,
    descripcion: 'Guía de remisión creada',
    ip,
    id_tenant,
    forceSave: true // Las guías siempre se registran
  }),

  anular: (id_guia, id_usuario, ip, id_tenant) => registrarLog({
    accion: LOG_ACTIONS.GUIA_ANULAR,
    id_modulo: MODULOS.GUIA_REMISION,
    id_usuario,
    recurso: `guia_id:${id_guia}`,
    descripcion: 'Guía de remisión anulada',
    ip,
    id_tenant,
    forceSave: true // Las anulaciones siempre se registran
  })
};

// Logs de clientes
export const logClientes = {
  crear: (id_cliente, id_usuario, ip, id_tenant) => registrarLog({
    accion: LOG_ACTIONS.CLIENTE_CREAR,
    id_modulo: MODULOS.CLIENTES,
    id_usuario,
    recurso: `cliente_id:${id_cliente}`,
    descripcion: 'Cliente creado',
    ip,
    id_tenant
    // Aplica control de duplicados automáticamente
  }),

  editar: (id_cliente, id_usuario, ip, id_tenant, cambios) => registrarLog({
    accion: LOG_ACTIONS.CLIENTE_EDITAR,
    id_modulo: MODULOS.CLIENTES,
    id_usuario,
    recurso: `cliente_id:${id_cliente}`,
    descripcion: `Cliente editado. Cambios: ${cambios}`,
    ip,
    id_tenant
    // Aplica control de duplicados automáticamente
  })
};

// Logs de productos
export const logProductos = {
  cambioPrecio: (id_producto, id_usuario, ip, id_tenant, precio_anterior, precio_nuevo) => registrarLog({
    accion: LOG_ACTIONS.PRODUCTO_CAMBIO_PRECIO,
    id_modulo: MODULOS.PRODUCTOS,
    id_usuario,
    recurso: `producto_id:${id_producto}`,
    descripcion: `Precio cambiado de S/ ${precio_anterior} a S/ ${precio_nuevo}`,
    ip,
    id_tenant
    // Aplica control de duplicados automáticamente (15 minutos)
  })
};
