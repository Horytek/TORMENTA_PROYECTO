import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * El nombre de marca, categoría y subcategoría es único GLOBALMENTE, no por
 * tenant. Es un defecto de multi-tenancy con consecuencia directa en ventas:
 *
 *   marca.nom_marca            UNIQUE (nom_marca)
 *   categoria.nom_categoria    UNIQUE (nom_categoria)
 *   sub_categoria.nom_subcat   UNIQUE (nom_subcat)
 *
 * Con eso, si un cliente registra la marca "Adidas" o la categoría "Polos",
 * NINGÚN otro cliente del sistema puede volver a usar ese nombre: recibe un
 * error de duplicado por una fila que no puede ver ni entender. Nunca se
 * notó porque hasta hoy un solo tenant tiene catálogo cargado — el problema
 * aparece con el segundo cliente que venda una marca conocida.
 *
 * También bloquea el catálogo semilla: sembrar "Polos" para 81 tenants
 * fallaría a partir del segundo.
 *
 * Se reemplazan por índices compuestos con `id_tenant` adelante, que además
 * sirven para filtrar por tenant. Verificado antes de escribir esto:
 *  - 0 duplicados de (id_tenant, nombre) en las tres tablas.
 *  - Las FK (`producto.id_marca`, `producto.id_subcategoria`,
 *    `sub_categoria.id_categoria`) apuntan a las PRIMARY KEY, no a estos
 *    índices, así que quitarlos no las rompe.
 *
 * Nota: `id_tenant` es NULLable en estas tablas y hay 1 marca legada con
 * tenant NULL. MySQL considera distinto cada NULL, así que esa fila queda
 * fuera de la restricción — es el comportamiento deseado, no se toca dato
 * histórico.
 *
 * Uso: npm run db:migrate:unicos-tenant
 */

const HOSTS_LOCALES = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"]);
const esHostLocal = (host) => HOSTS_LOCALES.has(String(host).trim().toLowerCase());

const CAMBIOS = [
  { tabla: "marca", columna: "nom_marca", indiceViejo: "nom_marca", indiceNuevo: "uq_marca_tenant" },
  { tabla: "categoria", columna: "nom_categoria", indiceViejo: "nom_categoria", indiceNuevo: "uq_categoria_tenant" },
  { tabla: "sub_categoria", columna: "nom_subcat", indiceViejo: "nom_subcat", indiceNuevo: "uq_subcat_tenant" },
];

const indiceExiste = async (cx, tabla, indice) => {
  const [filas] = await cx.query(
    `SELECT INDEX_NAME FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
    [DATABASE, tabla, indice]
  );
  return filas.length > 0;
};

/** Nadie debe quedar sin poder recrear su nombre: se aborta si hay choques. */
const verificarSinDuplicados = async (cx, { tabla, columna }) => {
  const [filas] = await cx.query(
    `SELECT id_tenant, \`${columna}\` AS nombre, COUNT(*) AS total
     FROM \`${tabla}\` GROUP BY id_tenant, \`${columna}\` HAVING total > 1`
  );
  if (filas.length > 0) {
    const muestra = filas.slice(0, 5).map((f) => `tenant ${f.id_tenant}: "${f.nombre}" ×${f.total}`).join(" · ");
    throw new Error(
      `${tabla} tiene ${filas.length} nombre(s) repetidos dentro del mismo tenant; ` +
      `hay que resolverlos antes de crear el índice. Ejemplos → ${muestra}`
    );
  }
};

const migrar = async (cx) => {
  for (const cambio of CAMBIOS) {
    const { tabla, columna, indiceViejo, indiceNuevo } = cambio;

    if (await indiceExiste(cx, tabla, indiceNuevo)) {
      console.log(`[omitido]  ${tabla}: ${indiceNuevo} ya existe.`);
      continue;
    }

    await verificarSinDuplicados(cx, cambio);

    // Primero se agrega el nuevo y después se quita el viejo: si algo falla en
    // el medio, la tabla queda protegida por los dos y no sin ninguno.
    await cx.query(
      `ALTER TABLE \`${tabla}\` ADD UNIQUE KEY \`${indiceNuevo}\` (\`id_tenant\`, \`${columna}\`)`
    );
    console.log(`[creado]   ${tabla}: UNIQUE (id_tenant, ${columna})`);

    if (await indiceExiste(cx, tabla, indiceViejo)) {
      await cx.query(`ALTER TABLE \`${tabla}\` DROP INDEX \`${indiceViejo}\``);
      console.log(`[quitado]  ${tabla}: UNIQUE global (${columna})`);
    }
  }
};

const ejecutar = async () => {
  if (!HOST || !DATABASE || !USER) {
    throw new Error("Falta configurar la conexión MySQL local en el archivo .env.");
  }
  if (!esHostLocal(HOST)) {
    throw new Error("Migración cancelada: esta versión solo está autorizada para MySQL local.");
  }

  const cx = await mysql.createConnection({
    host: HOST, database: DATABASE, user: USER, password: PASSWORD, port: PORT_DB, connectTimeout: 5000,
  });

  try {
    await migrar(cx);
    console.log("\nListo: los nombres de catálogo ahora son únicos por tenant.");
  } finally {
    await cx.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:migrate:unicos-tenant] ${error.message}`);
  process.exitCode = 1;
});
