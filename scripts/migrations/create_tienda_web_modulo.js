import mysql from "mysql2/promise";
import {
  DATABASE,
  HOST,
  PASSWORD,
  PORT_DB,
  USER,
} from "../../src/config.js";

/**
 * Registra el módulo ERP "Tienda web" (`ruta=/catalogo`) para sidebar + roles.
 * Copia permisos y entitlements desde Productos para que nadie pierda acceso.
 *
 * Uso: npm run db:migrate:tienda-modulo
 */

const HOSTS_LOCALES = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"]);
const esHostLocal = (host) => HOSTS_LOCALES.has(String(host).trim().toLowerCase());

const ACTIONS_JSON = '["ver","editar"]';

const registrarModulo = async (connection) => {
  let [[modulo]] = await connection.query(
    `SELECT id_modulo FROM modulo
     WHERE ruta IN ('/catalogo', 'catalogo')
     LIMIT 1`
  );
  if (modulo) {
    await connection.query(
      `UPDATE modulo SET
         nombre_modulo = 'Tienda web',
         icon = COALESCE(NULLIF(icon, ''), 'Store'),
         group_name = COALESCE(NULLIF(group_name, ''), 'General'),
         frontend_route = '/catalog-express',
         is_visible = 1,
         active_actions = ?
       WHERE id_modulo = ?`,
      [ACTIONS_JSON, modulo.id_modulo]
    );
    console.log(`[actualizado] modulo 'Tienda web' (id=${modulo.id_modulo}).`);
    return modulo.id_modulo;
  }
  const [result] = await connection.query(
    `INSERT INTO modulo (nombre_modulo, ruta, icon, group_name, sort_order, frontend_route, is_visible, active_actions)
     VALUES ('Tienda web', '/catalogo', 'Store', 'General', 12, '/catalog-express', 1, ?)`,
    [ACTIONS_JSON]
  );
  console.log(`[creado] modulo 'Tienda web' (id=${result.insertId}).`);
  return result.insertId;
};

const idModuloProductos = async (connection) => {
  const [[row]] = await connection.query(
    `SELECT id_modulo FROM modulo WHERE ruta IN ('/productos', 'productos') LIMIT 1`
  );
  return row?.id_modulo || null;
};

const copiarPermisos = async (connection, idModuloNuevo) => {
  const [[{ total: yaExistian }]] = await connection.query(
    "SELECT COUNT(*) AS total FROM permisos WHERE id_modulo = ?",
    [idModuloNuevo]
  );
  if (yaExistian > 0) {
    console.log(`[omitido] permisos de Tienda web ya existían (${yaExistian} filas).`);
    return;
  }

  const idProductos = await idModuloProductos(connection);
  if (idProductos) {
    const [result] = await connection.query(
      `INSERT INTO permisos (id_rol, id_modulo, id_submodulo, crear, ver, editar, eliminar, desactivar, generar, actions_json, id_tenant, id_plan)
       SELECT id_rol, ?, NULL, 0, ver, editar, 0, 0, 0, NULL, id_tenant, id_plan
       FROM permisos WHERE id_modulo = ?`,
      [idModuloNuevo, idProductos]
    );
    console.log(`[copiado] ${result.affectedRows} fila(s) de permisos desde Productos.`);
    return;
  }

  const [tenants] = await connection.query(
    "SELECT DISTINCT id_tenant FROM usuario WHERE id_rol = 1 AND id_tenant IS NOT NULL"
  );
  for (const { id_tenant } of tenants) {
    await connection.query(
      `INSERT INTO permisos (id_rol, id_modulo, id_submodulo, crear, ver, editar, eliminar, desactivar, generar, id_tenant, id_plan)
       VALUES (1, ?, NULL, 0, 1, 1, 0, 0, 0, ?, NULL)
       ON DUPLICATE KEY UPDATE ver = 1, editar = 1`,
      [idModuloNuevo, id_tenant]
    );
  }
  console.log(`[permisos] Administrador con acceso en ${tenants.length} tenant(s).`);
};

const restringirSoloAdmin = async (connection, idModulo) => {
  const [del] = await connection.query(
    "DELETE FROM permisos WHERE id_modulo = ? AND id_rol <> 1",
    [idModulo]
  );
  console.log(`[permisos] quitados a roles no-admin: ${del.affectedRows} fila(s).`);

  const [upd] = await connection.query(
    `UPDATE permisos SET ver = 1, editar = 1, crear = 0, eliminar = 0, desactivar = 0, generar = 0
     WHERE id_modulo = ? AND id_rol = 1`,
    [idModulo]
  );
  console.log(`[permisos] Administrador ver/editar: ${upd.affectedRows} fila(s).`);

  const [tenants] = await connection.query(
    "SELECT DISTINCT id_tenant FROM usuario WHERE id_rol = 1 AND id_tenant IS NOT NULL"
  );
  let creados = 0;
  for (const { id_tenant } of tenants) {
    const [existente] = await connection.query(
      `SELECT id_permiso FROM permisos
       WHERE id_rol = 1 AND id_modulo = ? AND id_submodulo IS NULL AND id_tenant = ? AND id_plan IS NULL
       LIMIT 1`,
      [idModulo, id_tenant]
    );
    if (existente.length > 0) continue;
    await connection.query(
      `INSERT INTO permisos (id_rol, id_modulo, id_submodulo, crear, ver, editar, eliminar, desactivar, generar, id_tenant, id_plan)
       VALUES (1, ?, NULL, 0, 1, 1, 0, 0, 0, ?, NULL)`,
      [idModulo, id_tenant]
    );
    creados++;
  }
  if (creados) console.log(`[permisos] Administrador: ${creados} tenant(s) nuevos.`);
};

const ampliarEntitlements = async (connection, idModuloNuevo) => {
  try {
    const [result] = await connection.query(
      `INSERT INTO plan_entitlement_modulo (template_version_id, id_modulo)
       SELECT DISTINCT pem.template_version_id, ?
       FROM plan_entitlement_modulo pem
       WHERE NOT EXISTS (
         SELECT 1 FROM plan_entitlement_modulo x
         WHERE x.template_version_id = pem.template_version_id AND x.id_modulo = ?
       )`,
      [idModuloNuevo, idModuloNuevo]
    );
    console.log(`[entitlements] plantillas cubiertas: +${result.affectedRows}.`);
  } catch (err) {
    console.log(`[omitido] entitlements extra: ${err.message}`);
  }
};

const copiarEntitlements = async (connection, idModuloNuevo) => {
  try {
    const [[{ total: yaExistian }]] = await connection.query(
      "SELECT COUNT(*) AS total FROM plan_entitlement_modulo WHERE id_modulo = ?",
      [idModuloNuevo]
    );
    if (yaExistian > 0) {
      console.log(`[omitido] entitlements de Tienda web ya existían (${yaExistian} filas).`);
      return;
    }

    const idProductos = await idModuloProductos(connection);
    if (!idProductos) {
      console.log("[omitido] no hay módulo Productos para copiar entitlements.");
      return;
    }

    const [result] = await connection.query(
      `INSERT INTO plan_entitlement_modulo (template_version_id, id_modulo)
       SELECT template_version_id, ? FROM plan_entitlement_modulo WHERE id_modulo = ?`,
      [idModuloNuevo, idProductos]
    );
    console.log(`[copiado] ${result.affectedRows} entitlement(s) de plan desde Productos.`);
  } catch (err) {
    console.log(`[omitido] entitlements: ${err.message}`);
  }
};

const invalidarCachePermisos = async (connection) => {
  const [result] = await connection.query("UPDATE empresa SET perm_version = perm_version + 1");
  console.log(`[caché] perm_version incrementada en ${result.affectedRows} empresa(s).`);
};

const ejecutar = async () => {
  if (!HOST || !DATABASE || !USER) {
    throw new Error("Falta configurar la conexión MySQL local en el archivo .env.");
  }
  if (!esHostLocal(HOST) && !process.env.ALLOW_REMOTE_MIGRATE) {
    throw new Error(
      "Migración cancelada: esta versión solo está autorizada para MySQL local (o establece ALLOW_REMOTE_MIGRATE=1)."
    );
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
    const idModulo = await registrarModulo(connection);
    await copiarPermisos(connection, idModulo);
    await restringirSoloAdmin(connection, idModulo);
    await copiarEntitlements(connection, idModulo);
    await ampliarEntitlements(connection, idModulo);
    await invalidarCachePermisos(connection);
  } finally {
    await connection.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:migrate:tienda-modulo] ${error.message}`);
  process.exitCode = 1;
});
