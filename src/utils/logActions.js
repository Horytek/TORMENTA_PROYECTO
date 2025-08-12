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
 */
export const registrarLog = async ({
  accion,
  id_modulo,
  id_submodulo = null,
  id_usuario,
  recurso = null,
  descripcion = null,
  ip,
  id_tenant
}) => {
  try {
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
  } catch (error) {
    console.error('Error registrando log:', error);
    // No lanzar error para no afectar el flujo principal
  }
};

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

  loginFail: (usuario, ip, id_tenant, motivo = 'Credenciales incorrectas') => registrarLog({
    accion: LOG_ACTIONS.LOGIN_FAIL,
    id_modulo: MODULOS.ACCESO,
    id_usuario: null,
    recurso: `usuario:${usuario}`,
    descripcion: motivo,
    ip,
    id_tenant
  }),

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
    id_tenant
  }),

  desbloquearUsuario: (id_usuario_desbloqueado, id_usuario_admin, ip, id_tenant) => registrarLog({
    accion: LOG_ACTIONS.USUARIO_DESBLOQUEAR,
    id_modulo: MODULOS.USUARIOS,
    id_usuario: id_usuario_admin,
    recurso: `usuario_id:${id_usuario_desbloqueado}`,
    descripcion: `Usuario ${id_usuario_desbloqueado} desbloqueado`,
    ip,
    id_tenant
  }),

  cambiarContrasena: (id_usuario, ip, id_tenant, esAdministrador = false) => registrarLog({
    accion: LOG_ACTIONS.USUARIO_CAMBIAR_CONTRASENA,
    id_modulo: MODULOS.USUARIOS,
    id_usuario,
    recurso: `usuario_id:${id_usuario}`,
    descripcion: esAdministrador ? 'Contraseña cambiada por administrador' : 'Contraseña cambiada por el usuario',
    ip,
    id_tenant
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
    id_tenant
  }),

  anular: (id_venta, id_usuario, ip, id_tenant, motivo) => registrarLog({
    accion: LOG_ACTIONS.VENTA_ANULAR,
    id_modulo: MODULOS.VENTAS,
    id_usuario,
    recurso: `venta_id:${id_venta}`,
    descripcion: `Venta anulada. Motivo: ${motivo}`,
    ip,
    id_tenant
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
  }),

  aceptada: (id_venta, id_usuario, ip, id_tenant, cdr) => registrarLog({
    accion: LOG_ACTIONS.SUNAT_ACEPTADA,
    id_modulo: MODULOS.SUNAT,
    id_usuario,
    recurso: `venta_id:${id_venta}`,
    descripcion: `SUNAT aceptó el comprobante. CDR: ${cdr}`,
    ip,
    id_tenant
  }),

  rechazada: (id_venta, id_usuario, ip, id_tenant, error) => registrarLog({
    accion: LOG_ACTIONS.SUNAT_RECHAZADA,
    id_modulo: MODULOS.SUNAT,
    id_usuario,
    recurso: `venta_id:${id_venta}`,
    descripcion: `SUNAT rechazó el comprobante. Error: ${error}`,
    ip,
    id_tenant
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
  }),

  notaSalida: (id_nota, id_usuario, ip, id_tenant) => registrarLog({
    accion: LOG_ACTIONS.NOTA_SALIDA_CREAR,
    id_modulo: MODULOS.NOTAS,
    id_usuario,
    recurso: `nota_salida_id:${id_nota}`,
    descripcion: 'Nota de salida creada',
    ip,
    id_tenant
  }),

  anularNota: (id_nota, tipo, id_usuario, ip, id_tenant) => registrarLog({
    accion: LOG_ACTIONS.NOTA_ANULAR,
    id_modulo: MODULOS.NOTAS,
    id_usuario,
    recurso: `nota_${tipo}_id:${id_nota}`,
    descripcion: `Nota de ${tipo} anulada`,
    ip,
    id_tenant
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
    id_tenant
  }),

  anular: (id_guia, id_usuario, ip, id_tenant) => registrarLog({
    accion: LOG_ACTIONS.GUIA_ANULAR,
    id_modulo: MODULOS.GUIA_REMISION,
    id_usuario,
    recurso: `guia_id:${id_guia}`,
    descripcion: 'Guía de remisión anulada',
    ip,
    id_tenant
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
  }),

  editar: (id_cliente, id_usuario, ip, id_tenant, cambios) => registrarLog({
    accion: LOG_ACTIONS.CLIENTE_EDITAR,
    id_modulo: MODULOS.CLIENTES,
    id_usuario,
    recurso: `cliente_id:${id_cliente}`,
    descripcion: `Cliente editado. Cambios: ${cambios}`,
    ip,
    id_tenant
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
  })
};
