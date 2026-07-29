import mysql from "mysql2/promise";
import {
  DATABASE,
  HOST,
  PASSWORD,
  PORT_DB,
  USER,
} from "../../src/config.js";

/**
 * Índices de performance para las consultas más pesadas del ERP (kárdex,
 * reportes y dashboard), diseñados con la regla ESR: primero las columnas de
 * IGUALDAD, luego la de RANGO, y al final las del ORDER BY.
 *
 * Cada índice de acá se justificó midiendo con `npm run db:bench` sobre el
 * dataset sintético de `npm run db:seed:perf` (ver PLAN). Los índices que la
 * medición NO justificó quedaron fuera a propósito:
 *   - `venta (id_tenant, id_venta)`: el listado paginado ya resuelve el
 *     `ORDER BY id_venta DESC` con "Backward index scan" sin filesort.
 *   - `venta (id_tenant, id_sucursal, f_venta)`: el índice por fecha ya cubre
 *     el caso; agregarlo solo encarecería las escrituras de cada venta.
 *
 * Uso: npm run db:migrate:perf-indexes
 */

const HOSTS_LOCALES = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "host.docker.internal",
]);

const INDICES = [
  {
    tabla: "bitacora_nota",
    nombre: "idx_bitacora_kardex",
    // Kárdex (kardex.controller.js y kardexInventario.controller.js, 4 endpoints):
    // WHERE id_tenant = ? AND id_producto = ? AND fecha >= ? AND fecha < ?
    // ORDER BY fecha, hora_creacion  → el mismo prefijo evita el filesort.
    columnas: ["id_tenant", "id_producto", "fecha", "hora_creacion"],
  },
  {
    tabla: "venta",
    nombre: "idx_venta_tenant_fecha_estado",
    // Reportes y dashboard: WHERE id_tenant = ? AND f_venta >= ? AND f_venta < ?
    // AND estado_venta != 0. `estado_venta` va AL FINAL porque "!= 0" no sirve
    // para posicionarse (deja pasar ~97% de las filas); ahí se resuelve por
    // Index Condition Pushdown sin ir a la tabla.
    columnas: ["id_tenant", "f_venta", "estado_venta"],
  },
  {
    tabla: "detalle_venta",
    nombre: "idx_detalle_venta_agregacion",
    // Todos los reportes hacen JOIN por id_venta y agregan SUM(total)/SUM(cantidad)
    // agrupando por id_producto. Con estas columnas la agregación es index-only
    // (Using index) y no toca el clustered index de la tabla con más fan-out.
    columnas: ["id_venta", "id_producto", "cantidad", "total"],
  },
];

const esHostLocal = (host) => HOSTS_LOCALES.has(String(host).trim().toLowerCase());

const escaparIdentificador = (identificador) =>
  `\`${String(identificador).replaceAll("`", "``")}\``;

/** Columnas del índice, en orden. Vacío si el índice no existe. */
const obtenerColumnasIndice = async (connection, tabla, nombre) => {
  const [columnas] = await connection.query(
    `
      SELECT COLUMN_NAME
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
        AND INDEX_NAME = ?
      ORDER BY SEQ_IN_INDEX
    `,
    [DATABASE, tabla, nombre]
  );

  return columnas.map(({ COLUMN_NAME }) => COLUMN_NAME);
};

const tienenMismasColumnas = (actuales, esperadas) =>
  actuales.length === esperadas.length &&
  actuales.every((columna, indice) => columna === esperadas[indice]);

const crearIndiceSiFalta = async (connection, indice) => {
  const columnasActuales = await obtenerColumnasIndice(
    connection,
    indice.tabla,
    indice.nombre
  );

  if (columnasActuales.length > 0) {
    if (!tienenMismasColumnas(columnasActuales, indice.columnas)) {
      throw new Error(
        `El índice ${indice.nombre} ya existe con otra definición: ${columnasActuales.join(", ")}.`
      );
    }

    console.log(`[omitido] ${indice.nombre} ya existe con la definición esperada.`);
    return;
  }

  const tablaSQL = escaparIdentificador(indice.tabla);
  const nombreSQL = escaparIdentificador(indice.nombre);
  const columnasSQL = indice.columnas.map(escaparIdentificador).join(", ");

  await connection.query(
    `ALTER TABLE ${tablaSQL} ADD INDEX ${nombreSQL} (${columnasSQL})`
  );

  const columnasCreadas = await obtenerColumnasIndice(
    connection,
    indice.tabla,
    indice.nombre
  );
  if (!tienenMismasColumnas(columnasCreadas, indice.columnas)) {
    throw new Error(`No se pudo verificar el índice ${indice.nombre} después de crearlo.`);
  }

  console.log(
    `[creado] ${indice.tabla}.${indice.nombre} (${indice.columnas.join(", ")}).`
  );
};

const ejecutar = async () => {
  if (!HOST || !DATABASE || !USER) {
    throw new Error("Falta configurar la conexión MySQL local en el archivo .env.");
  }

  if (!esHostLocal(HOST) && !process.env.ALLOW_REMOTE_MIGRATE) {
    throw new Error(
      "Migración cancelada: esta versión solo está autorizada para MySQL local (o establece ALLOW_REMOTE_MIGRATE=1)."
    );
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
    for (const indice of INDICES) {
      await crearIndiceSiFalta(connection, indice);
    }

    // Sin estadísticas frescas el optimizador (y EXPLAIN) siguen viendo el
    // estado anterior y pueden ignorar los índices recién creados.
    const tablas = [...new Set(INDICES.map((i) => i.tabla))]
      .map(escaparIdentificador)
      .join(", ");
    await connection.query(`ANALYZE TABLE ${tablas}`);
    console.log(`[verificado] estadísticas actualizadas (ANALYZE TABLE ${tablas}).`);
  } finally {
    await connection.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:migrate:perf-indexes] ${error.message}`);
  process.exitCode = 1;
});
