import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * Retira tablas y columnas que ya no participan de ningún flujo.
 *
 * Cada candidata se verificó con dos criterios ANTES de entrar a esta lista:
 *  1. Cero referencias SQL en `src/` y `scripts/` (FROM/INTO/UPDATE/JOIN).
 *  2. Se vuelca su contenido antes de borrar, para que nada desaparezca en
 *     silencio si resultara que alguien la usaba de otra forma.
 *
 * Qué NO se toca, aunque parezca muerto:
 *  - `inventario` (0 filas) → tiene 60 referencias SQL en el código. Está vacía
 *    pero VIVA: hay consultas leyendo una tabla sin datos, y eso es un problema
 *    aparte que hay que resolver mirando el código, no borrando la tabla.
 *  - `permission_action_catalog` (0 filas) → 7 referencias en
 *    actionCatalog.controller.js. Es funcionalidad de permisos activa.
 *  - `producto_atributo` / `producto_atributo_valor` → solo las referencia la
 *    migración que las creó; borrarlas haría que esa migración las recree.
 *    Se dejan hasta decidir qué pasa con esa migración.
 */

const HOSTS_LOCALES = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"]);
const esHostLocal = (host) => HOSTS_LOCALES.has(String(host).trim().toLowerCase());

/**
 * Esquema en inglés que quedó a medio construir, en paralelo al de producción.
 *
 * ORDEN IMPORTANTE: de hija a madre, porque hay claves foráneas entre ellas
 * (warehouse → branch → organization).
 *
 * `organization` NO se borra: `audit_log` —tabla viva de auditoría, con datos—
 * la referencia mediante `fk_audit_org`. Retirarla obligaría a eliminar esa FK
 * y eso cambia el comportamiento de algo que sí está en uso.
 */
const ESQUEMA_INGLES = [
  "org_settings", "org_authz_version", "policy",
  "warehouse", "branch", "subscription",
];

/**
 * Restos de versiones anteriores.
 *
 * `anular_sunat_b` NO entra: pese a no tener ninguna consulta que la nombre,
 * `venta` la referencia con la FK `FKventa983496`. Es parte del esquema de
 * anulaciones ante SUNAT — zona sagrada — y no se toca sin decisión explícita.
 *
 * Lección de esta migración: grepear el SQL no alcanza para dar una tabla por
 * muerta. Hay que mirar también las claves foráneas que apuntan a ella.
 */
const RESIDUOS = ["detalle_envio_old_v3"];

const existeTabla = async (cx, tabla) => {
  const [f] = await cx.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME=?`,
    [DATABASE, tabla]
  );
  return f.length > 0;
};

const volcarYBorrar = async (cx, tablas, etiqueta) => {
  console.log(`\n── ${etiqueta} ──`);
  for (const tabla of tablas) {
    if (!(await existeTabla(cx, tabla))) {
      console.log(`[omitido]  ${tabla} no existe.`);
      continue;
    }
    const [[{ n }]] = await cx.query(`SELECT COUNT(*) n FROM \`${tabla}\``);
    if (n > 0) {
      // Se imprime el contenido antes de borrar: si algo resultara útil, queda
      // en el log de la migración y no se pierde sin dejar rastro.
      const [filas] = await cx.query(`SELECT * FROM \`${tabla}\` LIMIT 5`);
      console.log(`[contenido] ${tabla} (${n} fila/s) antes de borrar:`);
      filas.forEach((f) => console.log(`            ${JSON.stringify(f).slice(0, 220)}`));
    }
    await cx.query(`DROP TABLE \`${tabla}\``);
    console.log(`[borrado]  ${tabla} (${n} fila/s)`);
  }
};

/**
 * `tonalidad` tiene dos columnas para el mismo dato: `codigo_hex` y `hex_code`,
 * y en las filas antiguas TIENEN VALORES DISTINTOS (Blanco: #FFFFFF vs #e6e6e6).
 * La que se muestra es `hex_code` (la lee productos.controller.js); `codigo_hex`
 * solo la escribe tonalidad.controller.js, con el mismo valor que la otra.
 * Se conserva `hex_code` y se retira la duplicada.
 */
const quitarColumnaDuplicada = async (cx) => {
  console.log("\n── Columna duplicada en tonalidad ──");
  const [cols] = await cx.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA=? AND TABLE_NAME='tonalidad' AND COLUMN_NAME='codigo_hex'`,
    [DATABASE]
  );
  if (cols.length === 0) {
    console.log("[omitido]  tonalidad.codigo_hex ya no existe.");
    return;
  }

  const [divergentes] = await cx.query(
    `SELECT id_tonalidad, nombre, codigo_hex, hex_code FROM tonalidad
     WHERE codigo_hex IS NOT NULL AND hex_code IS NOT NULL AND codigo_hex <> hex_code`
  );
  if (divergentes.length > 0) {
    console.log(`[aviso]    ${divergentes.length} tonalidad(es) con los dos valores distintos.`);
    console.log("           Se conserva hex_code, que es la que el sistema muestra:");
    divergentes.forEach((d) =>
      console.log(`            ${String(d.nombre).padEnd(16)} descartado=${d.codigo_hex}  se queda=${d.hex_code}`)
    );
  }

  // Si alguna fila tiene solo `codigo_hex`, se rescata antes de borrar.
  const [r] = await cx.query(
    `UPDATE tonalidad SET hex_code = codigo_hex WHERE hex_code IS NULL AND codigo_hex IS NOT NULL`
  );
  if (r.affectedRows > 0) console.log(`[rescatado] ${r.affectedRows} valor(es) que solo estaban en codigo_hex`);

  await cx.query("ALTER TABLE tonalidad DROP COLUMN codigo_hex");
  console.log("[borrado]  tonalidad.codigo_hex");
};

const main = async () => {
  if (!esHostLocal(HOST) && !process.env.ALLOW_REMOTE_MIGRATE) {
    console.error(`Abortado: HOST="${HOST}" no es local. Usa ALLOW_REMOTE_MIGRATE=1 para permitir ejecuciones remotas.`);
    process.exit(1);
  }
  const cx = await mysql.createConnection({
    host: HOST, user: USER, password: PASSWORD, database: DATABASE, port: PORT_DB,
  });
  try {
    const [[antes]] = await cx.query(
      `SELECT COUNT(*) n FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_TYPE='BASE TABLE'`,
      [DATABASE]
    );
    console.log(`Limpieza en ${DATABASE}@${HOST} — ${antes.n} tablas antes`);

    await volcarYBorrar(cx, ESQUEMA_INGLES, "Esquema en inglés (rediseño abandonado)");
    await volcarYBorrar(cx, RESIDUOS, "Restos de versiones anteriores");
    await quitarColumnaDuplicada(cx);

    const [[despues]] = await cx.query(
      `SELECT COUNT(*) n FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_TYPE='BASE TABLE'`,
      [DATABASE]
    );
    console.log(`\n${despues.n} tablas después (${antes.n - despues.n} retiradas)`);
  } finally {
    await cx.end();
  }
};

main().catch((e) => { console.error("Error en la limpieza:", e.message); process.exit(1); });
