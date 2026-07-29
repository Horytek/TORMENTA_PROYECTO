import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * `empresa.origen_productos` — de dónde viene la mercadería del negocio.
 *
 * Define el caso DOMINANTE del tenant para no preguntarle en cada línea algo
 * que en su negocio nunca cambia. No es excluyente: el origen real viaja en
 * `detalle_nota.origen_costo`, así que una marca que fabrica su línea propia
 * puede igual registrar los accesorios que compra a un proveedor.
 *
 * Valores: ADQUIRIDOS (compra terminado) | PROPIOS (fabrica) | MIXTO (ambos).
 * Los tenants existentes quedan en ADQUIRIDOS, que es el caso más común y el
 * que menos supone: si el negocio fabrica, lo corrige en Configuración.
 */

const HOSTS_LOCALES = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"]);
const esHostLocal = (host) => HOSTS_LOCALES.has(String(host).trim().toLowerCase());

const main = async () => {
  if (!esHostLocal(HOST) && !process.env.ALLOW_REMOTE_MIGRATE) {
    console.error(`Abortado: HOST="${HOST}" no es local. Usa ALLOW_REMOTE_MIGRATE=1 para permitir ejecuciones remotas.`);
    process.exit(1);
  }

  const cx = await mysql.createConnection({
    host: HOST, user: USER, password: PASSWORD, database: DATABASE, port: PORT_DB,
  });

  try {
    const [columnas] = await cx.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'empresa' AND COLUMN_NAME = 'origen_productos'`,
      [DATABASE]
    );

    if (columnas.length === 0) {
      await cx.query(
        `ALTER TABLE empresa ADD COLUMN origen_productos
         ENUM('ADQUIRIDOS','PROPIOS','MIXTO') NOT NULL DEFAULT 'ADQUIRIDOS'
         COMMENT 'Caso dominante del negocio; el origen real va por línea en detalle_nota.origen_costo'
         AFTER moneda`
      );
      console.log("[creado]   empresa.origen_productos");
    } else {
      console.log("[omitido]  empresa.origen_productos ya existe.");
    }

    const [filas] = await cx.query(
      `SELECT origen_productos, COUNT(*) n FROM empresa GROUP BY origen_productos`
    );
    console.log("\n── Empresas por origen ──");
    filas.forEach((f) => console.log(`  ${String(f.origen_productos).padEnd(12)} ${f.n}`));
    console.log("\n  Cada negocio ajusta el suyo desde Configuración.");
  } finally {
    await cx.end();
  }
};

main().catch((error) => {
  console.error("Error en la migración:", error.message);
  process.exit(1);
});
