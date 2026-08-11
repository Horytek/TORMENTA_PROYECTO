import mysql from "mysql2/promise";
import {
  ECOMMERCE_DATABASE,
  HOST,
  PASSWORD,
  PORT_DB,
  USER,
} from "../../src/config.js";

/**
 * Multisucursal ecommerce: sucursales, variantes, inventario, transferencias.
 * Uso: ALLOW_REMOTE_MIGRATE=1 npm run db:migrate:ecommerce-multisucursal
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
    if (!(await tableExists("ecom_sucursal"))) {
      await cx.query(`
        CREATE TABLE ecom_sucursal (
          id_sucursal INT NOT NULL AUTO_INCREMENT,
          id_tienda INT NOT NULL,
          nombre VARCHAR(120) NOT NULL,
          direccion VARCHAR(500) NOT NULL,
          lat DECIMAL(10,7) NULL,
          lng DECIMAL(10,7) NULL,
          horario_json JSON NULL,
          whatsapp VARCHAR(40) NULL,
          telefono VARCHAR(40) NULL,
          allow_pickup TINYINT(1) NOT NULL DEFAULT 1,
          allow_delivery TINYINT(1) NOT NULL DEFAULT 0,
          es_default TINYINT(1) NOT NULL DEFAULT 0,
          activo TINYINT(1) NOT NULL DEFAULT 1,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id_sucursal),
          UNIQUE KEY uq_ecom_suc_tienda_nombre (id_tienda, nombre),
          KEY idx_ecom_suc_tienda (id_tienda, activo),
          CONSTRAINT fk_ecom_suc_tienda FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] ecom_sucursal");
    } else {
      console.log("[omitido] ecom_sucursal");
    }

    if (!(await tableExists("ecom_variante"))) {
      await cx.query(`
        CREATE TABLE ecom_variante (
          id_variante INT NOT NULL AUTO_INCREMENT,
          id_tienda INT NOT NULL,
          id_producto INT NOT NULL,
          sku VARCHAR(64) NULL,
          talla VARCHAR(32) NULL,
          color VARCHAR(64) NULL,
          attrs_json JSON NULL,
          precio_override DECIMAL(12,2) NULL,
          activo TINYINT(1) NOT NULL DEFAULT 1,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id_variante),
          UNIQUE KEY uq_ecom_var_producto_sku (id_producto, sku),
          KEY idx_ecom_var_tienda (id_tienda),
          CONSTRAINT fk_ecom_var_tienda FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda) ON DELETE CASCADE,
          CONSTRAINT fk_ecom_var_producto FOREIGN KEY (id_producto) REFERENCES producto (id_producto) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] ecom_variante");
    } else {
      console.log("[omitido] ecom_variante");
    }

    if (!(await tableExists("ecom_inventario"))) {
      await cx.query(`
        CREATE TABLE ecom_inventario (
          id_inventario INT NOT NULL AUTO_INCREMENT,
          id_tienda INT NOT NULL,
          id_variante INT NOT NULL,
          id_sucursal INT NOT NULL,
          stock_fisico INT NOT NULL DEFAULT 0,
          reservado INT NOT NULL DEFAULT 0,
          comprometido INT NOT NULL DEFAULT 0,
          en_transito INT NOT NULL DEFAULT 0,
          stock_min INT NOT NULL DEFAULT 0,
          stock_max INT NULL,
          precio_sucursal DECIMAL(12,2) NULL,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id_inventario),
          UNIQUE KEY uq_ecom_inv_var_suc (id_variante, id_sucursal),
          KEY idx_ecom_inv_tienda_suc (id_tienda, id_sucursal),
          CONSTRAINT fk_ecom_inv_tienda FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda) ON DELETE CASCADE,
          CONSTRAINT fk_ecom_inv_variante FOREIGN KEY (id_variante) REFERENCES ecom_variante (id_variante) ON DELETE CASCADE,
          CONSTRAINT fk_ecom_inv_sucursal FOREIGN KEY (id_sucursal) REFERENCES ecom_sucursal (id_sucursal) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] ecom_inventario");
    } else {
      console.log("[omitido] ecom_inventario");
    }

    if (!(await tableExists("ecom_inventario_mov"))) {
      await cx.query(`
        CREATE TABLE ecom_inventario_mov (
          id_mov INT NOT NULL AUTO_INCREMENT,
          id_tienda INT NOT NULL,
          id_variante INT NOT NULL,
          id_sucursal INT NOT NULL,
          tipo ENUM('entrada','salida','reserva','liberacion','venta','transferencia','ajuste') NOT NULL,
          cantidad INT NOT NULL,
          stock_antes INT NULL,
          stock_despues INT NULL,
          id_usuario INT NULL,
          motivo VARCHAR(255) NULL,
          ref_tipo VARCHAR(32) NULL,
          ref_id INT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id_mov),
          KEY idx_ecom_mov_tienda (id_tienda, created_at),
          KEY idx_ecom_mov_variante (id_variante, id_sucursal),
          CONSTRAINT fk_ecom_mov_tienda FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] ecom_inventario_mov");
    } else {
      console.log("[omitido] ecom_inventario_mov");
    }

    if (!(await tableExists("ecom_transferencia"))) {
      await cx.query(`
        CREATE TABLE ecom_transferencia (
          id_transferencia INT NOT NULL AUTO_INCREMENT,
          id_tienda INT NOT NULL,
          id_sucursal_origen INT NOT NULL,
          id_sucursal_destino INT NOT NULL,
          estado ENUM('solicitada','en_transito','recibida','cancelada') NOT NULL DEFAULT 'solicitada',
          notas TEXT NULL,
          id_usuario INT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id_transferencia),
          KEY idx_ecom_trans_tienda (id_tienda, estado),
          CONSTRAINT fk_ecom_trans_tienda FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda) ON DELETE CASCADE,
          CONSTRAINT fk_ecom_trans_origen FOREIGN KEY (id_sucursal_origen) REFERENCES ecom_sucursal (id_sucursal),
          CONSTRAINT fk_ecom_trans_destino FOREIGN KEY (id_sucursal_destino) REFERENCES ecom_sucursal (id_sucursal)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] ecom_transferencia");
    } else {
      console.log("[omitido] ecom_transferencia");
    }

    if (!(await tableExists("ecom_transferencia_linea"))) {
      await cx.query(`
        CREATE TABLE ecom_transferencia_linea (
          id_linea INT NOT NULL AUTO_INCREMENT,
          id_transferencia INT NOT NULL,
          id_variante INT NOT NULL,
          cantidad INT NOT NULL,
          cantidad_recibida INT NOT NULL DEFAULT 0,
          PRIMARY KEY (id_linea),
          KEY idx_ecom_trans_linea (id_transferencia),
          CONSTRAINT fk_ecom_trans_linea FOREIGN KEY (id_transferencia) REFERENCES ecom_transferencia (id_transferencia) ON DELETE CASCADE,
          CONSTRAINT fk_ecom_trans_linea_var FOREIGN KEY (id_variante) REFERENCES ecom_variante (id_variante)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] ecom_transferencia_linea");
    } else {
      console.log("[omitido] ecom_transferencia_linea");
    }

    const alterOrden = [
      ["id_sucursal", "INT NULL"],
      ["fulfillment", "VARCHAR(16) NOT NULL DEFAULT 'pickup'"],
      ["pickup_direccion", "VARCHAR(500) NULL"],
      ["whatsapp_context", "JSON NULL"],
    ];
    for (const [col, def] of alterOrden) {
      if (!(await columnExists("orden", col))) {
        await cx.query(`ALTER TABLE orden ADD COLUMN ${col} ${def}`);
        console.log(`[alter] orden.${col}`);
      }
    }

    if (!(await columnExists("orden_item", "id_variante"))) {
      await cx.query(`ALTER TABLE orden_item ADD COLUMN id_variante INT NULL`);
      console.log("[alter] orden_item.id_variante");
    }

    if (!(await columnExists("tienda", "fulfillment_default"))) {
      await cx.query(
        `ALTER TABLE tienda ADD COLUMN fulfillment_default VARCHAR(16) NOT NULL DEFAULT 'pickup'`
      );
      console.log("[alter] tienda.fulfillment_default");
    }

    console.log("[ok] Migración ecommerce multisucursal completada.");
  } finally {
    await cx.end();
  }
};

ejecutar().catch((err) => {
  console.error("[error]", err.message);
  process.exitCode = 1;
});
