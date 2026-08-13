import mysql from "mysql2/promise";
import {
  ECOMMERCE_DATABASE,
  HOST,
  PASSWORD,
  PORT_DB,
  USER,
} from "../../src/config.js";

/**
 * Consultas de disponibilidad (analítica) + reservas (arquitectura, sin auto-reserva).
 * Uso: ALLOW_REMOTE_MIGRATE=1 npm run db:migrate:ecommerce-disponibilidad
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

  const tableExists = async (tabla) => {
    const [rows] = await cx.query(
      `SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? LIMIT 1`,
      [ECOMMERCE_DATABASE, tabla]
    );
    return rows.length > 0;
  };

  try {
    if (!(await tableExists("ecom_consulta_disponibilidad"))) {
      await cx.query(`
        CREATE TABLE ecom_consulta_disponibilidad (
          id_consulta INT NOT NULL AUTO_INCREMENT,
          id_tienda INT NOT NULL,
          id_producto INT NOT NULL,
          id_variante INT NULL,
          id_sucursal INT NULL,
          cantidad INT NOT NULL DEFAULT 1,
          attrs_snapshot JSON NULL,
          canal VARCHAR(20) NOT NULL DEFAULT 'whatsapp',
          origen VARCHAR(40) NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id_consulta),
          KEY idx_ecom_cons_tienda_fecha (id_tienda, created_at),
          KEY idx_ecom_cons_producto (id_tienda, id_producto),
          KEY idx_ecom_cons_sucursal (id_tienda, id_sucursal),
          CONSTRAINT fk_ecom_cons_tienda FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] ecom_consulta_disponibilidad");
    } else {
      console.log("[omitido] ecom_consulta_disponibilidad");
    }

    if (!(await tableExists("ecom_reserva_disponibilidad"))) {
      await cx.query(`
        CREATE TABLE ecom_reserva_disponibilidad (
          id_reserva INT NOT NULL AUTO_INCREMENT,
          id_tienda INT NOT NULL,
          id_producto INT NOT NULL,
          id_variante INT NULL,
          id_sucursal INT NOT NULL,
          cantidad INT NOT NULL DEFAULT 1,
          estado ENUM('pendiente','activa','expirada','convertida','cancelada') NOT NULL DEFAULT 'pendiente',
          expires_at DATETIME NULL,
          id_usuario_staff INT NULL,
          id_consulta INT NULL,
          notas VARCHAR(500) NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id_reserva),
          KEY idx_ecom_res_tienda_estado (id_tienda, estado),
          KEY idx_ecom_res_expira (expires_at),
          CONSTRAINT fk_ecom_res_tienda FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] ecom_reserva_disponibilidad");
    } else {
      console.log("[omitido] ecom_reserva_disponibilidad");
    }

    console.log("Migración ecommerce_disponibilidad OK");
  } finally {
    await cx.end();
  }
};

ejecutar().catch((err) => {
  console.error(err);
  process.exit(1);
});
