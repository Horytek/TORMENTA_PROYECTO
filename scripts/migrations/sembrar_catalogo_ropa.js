import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";
import { sembrarCatalogoRopa } from "../../src/services/onboarding/catalogoSemilla.js";

/**
 * Siembra el catálogo de ropa en los tenants que ya existen y quedaron vacíos.
 *
 * De 82 tenants, 81 tienen 0 marcas, 0 categorías y 0 subcategorías: entraron
 * al sistema, se encontraron con que no podían registrar ni una prenda, y se
 * fueron. Este script les deja el catálogo listo por si vuelven, y sirve de
 * red para cualquier tenant creado antes de que el enganche automático
 * existiera.
 *
 * 🔴 Solo toca tenants con CERO categorías. El que ya cargó su catálogo se
 * salta siempre, así que correrlo dos veces no cambia nada.
 *
 * Requiere haber corrido antes `npm run db:migrate:unicos-tenant`: con el
 * UNIQUE global de `nom_categoria` este script fallaría en el segundo tenant.
 *
 * Uso: npm run db:seed:catalogo-ropa
 */

const HOSTS_LOCALES = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"]);
const esHostLocal = (host) => HOSTS_LOCALES.has(String(host).trim().toLowerCase());

const indiceExiste = async (cx, tabla, indice) => {
  const [filas] = await cx.query(
    `SELECT INDEX_NAME FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
    [DATABASE, tabla, indice]
  );
  return filas.length > 0;
};

const ejecutar = async () => {
  if (!HOST || !DATABASE || !USER) {
    throw new Error("Falta configurar la conexión MySQL local en el archivo .env.");
  }
  if (!esHostLocal(HOST)) {
    throw new Error("Siembra cancelada: esta versión solo está autorizada para MySQL local.");
  }

  const cx = await mysql.createConnection({
    host: HOST, database: DATABASE, user: USER, password: PASSWORD, port: PORT_DB, connectTimeout: 5000,
  });

  try {
    if (!(await indiceExiste(cx, "categoria", "uq_categoria_tenant"))) {
      throw new Error(
        "Falta el índice único por tenant. Corré primero: npm run db:migrate:unicos-tenant"
      );
    }

    const [tenants] = await cx.query("SELECT id_tenant FROM tenant ORDER BY id_tenant");
    let sembrados = 0;
    let omitidos = 0;

    for (const { id_tenant } of tenants) {
      // Un tenant por transacción: si uno falla, los ya sembrados se quedan
      // sembrados y este script se puede volver a correr sin repetirlos.
      await cx.beginTransaction();
      try {
        const r = await sembrarCatalogoRopa(cx, { id_tenant });
        await cx.commit();
        if (r.sembrado) {
          sembrados += 1;
          console.log(`[sembrado] tenant ${id_tenant}: ${r.categorias} categorías, ${r.subcategorias} subcategorías, ${r.valores} valores de atributo`);
        } else {
          omitidos += 1;
        }
      } catch (error) {
        await cx.rollback();
        console.error(`[error]    tenant ${id_tenant}: ${error.message}`);
      }
    }

    console.log(`\n${sembrados} tenant(s) sembrados · ${omitidos} omitidos por tener catálogo propio.`);
  } finally {
    await cx.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:seed:catalogo-ropa] ${error.message}`);
  process.exitCode = 1;
});
