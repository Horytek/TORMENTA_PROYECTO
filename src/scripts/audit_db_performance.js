import mysql from "mysql2/promise";
import {
  DATABASE,
  HOST,
  PASSWORD,
  PORT_DB,
  USER,
} from "../config.js";

const HOSTS_LOCALES = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "host.docker.internal",
]);

const LIMITE_CONSULTAS = 20;
const LIMITE_TABLAS = 20;

const esHostLocal = (host) => HOSTS_LOCALES.has(String(host).trim().toLowerCase());

const convertirBigInt = (valor) =>
  typeof valor === "bigint" ? valor.toString() : valor;

const normalizarFila = (fila) =>
  Object.fromEntries(
    Object.entries(fila).map(([clave, valor]) => [clave, convertirBigInt(valor)])
  );

const consultarVariables = async (connection) => {
  const [variables] = await connection.query(`
    SHOW VARIABLES
    WHERE Variable_name IN ('slow_query_log', 'long_query_time', 'log_output')
  `);

  return Object.fromEntries(
    variables.map(({ Variable_name, Value }) => [Variable_name, Value])
  );
};

const consultarEstado = async (connection) => {
  const [estado] = await connection.query(`
    SHOW GLOBAL STATUS
    WHERE Variable_name IN (
      'Uptime',
      'Questions',
      'Slow_queries',
      'Threads_connected',
      'Threads_running',
      'Created_tmp_disk_tables',
      'Created_tmp_tables',
      'Select_full_join',
      'Select_scan'
    )
  `);

  return Object.fromEntries(
    estado.map(({ Variable_name, Value }) => [Variable_name, Value])
  );
};

const consultarTablasMayores = async (connection) => {
  const [tablas] = await connection.query(
    `
      SELECT
        TABLE_NAME AS tabla,
        TABLE_ROWS AS filas_estimadas,
        ROUND(DATA_LENGTH / 1024 / 1024, 2) AS datos_mb,
        ROUND(INDEX_LENGTH / 1024 / 1024, 2) AS indices_mb,
        ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS total_mb
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
        AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC
      LIMIT ?
    `,
    [DATABASE, LIMITE_TABLAS]
  );

  return tablas.map(normalizarFila);
};

const consultarDigests = async (connection) => {
  const [consultas] = await connection.query(
    `
      SELECT
        LEFT(DIGEST_TEXT, 700) AS consulta,
        COUNT_STAR AS ejecuciones,
        ROUND(SUM_TIMER_WAIT / 1000000000, 2) AS total_ms,
        ROUND(AVG_TIMER_WAIT / 1000000000, 2) AS promedio_ms,
        SUM_ROWS_EXAMINED AS filas_examinadas,
        SUM_ROWS_SENT AS filas_enviadas,
        ROUND(SUM_ROWS_EXAMINED / GREATEST(SUM_ROWS_SENT, 1), 2) AS ratio_examinadas_enviadas,
        SUM_NO_INDEX_USED AS ejecuciones_sin_indice,
        SUM_NO_GOOD_INDEX_USED AS ejecuciones_indice_no_util,
        FIRST_SEEN AS primera_ejecucion,
        LAST_SEEN AS ultima_ejecucion
      FROM performance_schema.events_statements_summary_by_digest
      WHERE SCHEMA_NAME = ?
        AND DIGEST_TEXT IS NOT NULL
        AND DIGEST_TEXT NOT LIKE 'EXPLAIN %'
        AND DIGEST_TEXT NOT LIKE 'SHOW %'
        AND DIGEST_TEXT NOT LIKE 'SELECT %performance_schema%'
        AND DIGEST_TEXT NOT LIKE 'SELECT %information_schema%'
        AND DIGEST_TEXT NOT LIKE 'SELECT %sys%'
      ORDER BY SUM_TIMER_WAIT DESC
      LIMIT ?
    `,
    [DATABASE, LIMITE_CONSULTAS]
  );

  return consultas.map(normalizarFila);
};

const consultarIndicesRedundantes = async (connection) => {
  try {
    const [indices] = await connection.query(
      `
        SELECT
          table_name AS tabla,
          redundant_index_name AS indice_redundante,
          redundant_index_columns AS columnas_redundantes,
          dominant_index_name AS indice_dominante,
          dominant_index_columns AS columnas_dominantes
        FROM sys.schema_redundant_indexes
        WHERE table_schema = ?
        ORDER BY table_name, redundant_index_name
      `,
      [DATABASE]
    );

    return indices.map(normalizarFila);
  } catch (error) {
    return {
      disponible: false,
      codigo: error.code,
      mensaje: error.message,
    };
  }
};

const ejecutar = async () => {
  if (!HOST || !DATABASE || !USER) {
    throw new Error("Falta configurar la conexión MySQL local en el archivo .env.");
  }

  if (!esHostLocal(HOST)) {
    throw new Error(
      "Auditoría cancelada: este script solo puede ejecutarse contra MySQL local."
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
    const [[servidor]] = await connection.query(`
      SELECT VERSION() AS version, @@performance_schema AS performance_schema
    `);

    const reporte = {
      generado_en: new Date().toISOString(),
      alcance: "Solo metadatos y consultas normalizadas de la base local",
      servidor: normalizarFila(servidor),
      variables: await consultarVariables(connection),
      estado: await consultarEstado(connection),
      tablas_mayores: await consultarTablasMayores(connection),
      consultas_por_tiempo_total: servidor.performance_schema
        ? await consultarDigests(connection)
        : {
            disponible: false,
            mensaje: "performance_schema está deshabilitado.",
          },
      indices_redundantes: await consultarIndicesRedundantes(connection),
    };

    console.log(JSON.stringify(reporte, null, 2));
  } finally {
    await connection.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:audit] ${error.message}`);
  process.exitCode = 1;
});
