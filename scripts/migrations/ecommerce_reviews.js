import mysql from "mysql2/promise";
import {
  ECOMMERCE_DATABASE,
  HOST,
  PASSWORD,
  PORT_DB,
  USER,
} from "../../src/config.js";

/**
 * Reseñas / opiniones ecommerce (MVP).
 * Uso: ALLOW_REMOTE_MIGRATE=1 npm run db:migrate:ecommerce-reviews
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

  try {
    if (!(await tableExists("ecom_review_config"))) {
      await cx.query(`
        CREATE TABLE ecom_review_config (
          id_tienda INT NOT NULL,
          activo TINYINT(1) NOT NULL DEFAULT 1,
          allow_producto TINYINT(1) NOT NULL DEFAULT 1,
          allow_sucursal TINYINT(1) NOT NULL DEFAULT 1,
          allow_pedido TINYINT(1) NOT NULL DEFAULT 1,
          allow_general TINYINT(1) NOT NULL DEFAULT 1,
          solo_compradores TINYINT(1) NOT NULL DEFAULT 1,
          moderacion ENUM('auto','manual') NOT NULL DEFAULT 'manual',
          allow_imagenes TINYINT(1) NOT NULL DEFAULT 1,
          max_imagenes INT NOT NULL DEFAULT 5,
          allow_respuestas TINYINT(1) NOT NULL DEFAULT 1,
          solicitar_post_entrega TINYINT(1) NOT NULL DEFAULT 0,
          dias_espera_solicitud INT NOT NULL DEFAULT 3,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id_tienda),
          CONSTRAINT fk_ecom_review_config_tienda
            FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] ecom_review_config");
    } else {
      console.log("[omitido] ecom_review_config");
    }

    await cx.query(`
      INSERT IGNORE INTO ecom_review_config (id_tienda)
      SELECT id_tienda FROM tienda
    `);

    if (!(await tableExists("ecom_review"))) {
      await cx.query(`
        CREATE TABLE ecom_review (
          id_review INT NOT NULL AUTO_INCREMENT,
          id_tienda INT NOT NULL,
          id_cliente INT NOT NULL,
          tipo ENUM('producto','sucursal','pedido','general') NOT NULL,
          id_producto INT NULL,
          id_variante INT NULL,
          id_orden INT NULL,
          id_sucursal INT NULL,
          rating TINYINT NOT NULL,
          titulo VARCHAR(160) NULL,
          comentario TEXT NULL,
          tema_general ENUM(
            'producto','atencion','sucursal','delivery','recojo',
            'ecommerce','pago','sugerencia','otro'
          ) NULL,
          ratings_json JSON NULL,
          compra_verificada TINYINT(1) NOT NULL DEFAULT 0,
          estado ENUM('pendiente','publicada','ocultada','rechazada') NOT NULL DEFAULT 'pendiente',
          nombre_publico VARCHAR(80) NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id_review),
          KEY idx_ecom_review_tienda_tipo (id_tienda, tipo, estado),
          KEY idx_ecom_review_producto (id_producto, estado),
          KEY idx_ecom_review_orden (id_orden),
          KEY idx_ecom_review_cliente (id_tienda, id_cliente),
          CONSTRAINT fk_ecom_review_tienda
            FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda) ON DELETE CASCADE,
          CONSTRAINT fk_ecom_review_cliente
            FOREIGN KEY (id_cliente) REFERENCES ecom_cliente (id_cliente) ON DELETE CASCADE,
          CONSTRAINT chk_ecom_review_rating CHECK (rating BETWEEN 1 AND 5)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] ecom_review");
    } else {
      console.log("[omitido] ecom_review");
    }

    if (!(await tableExists("ecom_review_media"))) {
      await cx.query(`
        CREATE TABLE ecom_review_media (
          id_media INT NOT NULL AUTO_INCREMENT,
          id_review INT NOT NULL,
          id_tienda INT NOT NULL,
          url VARCHAR(500) NOT NULL,
          file_id VARCHAR(120) NULL,
          orden INT NOT NULL DEFAULT 0,
          tipo ENUM('image') NOT NULL DEFAULT 'image',
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id_media),
          KEY idx_ecom_review_media_review (id_review),
          CONSTRAINT fk_ecom_review_media_review
            FOREIGN KEY (id_review) REFERENCES ecom_review (id_review) ON DELETE CASCADE,
          CONSTRAINT fk_ecom_review_media_tienda
            FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] ecom_review_media");
    } else {
      console.log("[omitido] ecom_review_media");
    }

    if (!(await tableExists("ecom_review_reply"))) {
      await cx.query(`
        CREATE TABLE ecom_review_reply (
          id_reply INT NOT NULL AUTO_INCREMENT,
          id_review INT NOT NULL,
          id_tienda INT NOT NULL,
          id_usuario INT NULL,
          cuerpo TEXT NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id_reply),
          UNIQUE KEY uq_ecom_review_reply (id_review),
          CONSTRAINT fk_ecom_review_reply_review
            FOREIGN KEY (id_review) REFERENCES ecom_review (id_review) ON DELETE CASCADE,
          CONSTRAINT fk_ecom_review_reply_tienda
            FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] ecom_review_reply");
    } else {
      console.log("[omitido] ecom_review_reply");
    }

    console.log("Migración ecommerce_reviews OK");
  } finally {
    await cx.end();
  }
};

ejecutar().catch((err) => {
  console.error(err);
  process.exit(1);
});
