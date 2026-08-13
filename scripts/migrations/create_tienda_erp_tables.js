import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * Tienda nativa ERP (db_tormenta): config, compradores, pedidos, cupones,
 * envíos, reseñas, favoritos, consultas WA.
 *
 * Uso: npm run db:migrate:tienda-erp
 * Remoto: ALLOW_REMOTE_MIGRATE=1 npm run db:migrate:tienda-erp
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
    // ── Flags en producto ──────────────────────────────────────────────
    await addColumnIfMissing(
      "producto",
      "visible_tienda",
      `visible_tienda TINYINT(1) NOT NULL DEFAULT 1
       COMMENT '1 = visible en tienda pública ERP'`
    );
    await addColumnIfMissing(
      "producto",
      "destacado_tienda",
      `destacado_tienda TINYINT(1) NOT NULL DEFAULT 0
       COMMENT '1 = destacado en home de tienda'`
    );
    await addColumnIfMissing(
      "producto",
      "slug_tienda",
      `slug_tienda VARCHAR(180) NULL
       COMMENT 'Slug público opcional para PDP'`
    );

    // ── cliente: email/teléfono para compradores web ───────────────────
    await addColumnIfMissing("cliente", "email", `email VARCHAR(160) NULL`);
    await addColumnIfMissing("cliente", "telefono", `telefono VARCHAR(30) NULL`);

    // ── tienda_config ──────────────────────────────────────────────────
    if (!(await tableExists("tienda_config"))) {
      await cx.query(`
        CREATE TABLE tienda_config (
          id_tenant INT NOT NULL,
          activo TINYINT(1) NOT NULL DEFAULT 0,
          slug VARCHAR(80) NOT NULL,
          nombre_publico VARCHAR(160) NULL,
          whatsapp VARCHAR(30) NULL,
          color_primario VARCHAR(20) NULL,
          color_acento VARCHAR(20) NULL,
          banner_url VARCHAR(500) NULL,
          logo_url VARCHAR(500) NULL,
          mensaje_bienvenida TEXT NULL,
          checkout_habilitado TINYINT(1) NOT NULL DEFAULT 1,
          emitir_cpe TINYINT(1) NOT NULL DEFAULT 0
            COMMENT '0 = venta sin CPE automático (recomendado)',
          stock_bajo_umbral INT NOT NULL DEFAULT 5,
          mp_public_key VARCHAR(120) NULL,
          mp_access_token_enc TEXT NULL,
          mp_modo ENUM('test','prod') NOT NULL DEFAULT 'test',
          theme_json JSON NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id_tenant),
          UNIQUE KEY uq_tienda_slug (slug)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado]  tienda_config");
    } else {
      console.log("[omitido] tienda_config");
    }

    // ── tienda_comprador ───────────────────────────────────────────────
    if (!(await tableExists("tienda_comprador"))) {
      await cx.query(`
        CREATE TABLE tienda_comprador (
          id_comprador INT NOT NULL AUTO_INCREMENT,
          id_tenant INT NOT NULL,
          id_cliente INT NULL,
          email VARCHAR(160) NOT NULL,
          password_hash VARCHAR(100) NOT NULL,
          nombres VARCHAR(120) NOT NULL,
          apellidos VARCHAR(120) NULL,
          telefono VARCHAR(30) NULL,
          documento VARCHAR(20) NULL,
          estado TINYINT(1) NOT NULL DEFAULT 1,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id_comprador),
          UNIQUE KEY uq_tienda_comprador_email (id_tenant, email),
          KEY idx_tienda_comprador_cliente (id_tenant, id_cliente)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado]  tienda_comprador");
    } else {
      console.log("[omitido] tienda_comprador");
    }

    // ── tienda_favorito ────────────────────────────────────────────────
    if (!(await tableExists("tienda_favorito"))) {
      await cx.query(`
        CREATE TABLE tienda_favorito (
          id_favorito INT NOT NULL AUTO_INCREMENT,
          id_tenant INT NOT NULL,
          id_comprador INT NOT NULL,
          id_producto INT NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id_favorito),
          UNIQUE KEY uq_tienda_fav (id_tenant, id_comprador, id_producto),
          KEY idx_tienda_fav_comprador (id_tenant, id_comprador)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado]  tienda_favorito");
    } else {
      console.log("[omitido] tienda_favorito");
    }

    // ── tienda_pedido ──────────────────────────────────────────────────
    if (!(await tableExists("tienda_pedido"))) {
      await cx.query(`
        CREATE TABLE tienda_pedido (
          id_pedido INT NOT NULL AUTO_INCREMENT,
          id_tenant INT NOT NULL,
          codigo VARCHAR(32) NOT NULL,
          id_comprador INT NULL,
          id_cliente INT NULL,
          id_sucursal INT NULL,
          id_almacen INT NULL,
          id_venta INT NULL,
          estado ENUM(
            'pendiente_pago','pagado','preparando','listo_retiro',
            'enviado','entregado','cancelado','expirado'
          ) NOT NULL DEFAULT 'pendiente_pago',
          metodo_entrega ENUM('retiro','delivery','consulta') NOT NULL DEFAULT 'retiro',
          direccion_entrega TEXT NULL,
          distrito VARCHAR(80) NULL,
          referencia_entrega VARCHAR(255) NULL,
          costo_envio DECIMAL(10,2) NOT NULL DEFAULT 0,
          subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
          descuento DECIMAL(12,2) NOT NULL DEFAULT 0,
          total DECIMAL(12,2) NOT NULL DEFAULT 0,
          cupon_codigo VARCHAR(40) NULL,
          mp_preference_id VARCHAR(80) NULL,
          mp_payment_id VARCHAR(80) NULL,
          mp_status VARCHAR(40) NULL,
          idempotency_key VARCHAR(64) NOT NULL,
          pickup_qr_token VARCHAR(64) NULL,
          notas TEXT NULL,
          expires_at DATETIME NULL,
          paid_at DATETIME NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id_pedido),
          UNIQUE KEY uq_tienda_pedido_codigo (id_tenant, codigo),
          UNIQUE KEY uq_tienda_pedido_idem (id_tenant, idempotency_key),
          KEY idx_tienda_pedido_estado (id_tenant, estado),
          KEY idx_tienda_pedido_comprador (id_tenant, id_comprador)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado]  tienda_pedido");
    } else {
      console.log("[omitido] tienda_pedido");
    }

    if (!(await tableExists("tienda_pedido_item"))) {
      await cx.query(`
        CREATE TABLE tienda_pedido_item (
          id_item INT NOT NULL AUTO_INCREMENT,
          id_pedido INT NOT NULL,
          id_tenant INT NOT NULL,
          id_producto INT NOT NULL,
          id_sku INT NULL,
          descripcion VARCHAR(255) NOT NULL,
          cantidad INT NOT NULL,
          precio_unitario DECIMAL(12,2) NOT NULL,
          descuento DECIMAL(12,2) NOT NULL DEFAULT 0,
          total DECIMAL(12,2) NOT NULL,
          attrs_snapshot JSON NULL,
          PRIMARY KEY (id_item),
          KEY idx_tienda_item_pedido (id_pedido),
          KEY idx_tienda_item_tenant (id_tenant, id_producto)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado]  tienda_pedido_item");
    } else {
      console.log("[omitido] tienda_pedido_item");
    }

    // ── reservas de stock para pedidos web ─────────────────────────────
    if (!(await tableExists("tienda_reserva_stock"))) {
      await cx.query(`
        CREATE TABLE tienda_reserva_stock (
          id_reserva INT NOT NULL AUTO_INCREMENT,
          id_tenant INT NOT NULL,
          id_pedido INT NOT NULL,
          id_sku INT NOT NULL,
          id_almacen INT NOT NULL,
          cantidad INT NOT NULL,
          estado ENUM('activa','liberada','convertida') NOT NULL DEFAULT 'activa',
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id_reserva),
          KEY idx_tienda_res_pedido (id_tenant, id_pedido),
          KEY idx_tienda_res_sku (id_tenant, id_sku, id_almacen, estado)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado]  tienda_reserva_stock");
    } else {
      console.log("[omitido] tienda_reserva_stock");
    }

    // ── cupones ────────────────────────────────────────────────────────
    if (!(await tableExists("tienda_cupon"))) {
      await cx.query(`
        CREATE TABLE tienda_cupon (
          id_cupon INT NOT NULL AUTO_INCREMENT,
          id_tenant INT NOT NULL,
          codigo VARCHAR(40) NOT NULL,
          tipo ENUM('porcentaje','monto') NOT NULL DEFAULT 'porcentaje',
          valor DECIMAL(12,2) NOT NULL,
          minimo_compra DECIMAL(12,2) NOT NULL DEFAULT 0,
          usos_max INT NULL,
          usos_actual INT NOT NULL DEFAULT 0,
          activo TINYINT(1) NOT NULL DEFAULT 1,
          vigencia_desde DATETIME NULL,
          vigencia_hasta DATETIME NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id_cupon),
          UNIQUE KEY uq_tienda_cupon (id_tenant, codigo)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado]  tienda_cupon");
    } else {
      console.log("[omitido] tienda_cupon");
    }

    if (!(await tableExists("tienda_cupon_redencion"))) {
      await cx.query(`
        CREATE TABLE tienda_cupon_redencion (
          id_redencion INT NOT NULL AUTO_INCREMENT,
          id_tenant INT NOT NULL,
          id_cupon INT NOT NULL,
          id_pedido INT NOT NULL,
          id_comprador INT NULL,
          monto_descuento DECIMAL(12,2) NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id_redencion),
          UNIQUE KEY uq_tienda_cupon_pedido (id_tenant, id_pedido)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado]  tienda_cupon_redencion");
    } else {
      console.log("[omitido] tienda_cupon_redencion");
    }

    // ── entrega / zonas ────────────────────────────────────────────────
    if (!(await tableExists("tienda_entrega_config"))) {
      await cx.query(`
        CREATE TABLE tienda_entrega_config (
          id_tenant INT NOT NULL,
          retiro_activo TINYINT(1) NOT NULL DEFAULT 1,
          delivery_activo TINYINT(1) NOT NULL DEFAULT 0,
          costo_default DECIMAL(10,2) NOT NULL DEFAULT 0,
          tiempo_preparacion_min INT NOT NULL DEFAULT 60,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id_tenant)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado]  tienda_entrega_config");
    } else {
      console.log("[omitido] tienda_entrega_config");
    }

    if (!(await tableExists("tienda_delivery_zona"))) {
      await cx.query(`
        CREATE TABLE tienda_delivery_zona (
          id_zona INT NOT NULL AUTO_INCREMENT,
          id_tenant INT NOT NULL,
          nombre VARCHAR(120) NOT NULL,
          distritos JSON NULL COMMENT 'Array de nombres de distrito',
          costo DECIMAL(10,2) NOT NULL DEFAULT 0,
          activo TINYINT(1) NOT NULL DEFAULT 1,
          orden INT NOT NULL DEFAULT 0,
          PRIMARY KEY (id_zona),
          KEY idx_tienda_zona_tenant (id_tenant, activo)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado]  tienda_delivery_zona");
    } else {
      console.log("[omitido] tienda_delivery_zona");
    }

    // ── reseñas ────────────────────────────────────────────────────────
    if (!(await tableExists("tienda_resena_config"))) {
      await cx.query(`
        CREATE TABLE tienda_resena_config (
          id_tenant INT NOT NULL,
          habilitado TINYINT(1) NOT NULL DEFAULT 1,
          requiere_compra TINYINT(1) NOT NULL DEFAULT 1,
          moderacion TINYINT(1) NOT NULL DEFAULT 1,
          PRIMARY KEY (id_tenant)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado]  tienda_resena_config");
    } else {
      console.log("[omitido] tienda_resena_config");
    }

    if (!(await tableExists("tienda_resena"))) {
      await cx.query(`
        CREATE TABLE tienda_resena (
          id_resena INT NOT NULL AUTO_INCREMENT,
          id_tenant INT NOT NULL,
          id_producto INT NOT NULL,
          id_comprador INT NOT NULL,
          id_pedido INT NULL,
          rating TINYINT NOT NULL,
          titulo VARCHAR(160) NULL,
          cuerpo TEXT NULL,
          estado ENUM('pendiente','aprobada','rechazada','oculta') NOT NULL DEFAULT 'pendiente',
          respuesta_comercio TEXT NULL,
          responded_at DATETIME NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id_resena),
          KEY idx_tienda_resena_prod (id_tenant, id_producto, estado),
          KEY idx_tienda_resena_comp (id_tenant, id_comprador)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado]  tienda_resena");
    } else {
      console.log("[omitido] tienda_resena");
    }

    // ── consultas WhatsApp ─────────────────────────────────────────────
    if (!(await tableExists("tienda_consulta_wa"))) {
      await cx.query(`
        CREATE TABLE tienda_consulta_wa (
          id_consulta INT NOT NULL AUTO_INCREMENT,
          id_tenant INT NOT NULL,
          id_producto INT NULL,
          id_sku INT NULL,
          id_sucursal INT NULL,
          origen VARCHAR(40) NULL,
          attrs_snapshot JSON NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id_consulta),
          KEY idx_tienda_wa_tenant (id_tenant, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado]  tienda_consulta_wa");
    } else {
      console.log("[omitido] tienda_consulta_wa");
    }

    // ── banners / promos ───────────────────────────────────────────────
    if (!(await tableExists("tienda_banner"))) {
      await cx.query(`
        CREATE TABLE tienda_banner (
          id_banner INT NOT NULL AUTO_INCREMENT,
          id_tenant INT NOT NULL,
          titulo VARCHAR(160) NOT NULL,
          subtitulo VARCHAR(255) NULL,
          imagen_url VARCHAR(500) NULL,
          link_url VARCHAR(500) NULL,
          activo TINYINT(1) NOT NULL DEFAULT 1,
          orden INT NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id_banner),
          KEY idx_tienda_banner (id_tenant, activo, orden)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado]  tienda_banner");
    } else {
      console.log("[omitido] tienda_banner");
    }

    console.log("Migración tienda ERP completada.");
  } finally {
    await cx.end();
  }
};

main().catch((error) => {
  console.error("Error en la migración:", error.message);
  process.exit(1);
});
