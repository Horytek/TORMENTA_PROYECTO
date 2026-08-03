import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * Cuentas por cobrar (crédito a clientes) — simétrico a `cuenta_por_pagar`
 * (proveedores), pero la fuente es `venta` en vez de `factura_compra`.
 *
 * `cliente.limite_credito` NULL = sin límite configurado (no bloquea nada).
 * Una venta con `metodo_pago = 'CREDITO'` genera una fila en `cuenta_por_cobrar`
 * con saldo = total de la venta; `registrarCobro` la va abonando.
 */

const HOSTS_LOCALES = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"]);
const esHostLocal = (host) => HOSTS_LOCALES.has(String(host).trim().toLowerCase());

/**
 * Registra el submódulo y sus permisos.
 *
 * Sin esto, `cuentaPorCobrar.routes.js` exige la capacidad
 * `clientes/cuentas-por-cobrar` contra un submódulo que no existe, y el
 * resolver niega el acceso a TODOS — incluido el administrador. La pantalla
 * queda muerta sin ningún error que explique por qué: el mismo modo de falla
 * silencioso que ya tuvimos con Comprobantes.
 *
 * Cuelga de Clientes (`/clientes`) porque una cuenta por cobrar es deuda de un
 * cliente, y así hereda su lugar en el menú.
 */
const registrarSubmoduloYPermisos = async (cx) => {
  const [[modulo]] = await cx.query("SELECT id_modulo FROM modulo WHERE ruta = '/clientes' LIMIT 1");
  if (!modulo) {
    console.log("[aviso]    no existe el módulo /clientes: no se pudo registrar el submódulo.");
    return;
  }

  let [[submodulo]] = await cx.query(
    "SELECT id_submodulo FROM submodulos WHERE ruta = '/clientes/cuentas-por-cobrar' LIMIT 1"
  );
  if (submodulo) {
    console.log(`[omitido]  submódulo Cuentas por Cobrar ya existía (id=${submodulo.id_submodulo}).`);
  } else {
    const [res] = await cx.query(
      `INSERT INTO submodulos (id_modulo, nombre_sub, ruta, icon, group_name, sort_order, frontend_route, is_visible, active_actions)
       VALUES (?, 'Cuentas por Cobrar', '/clientes/cuentas-por-cobrar', 'Wallet', 'Personas', 15, '/people/clients/receivables', 1, ?)`,
      [modulo.id_modulo, JSON.stringify(["ver", "generar"])]
    );
    submodulo = { id_submodulo: res.insertId };
    console.log(`[creado]   submódulo Cuentas por Cobrar (id=${submodulo.id_submodulo}).`);
  }

  // Permiso para el rol Administrador de cada tenant. `ON DUPLICATE KEY` hace
  // que reejecutar no duplique ni pise un permiso ya afinado a mano.
  const [tenants] = await cx.query("SELECT id_tenant FROM tenant");
  for (const { id_tenant } of tenants) {
    await cx.query(
      `INSERT INTO permisos (id_rol, id_modulo, id_submodulo, crear, ver, editar, eliminar, desactivar, generar, actions_json, id_tenant, id_plan)
       VALUES (1, ?, ?, 0, 1, 0, 0, 0, 1, '{}', ?, NULL)
       ON DUPLICATE KEY UPDATE ver = 1, generar = 1`,
      [modulo.id_modulo, submodulo.id_submodulo, id_tenant]
    );
  }
  console.log(`[permisos] Administrador con acceso en ${tenants.length} tenant(s).`);

  // El resolver cachea por `empresa.perm_version`: sin subirla, las sesiones
  // abiertas tardan hasta 60 s en ver la capacidad nueva.
  const [r] = await cx.query("UPDATE empresa SET perm_version = perm_version + 1");
  console.log(`[caché]    perm_version incrementada en ${r.affectedRows} empresa(s).`);
};

const main = async () => {
  if (!esHostLocal(HOST) && !process.env.ALLOW_REMOTE_MIGRATE) {
    console.error(`Abortado: HOST="${HOST}" no es local. Usa ALLOW_REMOTE_MIGRATE=1 para permitir ejecuciones remotas.`);
    process.exit(1);
  }

  const cx = await mysql.createConnection({
    host: HOST, user: USER, password: PASSWORD, database: DATABASE, port: PORT_DB,
  });

  try {
    const [colCliente] = await cx.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'cliente' AND COLUMN_NAME = 'limite_credito'`,
      [DATABASE]
    );
    if (colCliente.length === 0) {
      await cx.query(
        `ALTER TABLE cliente ADD COLUMN limite_credito DECIMAL(10,2) NULL DEFAULT NULL
         COMMENT 'Límite de crédito; NULL = sin límite configurado'`
      );
      console.log("[creado]   cliente.limite_credito");
    } else {
      console.log("[omitido]  cliente.limite_credito ya existe.");
    }

    const [tablas] = await cx.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('cuenta_por_cobrar', 'pago_cuenta_por_cobrar')`,
      [DATABASE]
    );
    const existentes = new Set(tablas.map((t) => t.TABLE_NAME));

    if (!existentes.has("cuenta_por_cobrar")) {
      await cx.query(`
        CREATE TABLE cuenta_por_cobrar (
          id_cuenta_por_cobrar INT NOT NULL AUTO_INCREMENT,
          id_venta             INT NOT NULL,
          id_cliente           INT NOT NULL,
          id_tenant            INT UNSIGNED NOT NULL,
          monto_total          DECIMAL(10,2) NOT NULL,
          saldo                DECIMAL(10,2) NOT NULL,
          fecha_vencimiento    DATE NOT NULL,
          estado               VARCHAR(20) NOT NULL DEFAULT 'pendiente',
          f_creacion           DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id_cuenta_por_cobrar),
          INDEX idx_cxc_cliente (id_cliente),
          INDEX idx_cxc_tenant (id_tenant),
          INDEX idx_cxc_venta (id_venta)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      console.log("[creado]   tabla cuenta_por_cobrar");
    } else {
      console.log("[omitido]  cuenta_por_cobrar ya existe.");
    }

    if (!existentes.has("pago_cuenta_por_cobrar")) {
      await cx.query(`
        CREATE TABLE pago_cuenta_por_cobrar (
          id_pago               INT NOT NULL AUTO_INCREMENT,
          id_cuenta_por_cobrar  INT NOT NULL,
          id_tenant             INT UNSIGNED NOT NULL,
          monto                 DECIMAL(10,2) NOT NULL,
          fecha                 DATE NOT NULL,
          medio_pago            VARCHAR(30) NOT NULL,
          referencia            VARCHAR(100) NULL,
          id_usuario_registra   INT NULL,
          f_creacion            DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id_pago),
          INDEX idx_pcxc_cuenta (id_cuenta_por_cobrar)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      console.log("[creado]   tabla pago_cuenta_por_cobrar");
    } else {
      console.log("[omitido]  pago_cuenta_por_cobrar ya existe.");
    }

    await registrarSubmoduloYPermisos(cx);
  } finally {
    await cx.end();
  }
};

main().catch((error) => {
  console.error("Error en la migración:", error.message);
  process.exit(1);
});
