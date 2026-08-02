import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * Migra las URLs existentes en `producto.imagen_url` hacia la tabla `producto_imagen`.
 * 
 * Uso: node scripts/migrations/migrate_legacy_imagen_url.js
 */

const HOSTS_LOCALES = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"]);
const esHostLocal = (host) => HOSTS_LOCALES.has(String(host).trim().toLowerCase());

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
    console.log("Iniciando migración de producto.imagen_url a producto_imagen...");
    const [filas] = await cx.query(`
      SELECT p.id_tenant, p.id_producto, p.imagen_url
      FROM producto p
      LEFT JOIN producto_imagen pi ON pi.id_producto = p.id_producto AND pi.id_tenant = p.id_tenant
      WHERE p.imagen_url IS NOT NULL 
        AND TRIM(p.imagen_url) != ''
        AND pi.id_imagen IS NULL
    `);

    console.log(`Encontrados ${filas.length} productos con imagen_url en la tabla producto sin registro en producto_imagen.`);

    let insertados = 0;
    for (const f of filas) {
      const url = f.imagen_url.trim();
      const fileId = url.split("/").pop() || `legacy_${f.id_producto}`;

      await cx.query(`
        INSERT INTO producto_imagen (id_tenant, id_producto, url, file_id, es_principal, orden)
        VALUES (?, ?, ?, ?, 1, 0)
      `, [f.id_tenant, f.id_producto, url, fileId]);

      insertados++;
    }

    console.log(`Migración completada exitosamente: ${insertados} imágenes migradas a producto_imagen.`);
  } finally {
    await cx.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[migrate_legacy_imagen_url] Error: ${error.message}`);
  process.exitCode = 1;
});
