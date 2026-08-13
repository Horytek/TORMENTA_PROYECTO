import mysql from "mysql2/promise";
import {
  DATABASE,
  ECOMMERCE_DATABASE,
  HOST,
  PASSWORD,
  PORT_DB,
  USER,
} from "../../src/config.js";

/**
 * Crea db_ecommerce (mismo MySQL) + schema rediseñado.
 * Uso: ALLOW_REMOTE_MIGRATE=1 npm run db:migrate:ecommerce
 */

const ejecutar = async () => {
  if (!HOST || !USER) {
    throw new Error("Falta configurar DB_HOST / DB_USERNAME en .env.");
  }
  if (!process.env.ALLOW_REMOTE_MIGRATE && !["localhost", "127.0.0.1", "::1"].includes(String(HOST))) {
    throw new Error(
      "Migración remota cancelada. Usa ALLOW_REMOTE_MIGRATE=1 (Railway / proxy)."
    );
  }

  const root = await mysql.createConnection({
    host: HOST,
    user: USER,
    password: PASSWORD,
    port: PORT_DB,
    connectTimeout: 15000,
    multipleStatements: true,
  });

  try {
    await root.query(
      `CREATE DATABASE IF NOT EXISTS \`${ECOMMERCE_DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`[ok] DATABASE ${ECOMMERCE_DATABASE} lista.`);
  } finally {
    await root.end();
  }

  const cx = await mysql.createConnection({
    host: HOST,
    database: ECOMMERCE_DATABASE,
    user: USER,
    password: PASSWORD,
    port: PORT_DB,
    connectTimeout: 15000,
  });

  const tableExists = async (tabla) => {
    const [rows] = await cx.query(
      `SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? LIMIT 1`,
      [ECOMMERCE_DATABASE, tabla]
    );
    return rows.length > 0;
  };

  try {
    if (!(await tableExists("plan"))) {
      await cx.query(`
        CREATE TABLE plan (
          id_plan INT NOT NULL,
          codigo VARCHAR(32) NOT NULL,
          nombre VARCHAR(64) NOT NULL,
          precio_mensual DECIMAL(12,2) NOT NULL,
          moneda CHAR(3) NOT NULL DEFAULT 'PEN',
          descripcion VARCHAR(255) NULL,
          limites_json JSON NULL,
          activo TINYINT(1) NOT NULL DEFAULT 1,
          PRIMARY KEY (id_plan),
          UNIQUE KEY uq_plan_codigo (codigo)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      await cx.query(`
        INSERT INTO plan (id_plan, codigo, nombre, precio_mensual, moneda, descripcion) VALUES
          (1, 'starter', 'Starter', 79.00, 'PEN', 'Tienda online con catálogo, carrito y Mercado Pago'),
          (2, 'pro', 'Pro', 129.00, 'PEN', 'Starter + más productos y soporte prioritario')
      `);
      console.log("[creado] plan + seeds");
    } else {
      console.log("[omitido] plan");
    }

    if (!(await tableExists("tienda"))) {
      await cx.query(`
        CREATE TABLE tienda (
          id_tienda INT NOT NULL AUTO_INCREMENT,
          id_plan INT NOT NULL,
          slug VARCHAR(80) NOT NULL,
          nombre VARCHAR(160) NOT NULL,
          email VARCHAR(160) NOT NULL,
          telefono VARCHAR(40) NULL,
          estado ENUM('pending','active','suspended') NOT NULL DEFAULT 'pending',
          color_primario VARCHAR(16) NULL DEFAULT '#0E7C7B',
          logo_url VARCHAR(512) NULL,
          theme_json JSON NULL,
          descripcion TEXT NULL,
          fecha_pago DATE NULL,
          legacy_tenant_id INT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id_tienda),
          UNIQUE KEY uq_tienda_slug (slug),
          UNIQUE KEY uq_tienda_email (email),
          UNIQUE KEY uq_tienda_legacy_tenant (legacy_tenant_id),
          KEY idx_tienda_estado (estado),
          CONSTRAINT fk_tienda_plan FOREIGN KEY (id_plan) REFERENCES plan (id_plan)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] tienda");
    } else {
      console.log("[omitido] tienda");
    }

    if (!(await tableExists("usuario"))) {
      await cx.query(`
        CREATE TABLE usuario (
          id_usuario INT NOT NULL AUTO_INCREMENT,
          id_tienda INT NOT NULL,
          usua VARCHAR(80) NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          temp_password_hash VARCHAR(255) NULL,
          temp_password_expires_at DATETIME NULL,
          email VARCHAR(160) NOT NULL,
          nombre VARCHAR(120) NULL,
          rol ENUM('admin') NOT NULL DEFAULT 'admin',
          estado TINYINT(1) NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id_usuario),
          UNIQUE KEY uq_usuario_usua (usua),
          UNIQUE KEY uq_usuario_email (email),
          KEY idx_usuario_tienda (id_tienda),
          CONSTRAINT fk_usuario_tienda FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] usuario");
    } else {
      console.log("[omitido] usuario");
    }

    if (!(await tableExists("mp_cuenta"))) {
      await cx.query(`
        CREATE TABLE mp_cuenta (
          id_tienda INT NOT NULL,
          public_key VARCHAR(255) NOT NULL,
          access_token_enc TEXT NOT NULL,
          modo ENUM('test','prod') NOT NULL DEFAULT 'test',
          conectado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id_tienda),
          CONSTRAINT fk_mp_tienda FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] mp_cuenta");
    } else {
      console.log("[omitido] mp_cuenta");
    }

    if (!(await tableExists("producto"))) {
      await cx.query(`
        CREATE TABLE producto (
          id_producto INT NOT NULL AUTO_INCREMENT,
          id_tienda INT NOT NULL,
          nombre VARCHAR(200) NOT NULL,
          descripcion TEXT NULL,
          precio DECIMAL(12,2) NOT NULL DEFAULT 0,
          stock INT NOT NULL DEFAULT 0,
          stock_min INT NOT NULL DEFAULT 5,
          activo TINYINT(1) NOT NULL DEFAULT 1,
          sku VARCHAR(64) NULL,
          categoria VARCHAR(80) NULL,
          attrs_json JSON NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id_producto),
          KEY idx_prod_tienda_activo (id_tienda, activo),
          KEY idx_prod_tienda_nombre (id_tienda, nombre),
          KEY idx_prod_categoria (id_tienda, categoria),
          CONSTRAINT fk_prod_tienda FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] producto");
    } else {
      console.log("[omitido] producto");
    }

    if (!(await tableExists("producto_imagen"))) {
      await cx.query(`
        CREATE TABLE producto_imagen (
          id_imagen INT NOT NULL AUTO_INCREMENT,
          id_tienda INT NOT NULL,
          id_producto INT NOT NULL,
          url VARCHAR(512) NOT NULL,
          file_id VARCHAR(128) NULL,
          orden INT NOT NULL DEFAULT 0,
          es_principal TINYINT(1) NOT NULL DEFAULT 0,
          tipo ENUM('galeria','informativa') NOT NULL DEFAULT 'galeria',
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id_imagen),
          KEY idx_img_prod (id_tienda, id_producto),
          KEY idx_img_tipo (id_tienda, id_producto, tipo),
          CONSTRAINT fk_img_producto FOREIGN KEY (id_producto) REFERENCES producto (id_producto) ON DELETE CASCADE,
          CONSTRAINT fk_img_tienda FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] producto_imagen");
    } else {
      console.log("[omitido] producto_imagen");
    }

    if (!(await tableExists("orden"))) {
      await cx.query(`
        CREATE TABLE orden (
          id_orden INT NOT NULL AUTO_INCREMENT,
          id_tienda INT NOT NULL,
          codigo VARCHAR(32) NOT NULL,
          estado ENUM('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
          total DECIMAL(12,2) NOT NULL DEFAULT 0,
          moneda CHAR(3) NOT NULL DEFAULT 'PEN',
          email_comprador VARCHAR(160) NULL,
          nombre_comprador VARCHAR(160) NULL,
          telefono_comprador VARCHAR(40) NULL,
          mp_preference_id VARCHAR(128) NULL,
          mp_payment_id VARCHAR(64) NULL,
          external_reference VARCHAR(160) NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id_orden),
          UNIQUE KEY uq_orden_codigo (codigo),
          UNIQUE KEY uq_orden_payment (mp_payment_id),
          KEY idx_orden_tienda_estado (id_tienda, estado),
          KEY idx_orden_pref (mp_preference_id),
          CONSTRAINT fk_orden_tienda FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] orden");
    } else {
      console.log("[omitido] orden");
    }

    if (!(await tableExists("orden_item"))) {
      await cx.query(`
        CREATE TABLE orden_item (
          id_detalle INT NOT NULL AUTO_INCREMENT,
          id_orden INT NOT NULL,
          id_tienda INT NOT NULL,
          id_producto INT NOT NULL,
          nombre_snapshot VARCHAR(200) NOT NULL,
          cantidad INT NOT NULL,
          precio_unitario DECIMAL(12,2) NOT NULL,
          PRIMARY KEY (id_detalle),
          KEY idx_item_orden (id_orden),
          KEY idx_item_tienda (id_tienda),
          CONSTRAINT fk_item_orden FOREIGN KEY (id_orden) REFERENCES orden (id_orden) ON DELETE CASCADE,
          CONSTRAINT fk_item_tienda FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] orden_item");
    } else {
      console.log("[omitido] orden_item");
    }

    if (!(await tableExists("suscripcion_pago"))) {
      await cx.query(`
        CREATE TABLE suscripcion_pago (
          id INT NOT NULL AUTO_INCREMENT,
          id_tienda INT NOT NULL,
          mp_payment_id VARCHAR(64) NOT NULL,
          mp_preference_id VARCHAR(128) NULL,
          status VARCHAR(32) NOT NULL,
          amount DECIMAL(12,2) NULL,
          external_reference VARCHAR(160) NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uq_saas_payment (mp_payment_id),
          KEY idx_saas_tienda (id_tienda),
          CONSTRAINT fk_saas_tienda FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] suscripcion_pago");
    } else {
      console.log("[omitido] suscripcion_pago");
    }

    console.log(`[ok] Schema ${ECOMMERCE_DATABASE} listo (ERP sigue en ${DATABASE}).`);
  } finally {
    await cx.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:migrate:ecommerce] ${error.message}`);
  process.exitCode = 1;
});
