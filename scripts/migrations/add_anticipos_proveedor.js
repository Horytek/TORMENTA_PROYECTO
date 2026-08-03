import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * Anticipos a proveedor: dinero entregado ANTES de que exista una factura de
 * compra (`cuenta_por_pagar` exige `id_factura_compra`, así que no sirve para
 * esto). `anticipo_proveedor.saldo_disponible` se va consumiendo al aplicarlo
 * contra una o varias cuentas por pagar del mismo proveedor; cada aplicación
 * queda registrada como un pago normal en `pago_cuenta_por_pagar`
 * (`medio_pago='Anticipo'`, `id_anticipo` apuntando al origen).
 *
 * Uso: npm run db:migrate:anticipos
 */

const HOSTS_LOCALES = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"]);
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

const crearAnticipoProveedor = async (connection) => {
  const yaExistia = await existeTabla(connection, "anticipo_proveedor");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS anticipo_proveedor (
      id_anticipo INT NOT NULL AUTO_INCREMENT,
      id_tenant INT NOT NULL,
      id_destinatario INT NOT NULL COMMENT 'Proveedor: destinatario.ubicacion=proveedor',
      monto DECIMAL(12,2) NOT NULL,
      saldo_disponible DECIMAL(12,2) NOT NULL,
      fecha DATE NOT NULL,
      medio_pago VARCHAR(32) NOT NULL,
      referencia VARCHAR(64) NULL,
      estado ENUM('disponible','aplicado','anulado') NOT NULL DEFAULT 'disponible',
      id_usuario_registra INT NULL,
      fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id_anticipo),
      KEY idx_anticipo_tenant_estado (id_tenant, estado),
      KEY idx_anticipo_destinatario (id_destinatario)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  console.log(yaExistia ? "[omitido] anticipo_proveedor ya existía." : "[creado] anticipo_proveedor.");
};

const agregarIdAnticipoAPago = async (connection) => {
  if (await existeColumna(connection, "pago_cuenta_por_pagar", "id_anticipo")) {
    console.log("[omitido] pago_cuenta_por_pagar.id_anticipo ya existe.");
    return;
  }
  await connection.query(
    "ALTER TABLE pago_cuenta_por_pagar ADD COLUMN id_anticipo INT NULL AFTER medio_pago"
  );
  console.log("[creado] pago_cuenta_por_pagar.id_anticipo.");
};

// ── Submódulo + permisos, dentro del módulo 'Compras' que ya crea
// create_compras_tables.js. Si ese módulo todavía no existe (orden de
// migraciones invertido) se crea aquí también, con el mismo criterio.
const ACTIONS_JSON_COMPRAS = '["ver","crear","editar","eliminar","generar"]';

const registrarSubmoduloYPermisos = async (connection) => {
  let [[modulo]] = await connection.query("SELECT id_modulo FROM modulo WHERE ruta = '/compras' LIMIT 1");
  let id_modulo;
  if (modulo) {
    id_modulo = modulo.id_modulo;
  } else {
    const [result] = await connection.query(
      `INSERT INTO modulo (nombre_modulo, ruta, icon, group_name, sort_order, frontend_route, is_visible, active_actions)
       VALUES ('Compras', '/compras', 'ShoppingCart', 'Logística', 100, NULL, 1, ?)`,
      [ACTIONS_JSON_COMPRAS]
    );
    id_modulo = result.insertId;
    console.log(`[creado] modulo 'Compras' (id=${id_modulo}).`);
  }

  let [[existente]] = await connection.query(
    "SELECT id_submodulo FROM submodulos WHERE ruta = '/compras/anticipos' LIMIT 1"
  );
  let id_submodulo;
  if (existente) {
    id_submodulo = existente.id_submodulo;
    console.log(`[omitido] submodulo 'Anticipos a Proveedor' ya existía (id=${id_submodulo}).`);
  } else {
    const [result] = await connection.query(
      `INSERT INTO submodulos (id_modulo, nombre_sub, ruta, icon, group_name, sort_order, frontend_route, is_visible, active_actions)
       VALUES (?, 'Anticipos a Proveedor', '/compras/anticipos', 'Wallet', 'Logística', 104, '/purchases/advances', 1, ?)`,
      [id_modulo, ACTIONS_JSON_COMPRAS]
    );
    id_submodulo = result.insertId;
    console.log(`[creado] submodulo 'Anticipos a Proveedor' (id=${id_submodulo}).`);
  }

  const [tenants] = await connection.query(
    "SELECT DISTINCT id_tenant FROM usuario WHERE id_rol = 1 AND id_tenant IS NOT NULL"
  );
  let filasPermiso = 0;
  for (const { id_tenant } of tenants) {
    const [result] = await connection.query(
      `INSERT INTO permisos (id_rol, id_modulo, id_submodulo, crear, ver, editar, eliminar, desactivar, generar, actions_json, id_tenant, id_plan)
       VALUES (1, ?, ?, 1, 1, 1, 1, 0, 1, '{}', ?, NULL)
       ON DUPLICATE KEY UPDATE crear = 1, ver = 1, editar = 1, eliminar = 1, generar = 1`,
      [id_modulo, id_submodulo, id_tenant]
    );
    filasPermiso += result.affectedRows;
  }
  console.log(`[permisos] Administrador con acceso a Anticipos en ${tenants.length} tenant(s).`);
};

const ejecutar = async () => {
  if (!HOST || !DATABASE || !USER) {
    throw new Error("Falta configurar la conexión MySQL local en el archivo .env.");
  }
  if (!esHostLocal(HOST) && !process.env.ALLOW_REMOTE_MIGRATE) {
    throw new Error("Migración cancelada: esta versión solo está autorizada para MySQL local (o establece ALLOW_REMOTE_MIGRATE=1).");
  }

  const connection = await mysql.createConnection({
    host: HOST, database: DATABASE, user: USER, password: PASSWORD, port: PORT_DB, connectTimeout: 5000,
  });

  try {
    await crearAnticipoProveedor(connection);
    await agregarIdAnticipoAPago(connection);
    await registrarSubmoduloYPermisos(connection);
  } finally {
    await connection.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:migrate:anticipos] ${error.message}`);
  process.exitCode = 1;
});
