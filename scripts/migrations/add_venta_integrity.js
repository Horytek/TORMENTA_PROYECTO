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

const esHostLocal = (host) => HOSTS_LOCALES.has(String(host).trim().toLowerCase());

const obtenerColumnasIndice = async (connection, tabla, indice) => {
  const [columnas] = await connection.query(
    `
      SELECT COLUMN_NAME
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?
      ORDER BY SEQ_IN_INDEX
    `,
    [DATABASE, tabla, indice]
  );
  return columnas.map(({ COLUMN_NAME }) => COLUMN_NAME);
};

const asegurarIdempotenciaVenta = async (connection) => {
  const [columnas] = await connection.query(
    `
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'venta' AND COLUMN_NAME = 'idempotency_key'
    `,
    [DATABASE]
  );

  if (columnas.length === 0) {
    await connection.query(
      "ALTER TABLE venta ADD COLUMN idempotency_key VARCHAR(64) NULL AFTER id_tenant"
    );
    console.log("[creado] venta.idempotency_key.");
  } else {
    console.log("[omitido] venta.idempotency_key ya existe.");
  }

  const nombreIndice = "uq_venta_tenant_idempotency";
  const esperadas = ["id_tenant", "idempotency_key"];
  const actuales = await obtenerColumnasIndice(connection, "venta", nombreIndice);

  if (actuales.length === 0) {
    await connection.query(
      `ALTER TABLE venta ADD UNIQUE INDEX ${nombreIndice} (id_tenant, idempotency_key)`
    );
    console.log(`[creado] ${nombreIndice} (${esperadas.join(", ")}).`);
  } else if (actuales.join(",") !== esperadas.join(",")) {
    throw new Error(`${nombreIndice} existe con otra definición: ${actuales.join(", ")}.`);
  } else {
    console.log(`[omitido] ${nombreIndice} ya existe.`);
  }
};

const asegurarTablaCorrelativos = async (connection) => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS comprobante_correlativo (
      id_tenant INT UNSIGNED NOT NULL,
      id_sucursal INT NOT NULL,
      id_tipocomprobante INT NOT NULL,
      serie_num INT UNSIGNED NOT NULL,
      ultimo_numero INT UNSIGNED NOT NULL DEFAULT 0,
      actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id_tenant, id_sucursal, id_tipocomprobante)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  console.log("[verificado] comprobante_correlativo.");
};

const obtenerSemillasCorrelativo = async (connection) => {
  const [sucursales] = await connection.query(
    "SELECT id_tenant, id_sucursal FROM sucursal WHERE id_tenant IS NOT NULL"
  );
  const sucursalesValidas = new Set(
    sucursales.map(({ id_tenant, id_sucursal }) => `${id_tenant}:${id_sucursal}`)
  );

  const [comprobantes] = await connection.query(`
    SELECT id_tenant, id_tipocomprobante, num_comprobante
    FROM comprobante
    WHERE id_tenant IS NOT NULL
  `);

  const semillas = new Map();
  for (const comprobante of comprobantes) {
    const match = /^[A-Za-z](\d+)-(\d{8})$/.exec(comprobante.num_comprobante || "");
    if (!match) continue;

    const serie_num = Number(match[1]);
    const ultimo_numero = Number(match[2]);
    const id_sucursal = Math.floor(serie_num / 100);
    if (!sucursalesValidas.has(`${comprobante.id_tenant}:${id_sucursal}`)) continue;

    const clave = `${comprobante.id_tenant}:${id_sucursal}:${comprobante.id_tipocomprobante}`;
    const actual = semillas.get(clave);
    if (
      !actual ||
      serie_num > actual.serie_num ||
      (serie_num === actual.serie_num && ultimo_numero > actual.ultimo_numero)
    ) {
      semillas.set(clave, {
        id_tenant: comprobante.id_tenant,
        id_sucursal,
        id_tipocomprobante: comprobante.id_tipocomprobante,
        serie_num,
        ultimo_numero,
      });
    }
  }

  return [...semillas.values()];
};

const respaldarCorrelativosExistentes = async (connection) => {
  const semillas = await obtenerSemillasCorrelativo(connection);

  for (const semilla of semillas) {
    const paramsClave = [
      semilla.id_tenant,
      semilla.id_sucursal,
      semilla.id_tipocomprobante,
    ];

    await connection.query(
      `
        INSERT IGNORE INTO comprobante_correlativo
          (id_tenant, id_sucursal, id_tipocomprobante, serie_num, ultimo_numero)
        VALUES (?, ?, ?, ?, ?)
      `,
      [...paramsClave, semilla.serie_num, semilla.ultimo_numero]
    );

    await connection.query(
      `
        UPDATE comprobante_correlativo
        SET serie_num = ?, ultimo_numero = ?
        WHERE id_tenant = ? AND id_sucursal = ? AND id_tipocomprobante = ?
          AND (serie_num < ? OR (serie_num = ? AND ultimo_numero < ?))
      `,
      [
        semilla.serie_num,
        semilla.ultimo_numero,
        ...paramsClave,
        semilla.serie_num,
        semilla.serie_num,
        semilla.ultimo_numero,
      ]
    );
  }

  console.log(`[verificado] ${semillas.length} correlativos iniciales respaldados.`);
};

const ejecutar = async () => {
  if (!HOST || !DATABASE || !USER) {
    throw new Error("Falta configurar la conexión MySQL local en el archivo .env.");
  }
  if (!esHostLocal(HOST) && !process.env.ALLOW_REMOTE_MIGRATE) {
    throw new Error("Migración cancelada: esta versión solo está autorizada para MySQL local (o establece ALLOW_REMOTE_MIGRATE=1).");
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
    await asegurarIdempotenciaVenta(connection);
    await asegurarTablaCorrelativos(connection);
    await respaldarCorrelativosExistentes(connection);
  } finally {
    await connection.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:migrate:ventas-integrity] ${error.message}`);
  process.exitCode = 1;
});
