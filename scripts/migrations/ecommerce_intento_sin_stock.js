import mysql from "mysql2/promise";
import {
  ECOMMERCE_DATABASE,
  HOST,
  PASSWORD,
  PORT_DB,
  USER,
} from "../../src/config.js";

/**
 * Tabla de intentos de compra sin stock (métrica demanda).
 * Uso: ALLOW_REMOTE_MIGRATE=1 npm run db:migrate:ecommerce-intento-stock
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
    port: Number(PORT_DB) || 3306,
  });

  try {
    const [tables] = await cx.query(
      `SELECT 1 FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'ecom_intento_sin_stock' LIMIT 1`,
      [ECOMMERCE_DATABASE]
    );
    if (tables.length) {
      console.log("[omitido] ecom_intento_sin_stock");
    } else {
      await cx.query(`
        CREATE TABLE ecom_intento_sin_stock (
          id_intento INT NOT NULL AUTO_INCREMENT,
          id_tienda INT NOT NULL,
          id_producto INT NOT NULL,
          id_variante INT NULL,
          id_sucursal INT NULL,
          cantidad INT NOT NULL DEFAULT 1,
          origen VARCHAR(40) NULL,
          mensaje VARCHAR(255) NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id_intento),
          KEY idx_intento_tienda_fecha (id_tienda, created_at),
          KEY idx_intento_producto (id_tienda, id_producto),
          CONSTRAINT fk_intento_tienda FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] ecom_intento_sin_stock");
    }
    console.log(`[ok] Migración intento_sin_stock en ${ECOMMERCE_DATABASE}`);
  } finally {
    await cx.end();
  }
};

ejecutar().catch((err) => {
  console.error(err);
  process.exit(1);
});
