import mysql from "mysql2/promise";
import {
  DATABASE,
  HOST,
  PASSWORD,
  PORT_DB,
  USER,
} from "../../src/config.js";

/**
 * Le da a "Comprobantes electrónicos" (client-v2/src/features/comprobantes,
 * backend /api/cpe) su propio módulo en `modulo`/`permisos`, en vez de seguir
 * pidiendo prestada la capacidad `ventas` (ver src/routes/cpe.routes.js y
 * client-v2/src/components/layouts/AppSidebar.tsx, que hasta ahora lo
 * explicaban como decisión deliberada para no tener que sembrar datos).
 *
 * Para que nadie pierda acceso al migrar, copia 1:1:
 *   - cada fila de `permisos` del módulo Ventas (id_modulo=6) hacia el módulo
 *     nuevo, mismo id_rol/id_tenant/id_plan/valores,
 *   - cada `plan_entitlement_modulo` de Ventas hacia el módulo nuevo.
 *
 * Uso: npm run db:migrate:comprobantes
 */

const HOSTS_LOCALES = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"]);
const esHostLocal = (host) => HOSTS_LOCALES.has(String(host).trim().toLowerCase());

const ID_MODULO_VENTAS = 6;
const ACTIONS_JSON = '["ver","generar"]';

const registrarModulo = async (connection) => {
  let [[modulo]] = await connection.query("SELECT id_modulo FROM modulo WHERE ruta = '/comprobantes' LIMIT 1");
  if (modulo) {
    console.log(`[omitido] modulo 'Comprobantes Electrónicos' ya existía (id=${modulo.id_modulo}).`);
    return modulo.id_modulo;
  }
  const [result] = await connection.query(
    `INSERT INTO modulo (nombre_modulo, ruta, icon, group_name, sort_order, frontend_route, is_visible, active_actions)
     VALUES ('Comprobantes Electrónicos', '/comprobantes', 'FileCheck2', 'General', 3, '/sales/comprobantes', 1, ?)`,
    [ACTIONS_JSON]
  );
  console.log(`[creado] modulo 'Comprobantes Electrónicos' (id=${result.insertId}).`);
  return result.insertId;
};

const copiarPermisosDeVentas = async (connection, idModuloNuevo) => {
  const [[{ total: yaExistian }]] = await connection.query(
    "SELECT COUNT(*) AS total FROM permisos WHERE id_modulo = ?",
    [idModuloNuevo]
  );
  if (yaExistian > 0) {
    console.log(`[omitido] permisos de Comprobantes ya existían (${yaExistian} filas).`);
    return;
  }

  const [result] = await connection.query(
    `INSERT INTO permisos (id_rol, id_modulo, id_submodulo, crear, ver, editar, eliminar, desactivar, generar, actions_json, id_tenant, id_plan)
     SELECT id_rol, ?, NULL, crear, ver, editar, eliminar, desactivar, generar, actions_json, id_tenant, id_plan
     FROM permisos WHERE id_modulo = ?`,
    [idModuloNuevo, ID_MODULO_VENTAS]
  );
  console.log(`[copiado] ${result.affectedRows} fila(s) de permisos desde Ventas hacia Comprobantes (mismo acceso, ningún tenant pierde nada).`);
};

const copiarEntitlements = async (connection, idModuloNuevo) => {
  const [[{ total: yaExistian }]] = await connection.query(
    "SELECT COUNT(*) AS total FROM plan_entitlement_modulo WHERE id_modulo = ?",
    [idModuloNuevo]
  );
  if (yaExistian > 0) {
    console.log(`[omitido] entitlements de Comprobantes ya existían (${yaExistian} filas).`);
    return;
  }

  const [result] = await connection.query(
    `INSERT INTO plan_entitlement_modulo (template_version_id, id_modulo)
     SELECT template_version_id, ? FROM plan_entitlement_modulo WHERE id_modulo = ?`,
    [idModuloNuevo, ID_MODULO_VENTAS]
  );
  console.log(`[copiado] ${result.affectedRows} entitlement(s) de plan desde Ventas hacia Comprobantes.`);
};

/**
 * El resolver de capacidades cachea por `empresa.perm_version` (authz.service.js).
 * Como acá se escribe en `permisos` por SQL directo, sin pasar por los escritores
 * que lo incrementan, hay que subirlo a mano: si no, hasta 60 s de sesiones vivas
 * seguirían sin ver la capacidad nueva. Subirlo de más es inofensivo.
 */
const invalidarCachePermisos = async (connection) => {
  const [result] = await connection.query("UPDATE empresa SET perm_version = perm_version + 1");
  console.log(`[caché] perm_version incrementada en ${result.affectedRows} empresa(s).`);
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
    const idModulo = await registrarModulo(connection);
    await copiarPermisosDeVentas(connection, idModulo);
    await copiarEntitlements(connection, idModulo);
    await invalidarCachePermisos(connection);
  } finally {
    await connection.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:migrate:comprobantes] ${error.message}`);
  process.exitCode = 1;
});
