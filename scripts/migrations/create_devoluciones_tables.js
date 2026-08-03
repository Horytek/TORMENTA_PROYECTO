import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * Módulo de Devoluciones.
 *
 * El frontend (client-v2/src/features/returns/) ya trae el contrato completo
 * (wizard de 5 pasos, motor de reglas puro, panel de detalle) pero cero
 * backend: el enlace del sidebar apuntaba a una pantalla sin datos.
 *
 * Tablas nuevas:
 *   1. `devolucion` — cabecera (venta origen, estado, resolución, total).
 *   2. `devolucion_detalle` — líneas devueltas, fotografiando id_sku/talla/
 *      tonalidad de `detalle_venta` en el momento de la devolución (igual
 *      criterio que `detalle_venta.costo_unitario`: es una foto, no una
 *      referencia, porque la venta original no cambia después).
 *   3. `devolucion_historial` — auditoría de cambios de estado.
 *
 * Reintegro de stock: NO ocurre al crear la devolución (es solo una
 * solicitud). Ocurre cuando el controlador transiciona el estado a
 * `completada` — recién ahí el producto físicamente volvió — y solo para
 * las líneas cuyo `destino` sea `stock_disponible`.
 *
 * Registra el módulo "Devoluciones" y otorga al rol Administrador (id_rol=1)
 * las acciones estándar más las dinámicas que ya usa el frontend
 * (aprobar/rechazar/reembolsar/cancelar/auditoria vía `actions_json`).
 *
 * Uso: npm run db:migrate:devoluciones
 */

const HOSTS_LOCALES = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"]);
const esHostLocal = (host) => HOSTS_LOCALES.has(String(host).trim().toLowerCase());

const existeTabla = async (cx, tabla) => {
  const [filas] = await cx.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [DATABASE, tabla]
  );
  return filas.length > 0;
};

const crearDevolucion = async (cx) => {
  const yaExistia = await existeTabla(cx, "devolucion");
  await cx.query(`
    CREATE TABLE IF NOT EXISTS devolucion (
      id_devolucion INT NOT NULL AUTO_INCREMENT,
      id_tenant INT NOT NULL,
      codigo VARCHAR(20) NOT NULL COMMENT 'Ej. DEV-000012',
      id_venta INT NOT NULL,
      id_sucursal INT NULL,
      canal ENUM('tienda','ecommerce','movil','delivery','otro') NOT NULL DEFAULT 'tienda',
      estado ENUM('borrador','pendiente_revision','pendiente_aprobacion','aprobada','rechazada','procesando_reembolso','completada','cancelada','cerrada') NOT NULL DEFAULT 'pendiente_revision',
      resolucion ENUM('reembolso_original','reembolso_efectivo','nota_credito','saldo_favor','cambio_producto','reposicion','reembolso_parcial','rechazo') NOT NULL,
      total DECIMAL(12,2) NOT NULL DEFAULT 0,
      diferencia_cambio DECIMAL(12,2) NULL,
      metodo_reembolso VARCHAR(40) NULL COMMENT 'Registro interno del método usado al completar; NO emite documento SUNAT',
      observaciones TEXT NULL,
      evidencias JSON NULL COMMENT 'Array de URLs de fotos/documentos adjuntos',
      id_usuario_crea INT NULL,
      id_usuario_aprueba INT NULL,
      fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id_devolucion),
      UNIQUE KEY uk_devolucion_codigo (id_tenant, codigo),
      KEY idx_devolucion_tenant_estado (id_tenant, estado),
      KEY idx_devolucion_venta (id_venta)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  console.log(yaExistia ? "[omitido] devolucion ya existía." : "[creado] devolucion.");
};

const crearDevolucionDetalle = async (cx) => {
  const yaExistia = await existeTabla(cx, "devolucion_detalle");
  await cx.query(`
    CREATE TABLE IF NOT EXISTS devolucion_detalle (
      id_devolucion_detalle INT NOT NULL AUTO_INCREMENT,
      id_devolucion INT NOT NULL,
      id_detalle_venta INT NOT NULL COMMENT 'detalle_venta.id_detalle de la línea original',
      id_producto INT NOT NULL,
      id_sku INT NULL,
      id_tonalidad INT NULL,
      id_talla INT NULL,
      cantidad DECIMAL(12,2) NOT NULL,
      precio_unitario DECIMAL(12,2) NOT NULL,
      descuento DECIMAL(12,2) NOT NULL DEFAULT 0,
      importe DECIMAL(12,2) NOT NULL,
      motivo ENUM('producto_defectuoso','talla_incorrecta','color_incorrecto','producto_equivocado','dano_transporte','insatisfaccion','error_despacho','producto_incompleto','otro') NOT NULL,
      motivo_detalle VARCHAR(255) NULL,
      condicion ENUM('nuevo','abierto','usado','danado','incompleto') NOT NULL,
      destino ENUM('stock_disponible','revision','danados','cuarentena','reparacion','merma','devolucion_proveedor','baja_definitiva') NOT NULL,
      producto_cambio JSON NULL COMMENT 'Solo cuando la resolución de la devolución es cambio_producto',
      id_tenant INT NOT NULL,
      PRIMARY KEY (id_devolucion_detalle),
      KEY idx_dd_devolucion (id_devolucion),
      KEY idx_dd_detalle_venta (id_detalle_venta),
      KEY idx_dd_tenant (id_tenant)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  console.log(yaExistia ? "[omitido] devolucion_detalle ya existía." : "[creado] devolucion_detalle.");
};

const crearDevolucionHistorial = async (cx) => {
  const yaExistia = await existeTabla(cx, "devolucion_historial");
  await cx.query(`
    CREATE TABLE IF NOT EXISTS devolucion_historial (
      id_historial INT NOT NULL AUTO_INCREMENT,
      id_devolucion INT NOT NULL,
      id_tenant INT NOT NULL,
      estado_anterior VARCHAR(30) NULL,
      estado_nuevo VARCHAR(30) NOT NULL,
      nota TEXT NULL,
      id_usuario INT NULL,
      fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id_historial),
      KEY idx_dh_devolucion (id_devolucion),
      KEY idx_dh_tenant (id_tenant)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  console.log(yaExistia ? "[omitido] devolucion_historial ya existía." : "[creado] devolucion_historial.");
};

// ── Módulo y permisos ───────────────────────────────────────────────────────
// active_actions: mismo criterio que Compras — "desactivar" no aplica acá.
const ACTIVE_ACTIONS_JSON = '["ver","crear","editar","eliminar","generar"]';
// actions_json dinámico: los verbos que config/collection.tsx ya usa como
// `capability` en cada acción de fila (aprobar/rechazar/reembolsar/cancelar/
// auditoria) y que no tienen columna propia en `permisos`.
const DYNAMIC_ACTIONS_JSON = JSON.stringify({
  aprobar: 1, rechazar: 1, reembolsar: 1, cancelar: 1, auditoria: 1,
});

const registrarModuloYPermisos = async (cx) => {
  let [[modulo]] = await cx.query("SELECT id_modulo FROM modulo WHERE ruta = '/devoluciones' LIMIT 1");
  let id_modulo;
  if (modulo) {
    id_modulo = modulo.id_modulo;
    console.log(`[omitido] modulo 'Devoluciones' ya existía (id=${id_modulo}).`);
  } else {
    const [result] = await cx.query(
      `INSERT INTO modulo (nombre_modulo, ruta, icon, group_name, sort_order, frontend_route, is_visible, active_actions)
       VALUES ('Devoluciones', '/devoluciones', 'RotateCcw', 'General', 40, '/sales/returns', 1, ?)`,
      [ACTIVE_ACTIONS_JSON]
    );
    id_modulo = result.insertId;
    console.log(`[creado] modulo 'Devoluciones' (id=${id_modulo}).`);
  }

  const [tenants] = await cx.query("SELECT DISTINCT id_tenant FROM usuario WHERE id_rol = 1 AND id_tenant IS NOT NULL");

  let filasPermiso = 0;
  for (const { id_tenant } of tenants) {
    const [result] = await cx.query(
      `INSERT INTO permisos (id_rol, id_modulo, id_submodulo, crear, ver, editar, eliminar, desactivar, generar, actions_json, id_tenant, id_plan)
       VALUES (1, ?, NULL, 1, 1, 1, 1, 0, 1, ?, ?, NULL)
       ON DUPLICATE KEY UPDATE crear = 1, ver = 1, editar = 1, eliminar = 1, generar = 1, actions_json = ?`,
      [id_modulo, DYNAMIC_ACTIONS_JSON, id_tenant, DYNAMIC_ACTIONS_JSON]
    );
    filasPermiso += result.affectedRows;
  }
  console.log(`[permisos] Administrador con acceso completo en ${tenants.length} tenant(s).`);
};

const ejecutar = async () => {
  if (!HOST || !DATABASE || !USER) {
    throw new Error("Falta configurar la conexión MySQL local en el archivo .env.");
  }
  if (!esHostLocal(HOST) && !process.env.ALLOW_REMOTE_MIGRATE) {
    throw new Error("Migración cancelada: esta versión solo está autorizada para MySQL local (o establece ALLOW_REMOTE_MIGRATE=1).");
  }

  const cx = await mysql.createConnection({
    host: HOST, database: DATABASE, user: USER, password: PASSWORD, port: PORT_DB, connectTimeout: 5000,
  });

  try {
    await crearDevolucion(cx);
    await crearDevolucionDetalle(cx);
    await crearDevolucionHistorial(cx);
    await registrarModuloYPermisos(cx);
  } finally {
    await cx.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:migrate:devoluciones] ${error.message}`);
  process.exitCode = 1;
});
