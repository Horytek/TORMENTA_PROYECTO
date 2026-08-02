import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * Galería de imágenes de producto (ImageKit).
 *
 * `producto.imagen_url` sigue existiendo como el "cover" — se mantiene en
 * sincronía con la imagen `es_principal` de acá (ver
 * `sincronizarImagenUrlProducto` en `productoImagenRepository.js`) para que
 * nada de lo que ya lee esa columna (ej. el catálogo público) se rompa.
 *
 * `id_sku` queda reservado para imagen por variante — sin uso en v1, las
 * imágenes son a nivel de producto.
 *
 * Uso: npm run db:migrate:producto-imagen
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
    throw new Error("Migración cancelada: esta versión solo está autorizada para MySQL local (o establece ALLOW_REMOTE_MIGRATE=1).");
  }

  const cx = await mysql.createConnection({
    host: HOST, database: DATABASE, user: USER, password: PASSWORD, port: PORT_DB, connectTimeout: 5000,
  });

  try {
    if (await existeTabla(cx, "producto_imagen")) {
      console.log("[omitido] producto_imagen ya existía.");
    } else {
      await cx.query(`
        CREATE TABLE producto_imagen (
          id_imagen INT NOT NULL AUTO_INCREMENT,
          id_tenant INT NOT NULL,
          id_producto INT NOT NULL,
          id_sku INT NULL COMMENT 'Reservado para imagen por variante — sin uso en v1',
          url VARCHAR(500) NOT NULL,
          file_id VARCHAR(100) NOT NULL COMMENT 'fileId de ImageKit, necesario para borrar el archivo remoto',
          es_principal TINYINT(1) NOT NULL DEFAULT 0,
          orden INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id_imagen),
          KEY idx_producto_imagen_producto (id_tenant, id_producto, orden),
          KEY idx_producto_imagen_sku (id_tenant, id_sku)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);
      console.log("[creado] producto_imagen.");
    }
  } finally {
    await cx.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:migrate:producto-imagen] ${error.message}`);
  process.exitCode = 1;
});
