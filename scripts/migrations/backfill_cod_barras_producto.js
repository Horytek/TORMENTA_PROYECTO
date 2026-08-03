import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * `ProductForm.tsx` autogenera `cod_barras` (`T{tenant}-P{id}`) para productos
 * nuevos desde hace tiempo, pero los productos creados ANTES de eso se
 * quedaron con `producto.cod_barras` NULL — y por transitividad, ninguno de
 * sus SKUs pudo recibir código en `backfill_cod_barras_sku.js` (que deriva
 * del código del padre). Esta migración rellena esos productos viejos con el
 * mismo formato que ya usa el frontend, para no introducir un segundo
 * esquema de códigos.
 *
 * Uso: npm run db:migrate:cod-barras-producto
 * (Correr backfill_cod_barras_sku.js DESPUÉS para que los SKUs hereden el código nuevo.)
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

  const connection = await mysql.createConnection({
    host: HOST, database: DATABASE, user: USER, password: PASSWORD, port: PORT_DB, connectTimeout: 5000,
  });

  try {
    const [result] = await connection.query(`
      UPDATE producto
      SET cod_barras = CONCAT('T', id_tenant, '-P', LPAD(id_producto, 8, '0'))
      WHERE cod_barras IS NULL
    `);
    console.log(`[backfill] ${result.affectedRows} producto(s) actualizados con código de barras autogenerado.`);
  } finally {
    await connection.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:migrate:cod-barras-producto] ${error.message}`);
  process.exitCode = 1;
});
