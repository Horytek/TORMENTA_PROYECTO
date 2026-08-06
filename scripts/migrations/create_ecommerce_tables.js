import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * Módulo Ecommerce multi-tenant (db_tormenta).
 * Aislamiento por id_tenant; no usa tesis_db ni catalog-express.
 *
 * Uso: npm run db:migrate:ecommerce
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

const ejecutar = async () => {
  if (!HOST || !DATABASE || !USER) {
    throw new Error("Falta configurar la conexión MySQL local en el archivo .env.");
  }
  if (!esHostLocal(HOST) && !process.env.ALLOW_REMOTE_MIGRATE) {
    throw new Error(
      "Migración cancelada: solo MySQL local (o establece ALLOW_REMOTE_MIGRATE=1)."
    );
  }

  const cx = await mysql.createConnection({
    host: HOST,
    database: DATABASE,
    user: USER,
    password: PASSWORD,
    port: PORT_DB,
    connectTimeout: 5000,
  });

  try {
    if (await existeTabla(cx, "ecommerce_plan")) {
      console.log("[omitido] ecommerce_plan ya existía.");
    } else {
      await cx.query(`
        CREATE TABLE ecommerce_plan (
          id_plan INT NOT NULL,
          codigo VARCHAR(32) NOT NULL,
          nombre VARCHAR(64) NOT NULL,
          precio_mensual DECIMAL(12,2) NOT NULL,
          moneda CHAR(3) NOT NULL DEFAULT 'PEN',
          descripcion VARCHAR(255) NULL,
          activo TINYINT(1) NOT NULL DEFAULT 1,
          PRIMARY KEY (id_plan),
          UNIQUE KEY uq_ecom_plan_codigo (codigo)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);
      await cx.query(`
        INSERT INTO ecommerce_plan (id_plan, codigo, nombre, precio_mensual, moneda, descripcion) VALUES
          (1, 'starter', 'Starter', 79.00, 'PEN', 'Tienda online con catálogo, carrito y Mercado Pago'),
          (2, 'pro', 'Pro', 129.00, 'PEN', 'Starter + más productos y soporte prioritario')
      `);
      console.log("[creado] ecommerce_plan + seeds Starter/Pro.");
    }

    if (await existeTabla(cx, "ecommerce_tienda")) {
      console.log("[omitido] ecommerce_tienda ya existía.");
    } else {
      await cx.query(`
        CREATE TABLE ecommerce_tienda (
          id_tienda INT NOT NULL AUTO_INCREMENT,
          id_tenant INT NOT NULL,
          id_plan INT NOT NULL,
          slug VARCHAR(80) NOT NULL,
          nombre VARCHAR(160) NOT NULL,
          email VARCHAR(160) NOT NULL,
          telefono VARCHAR(40) NULL,
          estado ENUM('pending','active','suspended') NOT NULL DEFAULT 'pending',
          color_primario VARCHAR(16) NULL DEFAULT '#0E7C7B',
          logo_url VARCHAR(512) NULL,
          descripcion TEXT NULL,
          fecha_pago DATE NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id_tienda),
          UNIQUE KEY uq_ecom_tienda_tenant (id_tenant),
          UNIQUE KEY uq_ecom_tienda_slug (slug),
          UNIQUE KEY uq_ecom_tienda_email (email),
          KEY idx_ecom_tienda_estado (estado),
          CONSTRAINT fk_ecom_tienda_plan FOREIGN KEY (id_plan) REFERENCES ecommerce_plan (id_plan)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);
      console.log("[creado] ecommerce_tienda.");
    }

    if (await existeTabla(cx, "ecommerce_usuario")) {
      console.log("[omitido] ecommerce_usuario ya existía.");
    } else {
      await cx.query(`
        CREATE TABLE ecommerce_usuario (
          id_usuario INT NOT NULL AUTO_INCREMENT,
          id_tenant INT NOT NULL,
          usua VARCHAR(80) NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          clave_acceso VARCHAR(64) NULL,
          email VARCHAR(160) NOT NULL,
          nombre VARCHAR(120) NULL,
          rol ENUM('admin') NOT NULL DEFAULT 'admin',
          estado TINYINT(1) NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id_usuario),
          UNIQUE KEY uq_ecom_usuario_usua (usua),
          UNIQUE KEY uq_ecom_usuario_email (email),
          KEY idx_ecom_usuario_tenant (id_tenant)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);
      console.log("[creado] ecommerce_usuario.");
    }

    if (await existeTabla(cx, "ecommerce_producto")) {
      console.log("[omitido] ecommerce_producto ya existía.");
    } else {
      await cx.query(`
        CREATE TABLE ecommerce_producto (
          id_producto INT NOT NULL AUTO_INCREMENT,
          id_tenant INT NOT NULL,
          nombre VARCHAR(200) NOT NULL,
          descripcion TEXT NULL,
          precio DECIMAL(12,2) NOT NULL DEFAULT 0,
          stock INT NOT NULL DEFAULT 0,
          stock_min INT NOT NULL DEFAULT 5,
          activo TINYINT(1) NOT NULL DEFAULT 1,
          sku VARCHAR(64) NULL,
          attrs_json JSON NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id_producto),
          KEY idx_ecom_prod_tenant (id_tenant, activo),
          KEY idx_ecom_prod_nombre (id_tenant, nombre)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);
      console.log("[creado] ecommerce_producto.");
    }

    if (await existeTabla(cx, "ecommerce_producto_imagen")) {
      console.log("[omitido] ecommerce_producto_imagen ya existía.");
    } else {
      await cx.query(`
        CREATE TABLE ecommerce_producto_imagen (
          id_imagen INT NOT NULL AUTO_INCREMENT,
          id_tenant INT NOT NULL,
          id_producto INT NOT NULL,
          url VARCHAR(512) NOT NULL,
          file_id VARCHAR(128) NULL,
          orden INT NOT NULL DEFAULT 0,
          es_principal TINYINT(1) NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id_imagen),
          KEY idx_ecom_img_prod (id_tenant, id_producto),
          CONSTRAINT fk_ecom_img_prod FOREIGN KEY (id_producto) REFERENCES ecommerce_producto (id_producto) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);
      console.log("[creado] ecommerce_producto_imagen.");
    }

    if (await existeTabla(cx, "ecommerce_mp_credenciales")) {
      console.log("[omitido] ecommerce_mp_credenciales ya existía.");
    } else {
      await cx.query(`
        CREATE TABLE ecommerce_mp_credenciales (
          id_tenant INT NOT NULL,
          public_key VARCHAR(255) NOT NULL,
          access_token_enc TEXT NOT NULL,
          modo ENUM('test','prod') NOT NULL DEFAULT 'test',
          conectado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id_tenant)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);
      console.log("[creado] ecommerce_mp_credenciales.");
    }

    if (await existeTabla(cx, "ecommerce_orden")) {
      console.log("[omitido] ecommerce_orden ya existía.");
    } else {
      await cx.query(`
        CREATE TABLE ecommerce_orden (
          id_orden INT NOT NULL AUTO_INCREMENT,
          id_tenant INT NOT NULL,
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
          UNIQUE KEY uq_ecom_orden_codigo (codigo),
          UNIQUE KEY uq_ecom_orden_payment (mp_payment_id),
          KEY idx_ecom_orden_tenant (id_tenant, estado),
          KEY idx_ecom_orden_pref (mp_preference_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);
      console.log("[creado] ecommerce_orden.");
    }

    if (await existeTabla(cx, "ecommerce_orden_detalle")) {
      console.log("[omitido] ecommerce_orden_detalle ya existía.");
    } else {
      await cx.query(`
        CREATE TABLE ecommerce_orden_detalle (
          id_detalle INT NOT NULL AUTO_INCREMENT,
          id_orden INT NOT NULL,
          id_tenant INT NOT NULL,
          id_producto INT NOT NULL,
          nombre_snapshot VARCHAR(200) NOT NULL,
          cantidad INT NOT NULL,
          precio_unitario DECIMAL(12,2) NOT NULL,
          PRIMARY KEY (id_detalle),
          KEY idx_ecom_det_orden (id_orden),
          KEY idx_ecom_det_tenant (id_tenant),
          CONSTRAINT fk_ecom_det_orden FOREIGN KEY (id_orden) REFERENCES ecommerce_orden (id_orden) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);
      console.log("[creado] ecommerce_orden_detalle.");
    }

    if (await existeTabla(cx, "ecommerce_pago_saas")) {
      console.log("[omitido] ecommerce_pago_saas ya existía.");
    } else {
      await cx.query(`
        CREATE TABLE ecommerce_pago_saas (
          id INT NOT NULL AUTO_INCREMENT,
          id_tienda INT NOT NULL,
          id_tenant INT NOT NULL,
          mp_payment_id VARCHAR(64) NOT NULL,
          mp_preference_id VARCHAR(128) NULL,
          status VARCHAR(32) NOT NULL,
          amount DECIMAL(12,2) NULL,
          external_reference VARCHAR(160) NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uq_ecom_saas_payment (mp_payment_id),
          KEY idx_ecom_saas_tienda (id_tienda)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);
      console.log("[creado] ecommerce_pago_saas.");
    }

    console.log("[ok] Migración ecommerce completada.");
  } finally {
    await cx.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:migrate:ecommerce] ${error.message}`);
  process.exitCode = 1;
});
