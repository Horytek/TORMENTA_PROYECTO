import mysql from "mysql2/promise";
import {
  DATABASE,
  HOST,
  PASSWORD,
  PORT_DB,
  USER,
} from "../../src/config.js";

const HOSTS_LOCALES = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "host.docker.internal",
]);

const INDICES = [
  {
    nombre: "idx_nota_pendiente_destino",
    columnas: [
      "id_tenant",
      "id_tiponota",
      "estado_nota",
      "id_almacenD",
      "fecha",
      "hora_creacion",
      "id_almacenO",
    ],
  },
  {
    nombre: "idx_nota_pendiente_origen",
    columnas: [
      "id_tenant",
      "id_tiponota",
      "estado_nota",
      "id_almacenO",
      "fecha",
      "hora_creacion",
      "id_almacenD",
    ],
  },
];

const esHostLocal = (host) => HOSTS_LOCALES.has(String(host).trim().toLowerCase());

const escaparIdentificador = (identificador) =>
  `\`${String(identificador).replaceAll("`", "``")}\``;

const obtenerColumnasIndice = async (connection, nombre) => {
  const [columnas] = await connection.query(
    `
      SELECT COLUMN_NAME
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'nota'
        AND INDEX_NAME = ?
      ORDER BY SEQ_IN_INDEX
    `,
    [DATABASE, nombre]
  );

  return columnas.map(({ COLUMN_NAME }) => COLUMN_NAME);
};

const tienenMismasColumnas = (actuales, esperadas) =>
  actuales.length === esperadas.length &&
  actuales.every((columna, indice) => columna === esperadas[indice]);

const crearIndiceSiFalta = async (connection, indice) => {
  const columnasActuales = await obtenerColumnasIndice(connection, indice.nombre);

  if (columnasActuales.length > 0) {
    if (!tienenMismasColumnas(columnasActuales, indice.columnas)) {
      throw new Error(
        `El índice ${indice.nombre} ya existe con otra definición: ${columnasActuales.join(", ")}.`
      );
    }

    console.log(`[omitido] ${indice.nombre} ya existe con la definición esperada.`);
    return;
  }

  const nombreSQL = escaparIdentificador(indice.nombre);
  const columnasSQL = indice.columnas.map(escaparIdentificador).join(", ");

  await connection.query(
    `ALTER TABLE \`nota\` ADD INDEX ${nombreSQL} (${columnasSQL})`
  );

  const columnasCreadas = await obtenerColumnasIndice(connection, indice.nombre);
  if (!tienenMismasColumnas(columnasCreadas, indice.columnas)) {
    throw new Error(`No se pudo verificar el índice ${indice.nombre} después de crearlo.`);
  }

  console.log(`[creado] ${indice.nombre} (${indice.columnas.join(", ")}).`);
};

const ejecutar = async () => {
  if (!HOST || !DATABASE || !USER) {
    throw new Error("Falta configurar la conexión MySQL local en el archivo .env.");
  }

  if (!esHostLocal(HOST)) {
    throw new Error(
      "Migración cancelada: esta versión solo está autorizada para MySQL local."
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
  } finally {
    await connection.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:migrate:nota-indexes] ${error.message}`);
  process.exitCode = 1;
});
