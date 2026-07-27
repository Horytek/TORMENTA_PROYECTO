import mysql from "mysql2/promise";
import {
  DATABASE,
  HOST,
  PASSWORD,
  PORT_DB,
  USER,
} from "../../src/config.js";

/**
 * Módulo de Compras (MVP): orden de compra → recepción → factura → cuenta por pagar.
 *
 * Reutiliza lo que ya existe en vez de duplicarlo:
 *   - Proveedor: tabla `destinatario` (ubicacion='proveedor'), ya usada por el
 *     frontend de Proveedores. No se crea tabla `proveedor`.
 *   - Recepción de mercadería: el flujo de `notaingreso.controller.js`
 *     (`nota` + `detalle_nota` + `bitacora_nota` + `inventario`, id_tiponota=1).
 *     Solo se agrega `nota.id_orden_compra` para saber qué OC se recibió.
 *
 * Tablas nuevas:
 *   1. `orden_compra` / `detalle_orden_compra` — el compromiso antes de recibir.
 *   2. `factura_compra` — factura del proveedor (puede o no venir de una OC).
 *   3. `cuenta_por_pagar` / `pago_cuenta_por_pagar` — saldo pendiente y abonos.
 *
 * También registra el módulo "Compras" (modulo/submodulos) y otorga permiso
 * completo al rol Administrador (id_rol=1) en cada tenant existente, para que
 * el módulo sea usable de inmediato sin pasos manuales adicionales.
 *
 * Uso: npm run db:migrate:compras
 */

const HOSTS_LOCALES = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "host.docker.internal",
]);

const esHostLocal = (host) => HOSTS_LOCALES.has(String(host).trim().toLowerCase());

const existeTabla = async (connection, tabla) => {
  const [filas] = await connection.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [DATABASE, tabla]
  );
  return filas.length > 0;
};

const existeColumna = async (connection, tabla, columna) => {
  const [filas] = await connection.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [DATABASE, tabla, columna]
  );
  return filas.length > 0;
};

const crearOrdenCompra = async (connection) => {
  const yaExistia = await existeTabla(connection, "orden_compra");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS orden_compra (
      id_orden_compra INT NOT NULL AUTO_INCREMENT,
      id_tenant INT NOT NULL,
      id_destinatario INT NOT NULL COMMENT 'Proveedor: destinatario.ubicacion=proveedor',
      id_almacen INT NOT NULL COMMENT 'Almacén destino de la recepción',
      fecha DATE NOT NULL,
      glosa VARCHAR(255) NULL,
      observacion TEXT NULL,
      estado ENUM('draft','approved','received','cancelled') NOT NULL DEFAULT 'draft',
      id_usuario_crea INT NULL,
      fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id_orden_compra),
      KEY idx_oc_tenant_estado (id_tenant, estado),
      KEY idx_oc_destinatario (id_destinatario)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  console.log(yaExistia ? "[omitido] orden_compra ya existía." : "[creado] orden_compra.");
};

const crearDetalleOrdenCompra = async (connection) => {
  const yaExistia = await existeTabla(connection, "detalle_orden_compra");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS detalle_orden_compra (
      id_detalle_orden_compra INT NOT NULL AUTO_INCREMENT,
      id_orden_compra INT NOT NULL,
      id_producto INT NOT NULL,
      id_tonalidad INT NULL,
      id_talla INT NULL,
      id_sku INT NULL,
      cantidad DECIMAL(12,2) NOT NULL,
      precio_unitario DECIMAL(12,2) NOT NULL,
      total DECIMAL(12,2) NOT NULL,
      id_tenant INT NOT NULL,
      PRIMARY KEY (id_detalle_orden_compra),
      KEY idx_doc_orden (id_orden_compra),
      KEY idx_doc_tenant (id_tenant)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  console.log(yaExistia ? "[omitido] detalle_orden_compra ya existía." : "[creado] detalle_orden_compra.");
};

const crearFacturaCompra = async (connection) => {
  const yaExistia = await existeTabla(connection, "factura_compra");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS factura_compra (
      id_factura_compra INT NOT NULL AUTO_INCREMENT,
      id_tenant INT NOT NULL,
      id_orden_compra INT NULL COMMENT 'Nula si la factura no viene de una OC registrada',
      id_destinatario INT NOT NULL COMMENT 'Proveedor',
      num_factura VARCHAR(32) NOT NULL COMMENT 'Número de factura del proveedor (no es un comprobante propio)',
      fecha_emision DATE NOT NULL,
      fecha_vencimiento DATE NOT NULL,
      monto_total DECIMAL(12,2) NOT NULL,
      estado ENUM('pendiente','pagada','anulada') NOT NULL DEFAULT 'pendiente',
      id_usuario_crea INT NULL,
      fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id_factura_compra),
      UNIQUE KEY uk_factura_proveedor (id_tenant, id_destinatario, num_factura),
      KEY idx_fc_tenant_estado (id_tenant, estado),
      KEY idx_fc_orden (id_orden_compra)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  console.log(yaExistia ? "[omitido] factura_compra ya existía." : "[creado] factura_compra.");
};

const crearCuentaPorPagar = async (connection) => {
  const yaExistia = await existeTabla(connection, "cuenta_por_pagar");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS cuenta_por_pagar (
      id_cuenta_por_pagar INT NOT NULL AUTO_INCREMENT,
      id_tenant INT NOT NULL,
      id_factura_compra INT NOT NULL,
      monto_total DECIMAL(12,2) NOT NULL,
      saldo DECIMAL(12,2) NOT NULL,
      fecha_vencimiento DATE NOT NULL,
      estado ENUM('pendiente','pagada_parcial','pagada','vencida') NOT NULL DEFAULT 'pendiente',
      fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id_cuenta_por_pagar),
      UNIQUE KEY uk_cxp_factura (id_factura_compra),
      KEY idx_cxp_tenant_estado (id_tenant, estado)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  console.log(yaExistia ? "[omitido] cuenta_por_pagar ya existía." : "[creado] cuenta_por_pagar.");
};

const crearPagoCuentaPorPagar = async (connection) => {
  const yaExistia = await existeTabla(connection, "pago_cuenta_por_pagar");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS pago_cuenta_por_pagar (
      id_pago INT NOT NULL AUTO_INCREMENT,
      id_cuenta_por_pagar INT NOT NULL,
      id_tenant INT NOT NULL,
      monto DECIMAL(12,2) NOT NULL,
      fecha DATE NOT NULL,
      medio_pago VARCHAR(32) NOT NULL,
      referencia VARCHAR(64) NULL,
      id_usuario_registra INT NULL,
      fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id_pago),
      KEY idx_pago_cxp (id_cuenta_por_pagar),
      KEY idx_pago_tenant (id_tenant)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  console.log(yaExistia ? "[omitido] pago_cuenta_por_pagar ya existía." : "[creado] pago_cuenta_por_pagar.");
};

const agregarIdOrdenCompraANota = async (connection) => {
  if (await existeColumna(connection, "nota", "id_orden_compra")) {
    console.log("[omitido] nota.id_orden_compra ya existe.");
    return;
  }
  await connection.query(
    "ALTER TABLE nota ADD COLUMN id_orden_compra INT NULL AFTER id_comprobante"
  );
  console.log("[creado] nota.id_orden_compra.");
};

// ── Módulo, submódulos y permisos ──────────────────────────────────────────
const ACTIONS_JSON_COMPRAS = '["ver","crear","editar","eliminar","generar"]';

const registrarModuloYPermisos = async (connection) => {
  let [[modulo]] = await connection.query(
    "SELECT id_modulo FROM modulo WHERE ruta = '/compras' LIMIT 1"
  );
  let id_modulo;
  if (modulo) {
    id_modulo = modulo.id_modulo;
    console.log(`[omitido] modulo 'Compras' ya existía (id=${id_modulo}).`);
  } else {
    const [result] = await connection.query(
      `INSERT INTO modulo (nombre_modulo, ruta, icon, group_name, sort_order, frontend_route, is_visible, active_actions)
       VALUES ('Compras', '/compras', 'ShoppingCart', 'Logística', 100, NULL, 1, ?)`,
      [ACTIONS_JSON_COMPRAS]
    );
    id_modulo = result.insertId;
    console.log(`[creado] modulo 'Compras' (id=${id_modulo}).`);
  }

  // frontend_route: coincide con las rutas registradas en client-v2/src/App.tsx.
  const submodulos = [
    { nombre: "Órdenes de Compra", ruta: "/compras/ordenes", icon: "ClipboardList", frontend_route: "/purchases/orders", sort_order: 101 },
    { nombre: "Facturas de Compra", ruta: "/compras/facturas", icon: "FileSpreadsheet", frontend_route: "/purchases/invoices", sort_order: 102 },
    { nombre: "Cuentas por Pagar", ruta: "/compras/cuentas-por-pagar", icon: "Wallet", frontend_route: "/purchases/accounts-payable", sort_order: 103 },
  ];

  const idsSubmodulo = [];
  for (const sub of submodulos) {
    let [[existente]] = await connection.query(
      "SELECT id_submodulo FROM submodulos WHERE ruta = ? LIMIT 1",
      [sub.ruta]
    );
    if (existente) {
      idsSubmodulo.push(existente.id_submodulo);
      console.log(`[omitido] submodulo '${sub.nombre}' ya existía (id=${existente.id_submodulo}).`);
    } else {
      const [result] = await connection.query(
        `INSERT INTO submodulos (id_modulo, nombre_sub, ruta, icon, group_name, sort_order, frontend_route, is_visible, active_actions)
         VALUES (?, ?, ?, ?, 'Logística', ?, ?, 1, ?)`,
        [id_modulo, sub.nombre, sub.ruta, sub.icon, sub.sort_order, sub.frontend_route, ACTIONS_JSON_COMPRAS]
      );
      idsSubmodulo.push(result.insertId);
      console.log(`[creado] submodulo '${sub.nombre}' (id=${result.insertId}).`);
    }
  }

  // Acceso completo para el rol Administrador (id_rol=1) en cada tenant que
  // ya tenga uno: sin esto el módulo queda invisible para todos los clientes
  // existentes (requireCapability solo mira filas de `permisos`).
  const [tenants] = await connection.query(
    "SELECT DISTINCT id_tenant FROM usuario WHERE id_rol = 1 AND id_tenant IS NOT NULL"
  );

  let filasPermiso = 0;
  for (const { id_tenant } of tenants) {
    for (const id_submodulo of idsSubmodulo) {
      const [result] = await connection.query(
        `INSERT INTO permisos (id_rol, id_modulo, id_submodulo, crear, ver, editar, eliminar, desactivar, generar, actions_json, id_tenant, id_plan)
         VALUES (1, ?, ?, 1, 1, 1, 1, 0, 1, '{}', ?, NULL)
         ON DUPLICATE KEY UPDATE crear = 1, ver = 1, editar = 1, eliminar = 1, generar = 1`,
        [id_modulo, id_submodulo, id_tenant]
      );
      filasPermiso += result.affectedRows;
    }
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

  const connection = await mysql.createConnection({
    host: HOST,
    database: DATABASE,
    user: USER,
    password: PASSWORD,
    port: PORT_DB,
    connectTimeout: 5000,
  });

  try {
    await crearOrdenCompra(connection);
    await crearDetalleOrdenCompra(connection);
    await crearFacturaCompra(connection);
    await crearCuentaPorPagar(connection);
    await crearPagoCuentaPorPagar(connection);
    await agregarIdOrdenCompraANota(connection);
    await registrarModuloYPermisos(connection);
  } finally {
    await connection.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:migrate:compras] ${error.message}`);
  process.exitCode = 1;
});
