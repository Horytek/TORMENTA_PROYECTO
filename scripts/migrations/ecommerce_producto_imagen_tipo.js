import mysql from "mysql2/promise";
import {
  ECOMMERCE_DATABASE,
  HOST,
  PASSWORD,
  PORT_DB,
  USER,
} from "../../src/config.js";

/**
 * Añade tipo (galeria | informativa) a producto_imagen.
 * Uso: ALLOW_REMOTE_MIGRATE=1 node scripts/migrations/ecommerce_producto_imagen_tipo.js
 *      (o sin ALLOW si HOST es localhost)
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
    multipleStatements: true,
  });

  try {
    const [cols] = await cx.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'producto_imagen' AND COLUMN_NAME = 'tipo'`,
      [ECOMMERCE_DATABASE]
    );
    if (cols.length) {
      console.log("[omitido] producto_imagen.tipo ya existe");
    } else {
      await cx.query(`
        ALTER TABLE producto_imagen
          ADD COLUMN tipo ENUM('galeria','informativa') NOT NULL DEFAULT 'galeria'
          AFTER es_principal
      `);
      console.log("[creado] producto_imagen.tipo");
    }

    await cx.query(`
      UPDATE producto_imagen SET tipo = 'galeria' WHERE tipo IS NULL OR tipo = ''
    `).catch(() => {});

    console.log(`[ok] Migración tipo imagen en ${ECOMMERCE_DATABASE}`);
  } finally {
    await cx.end();
  }
};

ejecutar().catch((err) => {
  console.error(err);
  process.exit(1);
});
