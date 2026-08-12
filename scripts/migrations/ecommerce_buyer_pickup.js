import mysql from "mysql2/promise";
import {
  ECOMMERCE_DATABASE,
  HOST,
  PASSWORD,
  PORT_DB,
  USER,
} from "../../src/config.js";

/**
 * Comprador, favoritos, fulfillment retiro presencial + QR.
 * Uso: ALLOW_REMOTE_MIGRATE=1 npm run db:migrate:ecommerce-buyer-pickup
 */

const ejecutar = async () => {
  if (!HOST || !USER) {
    throw new Error("Falta configurar DB_HOST / DB_USERNAME en .env.");
  }
  if (
    !process.env.ALLOW_REMOTE_MIGRATE &&
    !["localhost", "127.0.0.1", "::1"].includes(String(HOST))
  ) {
    throw new Error(
      "Migración remota cancelada. Usa ALLOW_REMOTE_MIGRATE=1 (Railway / proxy)."
    );
  }

  const cx = await mysql.createConnection({
    host: HOST,
    database: ECOMMERCE_DATABASE,
    user: USER,
    password: PASSWORD,
    port: PORT_DB,
    connectTimeout: 15000,
    multipleStatements: true,
  });

  const tableExists = async (tabla) => {
    const [rows] = await cx.query(
      `SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? LIMIT 1`,
      [ECOMMERCE_DATABASE, tabla]
    );
    return rows.length > 0;
  };

  const columnExists = async (tabla, columna) => {
    const [rows] = await cx.query(
      `SELECT 1 FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
      [ECOMMERCE_DATABASE, tabla, columna]
    );
    return rows.length > 0;
  };

  try {
    if (!(await tableExists("ecom_cliente"))) {
      await cx.query(`
        CREATE TABLE ecom_cliente (
          id_cliente INT NOT NULL AUTO_INCREMENT,
          id_tienda INT NOT NULL,
          email VARCHAR(160) NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          nombre VARCHAR(160) NOT NULL,
          telefono VARCHAR(40) NULL,
          activo TINYINT(1) NOT NULL DEFAULT 1,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id_cliente),
          UNIQUE KEY uq_ecom_cliente_tienda_email (id_tienda, email),
          KEY idx_ecom_cliente_tienda (id_tienda, activo),
          CONSTRAINT fk_ecom_cliente_tienda FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] ecom_cliente");
    } else {
      console.log("[omitido] ecom_cliente");
    }

    if (!(await tableExists("ecom_favorito"))) {
      await cx.query(`
        CREATE TABLE ecom_favorito (
          id_favorito INT NOT NULL AUTO_INCREMENT,
          id_tienda INT NOT NULL,
          id_cliente INT NOT NULL,
          id_producto INT NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id_favorito),
          UNIQUE KEY uq_ecom_fav (id_tienda, id_cliente, id_producto),
          KEY idx_ecom_fav_cliente (id_tienda, id_cliente),
          CONSTRAINT fk_ecom_fav_tienda FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda) ON DELETE CASCADE,
          CONSTRAINT fk_ecom_fav_cliente FOREIGN KEY (id_cliente) REFERENCES ecom_cliente (id_cliente) ON DELETE CASCADE,
          CONSTRAINT fk_ecom_fav_producto FOREIGN KEY (id_producto) REFERENCES producto (id_producto) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] ecom_favorito");
    } else {
      console.log("[omitido] ecom_favorito");
    }

    const ordenCols = [
      ["id_cliente", "INT NULL"],
      [
        "estado_fulfillment",
        "ENUM('pendiente_confirmacion','pago_pendiente','pago_confirmado','preparando','listo_recoger','entregado','cancelado') NOT NULL DEFAULT 'pago_pendiente'",
      ],
      ["codigo_retiro", "VARCHAR(16) NULL"],
      ["pickup_token", "VARCHAR(64) NULL"],
      ["pickup_ready_at", "DATETIME NULL"],
      ["delivered_at", "DATETIME NULL"],
      ["delivered_by", "INT NULL"],
      [
        "delivery_method",
        "ENUM('qr_scan','manual_code','admin_panel') NULL",
      ],
      ["pickup_notas", "VARCHAR(500) NULL"],
    ];

    for (const [col, def] of ordenCols) {
      if (!(await columnExists("orden", col))) {
        await cx.query(`ALTER TABLE orden ADD COLUMN ${col} ${def}`);
        console.log(`[alter] orden.${col}`);
      } else {
        console.log(`[omitido] orden.${col}`);
      }
    }

    if (!(await columnExists("orden", "id_cliente"))) {
      // ya manejado arriba
    } else {
      const [fkRows] = await cx.query(
        `SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orden' AND CONSTRAINT_NAME = 'fk_orden_cliente' LIMIT 1`,
        [ECOMMERCE_DATABASE]
      );
      if (fkRows.length === 0) {
        try {
          await cx.query(`
            ALTER TABLE orden
            ADD CONSTRAINT fk_orden_cliente FOREIGN KEY (id_cliente) REFERENCES ecom_cliente (id_cliente) ON DELETE SET NULL
          `);
          console.log("[alter] orden FK id_cliente");
        } catch (err) {
          console.warn("[warn] FK orden.id_cliente:", err.message);
        }
      }
    }

    const [idxToken] = await cx.query(
      `SELECT 1 FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orden' AND INDEX_NAME = 'uq_orden_pickup_token' LIMIT 1`,
      [ECOMMERCE_DATABASE]
    );
    if (idxToken.length === 0) {
      try {
        await cx.query(
          `CREATE UNIQUE INDEX uq_orden_pickup_token ON orden (id_tienda, pickup_token)`
        );
        console.log("[alter] uq_orden_pickup_token");
      } catch (err) {
        console.warn("[warn] uq_orden_pickup_token:", err.message);
      }
    }

    const [idxCodigo] = await cx.query(
      `SELECT 1 FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orden' AND INDEX_NAME = 'uq_orden_codigo_retiro' LIMIT 1`,
      [ECOMMERCE_DATABASE]
    );
    if (idxCodigo.length === 0) {
      try {
        await cx.query(
          `CREATE UNIQUE INDEX uq_orden_codigo_retiro ON orden (id_tienda, codigo_retiro)`
        );
        console.log("[alter] uq_orden_codigo_retiro");
      } catch (err) {
        console.warn("[warn] uq_orden_codigo_retiro:", err.message);
      }
    }

    if (!(await tableExists("ecom_orden_estado_hist"))) {
      await cx.query(`
        CREATE TABLE ecom_orden_estado_hist (
          id_hist INT NOT NULL AUTO_INCREMENT,
          id_orden INT NOT NULL,
          id_tienda INT NOT NULL,
          estado_anterior VARCHAR(40) NULL,
          estado_nuevo VARCHAR(40) NOT NULL,
          id_usuario INT NULL,
          id_sucursal INT NULL,
          notas VARCHAR(500) NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id_hist),
          KEY idx_ecom_hist_orden (id_tienda, id_orden),
          CONSTRAINT fk_ecom_hist_orden FOREIGN KEY (id_orden) REFERENCES orden (id_orden) ON DELETE CASCADE,
          CONSTRAINT fk_ecom_hist_tienda FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] ecom_orden_estado_hist");
    } else {
      console.log("[omitido] ecom_orden_estado_hist");
    }

    console.log("Migración ecommerce_buyer_pickup completada.");
  } finally {
    await cx.end();
  }
};

ejecutar().catch((err) => {
  console.error(err);
  process.exit(1);
});
