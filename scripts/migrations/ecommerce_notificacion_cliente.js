import mysql from "mysql2/promise";
import {
  ECOMMERCE_DATABASE,
  HOST,
  PASSWORD,
  PORT_DB,
  USER,
} from "../../src/config.js";

/**
 * Inbox in-app del comprador (seguimiento de solicitudes de disponibilidad).
 * Uso: ALLOW_REMOTE_MIGRATE=1 npm run db:migrate:ecommerce-notif-cliente
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
  });

  try {
    const [tables] = await cx.query(
      `SELECT 1 FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'ecom_notificacion_cliente' LIMIT 1`,
      [ECOMMERCE_DATABASE]
    );
    if (tables.length) {
      console.log("[omitido] ecom_notificacion_cliente");
    } else {
      await cx.query(`
        CREATE TABLE ecom_notificacion_cliente (
          id_notificacion INT NOT NULL AUTO_INCREMENT,
          id_tienda INT NOT NULL,
          id_cliente INT NOT NULL,
          tipo ENUM(
            'solicitud_aprobada',
            'solicitud_rechazada',
            'solicitud_expirada',
            'solicitud_en_revision',
            'solicitud_cancelada'
          ) NOT NULL,
          titulo VARCHAR(160) NOT NULL,
          cuerpo VARCHAR(500) NULL,
          ref_tipo VARCHAR(32) NOT NULL DEFAULT 'solicitud',
          ref_id INT NOT NULL,
          payload_json JSON NULL,
          leida_at DATETIME NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id_notificacion),
          KEY idx_ecom_notif_cliente (id_tienda, id_cliente, created_at),
          KEY idx_ecom_notif_unread (id_tienda, id_cliente, leida_at),
          CONSTRAINT fk_ecom_notif_tienda FOREIGN KEY (id_tienda)
            REFERENCES tienda (id_tienda) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] ecom_notificacion_cliente");
    }
    console.log("Migración ecommerce_notificacion_cliente OK");
  } finally {
    await cx.end();
  }
};

ejecutar().catch((err) => {
  console.error(err);
  process.exit(1);
});
