import mysql from "mysql2/promise";
import {
  DATABASE,
  HOST,
  PASSWORD,
  PORT_DB,
  USER,
} from "../../src/config.js";

/**
 * Elimina índices redundantes (los que `sys.schema_redundant_indexes` reporta
 * como cubiertos por otro índice más completo).
 *
 * No es solo cosmética: MEDIDO en local, los índices de una sola columna hacían
 * que el optimizador eligiera planes PEORES que los índices compuestos nuevos.
 *   - `bitacora_nota.idx_bitacora_nota_id_tenant` provocaba un
 *     "index_merge intersect" en el kárdex: 126 ms. Sin él, MySQL usa
 *     `idx_bitacora_kardex` y baja a 8 ms (15x) sin filesort.
 *   - `detalle_venta.FKdetalle_ve758085(id_venta)` le ganaba a
 *     `idx_detalle_venta_agregacion`, que sí es cubridor ("Using index"):
 *     44 ms → 29 ms al usar el cubridor.
 *
 * Seguridad ante claves foráneas: MySQL exige un índice para cada FK. Antes de
 * borrar se verifica que otro índice pueda respaldarla (misma columna a la
 * IZQUIERDA); además se tolera el error 1553 (ER_DROP_INDEX_FK) sin abortar el
 * resto de la corrida.
 *
 * Reversión: recrear el índice, o —mejor antes de borrar— probar con
 *   ALTER TABLE <tabla> ALTER INDEX <indice> INVISIBLE;
 * que lo oculta al optimizador sin destruirlo.
 *
 * Uso: npm run db:migrate:limpiar-indices
 */

const HOSTS_LOCALES = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "host.docker.internal",
]);

const REDUNDANTES = [
  // Desbloquean el plan correcto (ver cabecera).
  { tabla: "bitacora_nota", nombre: "idx_bitacora_nota_id_tenant", cubiertoPor: "idx_bitacora_kardex" },
  { tabla: "detalle_venta", nombre: "FKdetalle_ve758085", cubiertoPor: "idx_detalle_venta_agregacion" },
  // Redundancia pura: menos coste de escritura y menos índice en RAM.
  { tabla: "venta", nombre: "idx_venta_id_tenant", cubiertoPor: "idx_venta_tenant_fecha_estado" },
  { tabla: "producto", nombre: "idx_producto_id_tenant", cubiertoPor: "idx_cod_barras_tenant" },
  { tabla: "nota", nombre: "idx_nota_id_tenant", cubiertoPor: "idx_nota_pendiente_destino" },
  { tabla: "inventario", nombre: "idx_inventario_variant", cubiertoPor: "idx_variant_unique" },
  { tabla: "producto_sku", nombre: "idx_sku_tenant", cubiertoPor: "uq_sku_prod_key" },
  { tabla: "permisos", nombre: "fk_permisos_rol", cubiertoPor: "uk_permiso_completo" },
  // NO se tocan a propósito:
  //  - `inventario.idx_inventario_id_tenant`: es el ÚNICO índice con id_tenant a
  //    la izquierda, así que respalda su FK; borrarlo la rompería.
  //  - los `idx_*_tenant` de catálogos (atributo/material/talla/temporada/
  //    tonalidad): decenas de filas, ganancia nula y riesgo innecesario.
];

const ERROR_INDICE_REQUERIDO_POR_FK = "ER_DROP_INDEX_FK";

const esHostLocal = (host) => HOSTS_LOCALES.has(String(host).trim().toLowerCase());

const escaparIdentificador = (identificador) =>
  `\`${String(identificador).replaceAll("`", "``")}\``;

const obtenerColumnasIndice = async (connection, tabla, nombre) => {
  const [columnas] = await connection.query(
    `
      SELECT COLUMN_NAME
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?
      ORDER BY SEQ_IN_INDEX
    `,
    [DATABASE, tabla, nombre]
  );
  return columnas.map(({ COLUMN_NAME }) => COLUMN_NAME);
};

/** true si algún OTRO índice de la tabla empieza por `columna`. */
const existeRespaldoParaColumna = async (connection, tabla, columna, excluido) => {
  const [filas] = await connection.query(
    `
      SELECT INDEX_NAME
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        AND SEQ_IN_INDEX = 1 AND COLUMN_NAME = ?
        AND INDEX_NAME <> ?
      LIMIT 1
    `,
    [DATABASE, tabla, columna, excluido]
  );
  return filas.length > 0;
};

const borrarIndiceRedundante = async (connection, indice) => {
  const columnas = await obtenerColumnasIndice(connection, indice.tabla, indice.nombre);

  if (columnas.length === 0) {
    console.log(`[omitido] ${indice.tabla}.${indice.nombre} no existe.`);
    return;
  }

  // El índice que debería cubrirlo tiene que existir antes de borrar nada.
  const cobertura = await obtenerColumnasIndice(connection, indice.tabla, indice.cubiertoPor);
  if (cobertura.length === 0) {
    console.log(
      `[omitido] ${indice.tabla}.${indice.nombre}: falta su índice de cobertura ${indice.cubiertoPor}.`
    );
    return;
  }

  // Si respalda una FK, otro índice debe poder tomar el relevo.
  const respaldado = await existeRespaldoParaColumna(
    connection,
    indice.tabla,
    columnas[0],
    indice.nombre
  );
  if (!respaldado) {
    console.log(
      `[omitido] ${indice.tabla}.${indice.nombre}: es el único índice que empieza por ${columnas[0]}.`
    );
    return;
  }

  try {
    await connection.query(
      `ALTER TABLE ${escaparIdentificador(indice.tabla)} DROP INDEX ${escaparIdentificador(indice.nombre)}`
    );
  } catch (error) {
    if (error.code === ERROR_INDICE_REQUERIDO_POR_FK) {
      console.log(`[bloqueado] ${indice.tabla}.${indice.nombre}: requerido por una clave foránea.`);
      return;
    }
    throw error;
  }

  const restantes = await obtenerColumnasIndice(connection, indice.tabla, indice.nombre);
  if (restantes.length > 0) {
    throw new Error(`No se pudo verificar el borrado de ${indice.nombre}.`);
  }

  console.log(`[borrado] ${indice.tabla}.${indice.nombre} (cubierto por ${indice.cubiertoPor}).`);
};

const ejecutar = async () => {
  if (!HOST || !DATABASE || !USER) {
    throw new Error("Falta configurar la conexión MySQL local en el archivo .env.");
  }

  if (!esHostLocal(HOST)) {
    throw new Error("Migración cancelada: esta versión solo está autorizada para MySQL local.");
  }

  const connection = await mysql.createConnection({
    host: HOST,
    database: DATABASE,
    user: USER,
    password: PASSWORD,
    port: PORT_DB,
    connectTimeout: 5000,
  });

  try {
    for (const indice of REDUNDANTES) {
      await borrarIndiceRedundante(connection, indice);
    }

    const tablas = [...new Set(REDUNDANTES.map((i) => i.tabla))]
      .map(escaparIdentificador)
      .join(", ");
    await connection.query(`ANALYZE TABLE ${tablas}`);
    console.log(`[verificado] estadísticas actualizadas.`);
  } finally {
    await connection.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:migrate:limpiar-indices] ${error.message}`);
  process.exitCode = 1;
});
