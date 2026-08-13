import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * Overlay de sucursales para vitrina + entregas provincia.
 *
 * Uso: npm run db:migrate:tienda-entregas
 * Remoto: ALLOW_REMOTE_MIGRATE=1 npm run db:migrate:tienda-entregas
 */

const HOSTS_LOCALES = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"]);
const esHostLocal = (host) => HOSTS_LOCALES.has(String(host).trim().toLowerCase());

const main = async () => {
  if (!esHostLocal(HOST) && !process.env.ALLOW_REMOTE_MIGRATE) {
    console.error(`Abortado: HOST="${HOST}" no es local. Usa ALLOW_REMOTE_MIGRATE=1.`);
    process.exit(1);
  }
  if (!HOST || !USER) {
    throw new Error("Falta DB_HOST / DB_USERNAME en .env.");
  }

  const cx = await mysql.createConnection({
    host: HOST,
    user: USER,
    password: PASSWORD,
    database: DATABASE,
    port: PORT_DB,
    multipleStatements: true,
  });

  const tableExists = async (tabla) => {
    const [rows] = await cx.query(
      `SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? LIMIT 1`,
      [DATABASE, tabla]
    );
    return rows.length > 0;
  };

  const columnExists = async (tabla, columna) => {
    const [rows] = await cx.query(
      `SELECT 1 FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
      [DATABASE, tabla, columna]
    );
    return rows.length > 0;
  };

  const addColumnIfMissing = async (tabla, columna, ddl) => {
    if (await columnExists(tabla, columna)) {
      console.log(`[omitido] ${tabla}.${columna}`);
      return;
    }
    await cx.query(`ALTER TABLE ${tabla} ADD COLUMN ${ddl}`);
    console.log(`[creado]  ${tabla}.${columna}`);
  };

  try {
    if (!(await tableExists("tienda_sucursal"))) {
      await cx.query(`
        CREATE TABLE tienda_sucursal (
          id_tenant INT NOT NULL,
          id_sucursal INT NOT NULL,
          visible TINYINT(1) NOT NULL DEFAULT 1,
          allow_pickup TINYINT(1) NOT NULL DEFAULT 1,
          allow_delivery TINYINT(1) NOT NULL DEFAULT 0,
          es_default TINYINT(1) NOT NULL DEFAULT 0,
          whatsapp VARCHAR(32) NULL,
          telefono VARCHAR(32) NULL,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id_tenant, id_sucursal),
          KEY idx_tienda_sucursal_visible (id_tenant, visible)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado]  tienda_sucursal");
    } else {
      console.log("[omitido] tienda_sucursal");
    }

    await addColumnIfMissing(
      "tienda_entrega_config",
      "provincia_activo",
      "provincia_activo TINYINT(1) NOT NULL DEFAULT 0"
    );
    await addColumnIfMissing(
      "tienda_entrega_config",
      "retiro_prep_minutos",
      "retiro_prep_minutos INT NULL"
    );
    await addColumnIfMissing(
      "tienda_entrega_config",
      "retiro_instrucciones",
      "retiro_instrucciones TEXT NULL"
    );
    await addColumnIfMissing(
      "tienda_entrega_config",
      "delivery_pedido_min",
      "delivery_pedido_min DECIMAL(10,2) NULL"
    );
    await addColumnIfMissing(
      "tienda_entrega_config",
      "delivery_gratis_desde",
      "delivery_gratis_desde DECIMAL(10,2) NULL"
    );
    await addColumnIfMissing(
      "tienda_entrega_config",
      "provincia_pedido_min",
      "provincia_pedido_min DECIMAL(10,2) NULL"
    );
    await addColumnIfMissing(
      "tienda_entrega_config",
      "provincia_condiciones",
      "provincia_condiciones TEXT NULL"
    );
    await addColumnIfMissing(
      "tienda_entrega_config",
      "provincia_requiere_agencia",
      "provincia_requiere_agencia TINYINT(1) NOT NULL DEFAULT 0"
    );

    if (!(await tableExists("tienda_envio_destino"))) {
      await cx.query(`
        CREATE TABLE tienda_envio_destino (
          id_destino INT NOT NULL AUTO_INCREMENT,
          id_tenant INT NOT NULL,
          departamento VARCHAR(80) NOT NULL,
          provincia VARCHAR(80) NULL,
          costo DECIMAL(10,2) NOT NULL DEFAULT 0,
          tiempo_estimado VARCHAR(80) NULL,
          activo TINYINT(1) NOT NULL DEFAULT 1,
          PRIMARY KEY (id_destino),
          KEY idx_tienda_destino_tenant (id_tenant, activo)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado]  tienda_envio_destino");
    } else {
      console.log("[omitido] tienda_envio_destino");
    }

    if (!(await tableExists("tienda_envio_agencia"))) {
      await cx.query(`
        CREATE TABLE tienda_envio_agencia (
          id_agencia INT NOT NULL AUTO_INCREMENT,
          id_tenant INT NOT NULL,
          nombre VARCHAR(120) NOT NULL,
          telefono VARCHAR(32) NULL,
          direccion VARCHAR(255) NULL,
          cobertura_texto VARCHAR(255) NULL,
          observaciones TEXT NULL,
          activo TINYINT(1) NOT NULL DEFAULT 1,
          PRIMARY KEY (id_agencia),
          KEY idx_tienda_agencia_tenant (id_tenant, activo)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado]  tienda_envio_agencia");
    } else {
      console.log("[omitido] tienda_envio_agencia");
    }

    if (await tableExists("tienda_pedido")) {
      await cx.query(`
        ALTER TABLE tienda_pedido
        MODIFY COLUMN metodo_entrega ENUM('retiro','delivery','consulta','provincia')
        NOT NULL DEFAULT 'retiro'
      `);
      console.log("[ok]     tienda_pedido.metodo_entrega + provincia");
      await addColumnIfMissing("tienda_pedido", "id_destino", "id_destino INT NULL");
      await addColumnIfMissing("tienda_pedido", "id_agencia", "id_agencia INT NULL");
    }

    console.log("Migración entregas/sucursales OK.");
  } finally {
    await cx.end();
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
