import mysql from "mysql2/promise";
import {
  DATABASE,
  HOST,
  PASSWORD,
  PORT_DB,
  USER,
} from "../../src/config.js";

/**
 * Persistencia de comprobantes electrónicos (CPE) — base del subsistema fiscal.
 *
 * Hoy la emisión a SUNAT no guarda NADA: ni el XML firmado, ni el CDR, ni el
 * ticket. El CDR se devuelve al navegador y se descarta, así que no hay forma de
 * reconstruir qué se declaró ante SUNAT (obligación de conservación fiscal).
 *
 * Crea tres tablas:
 *   1. `comprobante_electronico`          cabecera "delgada" (sin blobs) → alimenta listados
 *   2. `comprobante_electronico_archivo`  1:1 con los blobs (XML firmado + CDR)
 *   3. `comprobante_electronico_envio`    historial append-only de intentos
 *
 * Los blobs viven en una tabla satélite a propósito: así el listado de la UI
 * nunca lee un MEDIUMTEXT/MEDIUMBLOB por accidente.
 *
 * Además agrega `empresa.ubigueo`: el UBL EXIGE el ubigeo del emisor y la
 * columna no existe (aunque `ventas.controller.js` ya la referencia en un
 * SELECT, que por eso falla). Se rellena cruzando distrito/provincia/
 * departamento contra la tabla `ubigeo`.
 *
 * Uso: npm run db:migrate:cpe
 */

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

const existeColumna = async (connection, tabla, columna) => {
  const [filas] = await connection.query(
    `
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
    `,
    [DATABASE, tabla, columna]
  );
  return filas.length > 0;
};

const existeTabla = async (connection, tabla) => {
  const [filas] = await connection.query(
    `
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
    `,
    [DATABASE, tabla]
  );
  return filas.length > 0;
};

// ── 1. Cabecera ────────────────────────────────────────────────────────────
// Sin blobs: este es el registro que se lista, filtra y pagina.
const crearTablaCabecera = async (connection) => {
  const yaExistia = await existeTabla(connection, "comprobante_electronico");

  await connection.query(`
    CREATE TABLE IF NOT EXISTS comprobante_electronico (
      id_cpe BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      id_tenant INT UNSIGNED NOT NULL,
      id_empresa INT NOT NULL,
      id_venta INT NOT NULL,
      id_sucursal INT NULL,

      tipo_doc CHAR(2) NOT NULL COMMENT 'Catálogo 01 SUNAT: 01=Factura, 03=Boleta',
      serie VARCHAR(4) NOT NULL,
      correlativo VARCHAR(8) NOT NULL,
      ruc_emisor VARCHAR(11) NOT NULL,
      nombre_archivo VARCHAR(64) NOT NULL COMMENT '{ruc}-{tipoDoc}-{serie}-{correlativo}',
      fecha_emision DATE NOT NULL,
      moneda CHAR(3) NOT NULL DEFAULT 'PEN',

      mto_oper_gravadas DECIMAL(12,2) NOT NULL DEFAULT 0,
      mto_igv DECIMAL(12,2) NOT NULL DEFAULT 0,
      mto_imp_venta DECIMAL(12,2) NOT NULL DEFAULT 0,

      tipo_doc_cliente CHAR(1) NULL COMMENT '1=DNI, 6=RUC, 0=sin documento',
      num_doc_cliente VARCHAR(15) NULL,
      nombre_cliente VARCHAR(255) NULL,

      estado VARCHAR(24) NOT NULL DEFAULT 'PENDIENTE',
      sunat_response_code VARCHAR(8) NULL,
      sunat_descripcion VARCHAR(500) NULL,
      sunat_notas_json JSON NULL,
      ticket VARCHAR(50) NULL,
      hash_cpe VARCHAR(100) NULL COMMENT 'DigestValue del XML firmado (para el QR del PDF)',

      sunat_env VARCHAR(8) NOT NULL DEFAULT 'beta' COMMENT 'No mezclar documentos de beta con producción',
      origen VARCHAR(12) NOT NULL DEFAULT 'SERVIDOR' COMMENT 'SERVIDOR | LEGACY | BACKFILL',
      sin_respaldo TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = sin XML/CDR (venta antigua)',

      intentos SMALLINT UNSIGNED NOT NULL DEFAULT 0,
      ultimo_error VARCHAR(500) NULL,
      ultimo_error_categoria VARCHAR(24) NULL,
      idempotency_key VARCHAR(64) NULL,
      lock_token CHAR(36) NULL,
      lock_expira_en DATETIME NULL,

      enviado_en DATETIME NULL,
      respondido_en DATETIME NULL,
      creado_por INT NULL,
      creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      PRIMARY KEY (id_cpe),
      -- Idempotencia en la BD: una venta = un documento, y jamás dos veces el mismo número.
      UNIQUE KEY uq_cpe_tenant_venta (id_tenant, id_venta),
      UNIQUE KEY uq_cpe_tenant_doc (id_tenant, ruc_emisor, tipo_doc, serie, correlativo),
      UNIQUE KEY uq_cpe_tenant_idem (id_tenant, idempotency_key),
      KEY idx_cpe_tenant_estado_fecha (id_tenant, estado, fecha_emision),
      KEY idx_cpe_tenant_fecha (id_tenant, fecha_emision),
      KEY idx_cpe_tenant_cliente (id_tenant, num_doc_cliente),
      KEY idx_cpe_lock (estado, lock_expira_en)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  console.log(
    yaExistia
      ? "[omitido] comprobante_electronico ya existía."
      : "[creado] comprobante_electronico."
  );

  // Verificación real de los candados de idempotencia.
  for (const [indice, esperadas] of [
    ["uq_cpe_tenant_venta", ["id_tenant", "id_venta"]],
    ["uq_cpe_tenant_doc", ["id_tenant", "ruc_emisor", "tipo_doc", "serie", "correlativo"]],
    ["uq_cpe_tenant_idem", ["id_tenant", "idempotency_key"]],
  ]) {
    const actuales = await obtenerColumnasIndice(connection, "comprobante_electronico", indice);
    if (actuales.join(",") !== esperadas.join(",")) {
      throw new Error(
        `El índice ${indice} no quedó como se esperaba: [${actuales.join(", ")}].`
      );
    }
  }
  console.log("[verificado] candados de idempotencia (3 índices únicos).");
};

// ── 2. Archivos (blobs) ────────────────────────────────────────────────────
const crearTablaArchivos = async (connection) => {
  const yaExistia = await existeTabla(connection, "comprobante_electronico_archivo");

  await connection.query(`
    CREATE TABLE IF NOT EXISTS comprobante_electronico_archivo (
      id_cpe BIGINT UNSIGNED NOT NULL,
      id_tenant INT UNSIGNED NOT NULL,
      xml_firmado MEDIUMTEXT NULL,
      xml_sha256 CHAR(64) NULL,
      cdr_zip MEDIUMBLOB NULL COMMENT 'ZIP tal cual lo devuelve SUNAT: es el documento legal',
      cdr_xml MEDIUMTEXT NULL,
      cdr_sha256 CHAR(64) NULL,
      ruta_disco VARCHAR(255) NULL COMMENT 'Puerta abierta a mover los blobs a almacenamiento externo',
      creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id_cpe),
      KEY idx_cpe_archivo_tenant (id_tenant)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  console.log(
    yaExistia
      ? "[omitido] comprobante_electronico_archivo ya existía."
      : "[creado] comprobante_electronico_archivo."
  );
};

// ── 3. Historial de intentos ───────────────────────────────────────────────
const crearTablaEnvios = async (connection) => {
  const yaExistia = await existeTabla(connection, "comprobante_electronico_envio");

  await connection.query(`
    CREATE TABLE IF NOT EXISTS comprobante_electronico_envio (
      id_envio BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      id_cpe BIGINT UNSIGNED NOT NULL,
      id_tenant INT UNSIGNED NOT NULL,
      intento SMALLINT UNSIGNED NOT NULL DEFAULT 1,
      operacion VARCHAR(24) NOT NULL COMMENT 'SEND_BILL | GET_STATUS | GET_STATUS_CDR',
      resultado VARCHAR(24) NOT NULL,
      sunat_response_code VARCHAR(8) NULL,
      mensaje VARCHAR(1000) NULL,
      soap_fault_code VARCHAR(50) NULL,
      duracion_ms INT NULL,
      id_usuario INT NULL,
      ip VARCHAR(45) NULL,
      creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id_envio),
      KEY idx_envio_cpe (id_cpe, intento),
      KEY idx_envio_tenant_fecha (id_tenant, creado_en)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  console.log(
    yaExistia
      ? "[omitido] comprobante_electronico_envio ya existía."
      : "[creado] comprobante_electronico_envio."
  );
};

// ── 4. empresa.ubigueo (lo exige el UBL) ───────────────────────────────────
const asegurarUbigeoEmpresa = async (connection) => {
  if (await existeColumna(connection, "empresa", "ubigueo")) {
    console.log("[omitido] empresa.ubigueo ya existe.");
  } else {
    await connection.query(
      "ALTER TABLE empresa ADD COLUMN ubigueo VARCHAR(6) NULL COMMENT 'Ubigeo del emisor (obligatorio en el UBL de SUNAT)' AFTER departamento"
    );
    console.log("[creado] empresa.ubigueo.");
  }

  if (!(await existeTabla(connection, "ubigeo"))) {
    console.log("[omitido] backfill de ubigeo: no existe la tabla `ubigeo`.");
    return;
  }

  // Cruce por nombre de distrito/provincia/departamento (case-insensitive).
  const [resultado] = await connection.query(`
    UPDATE empresa e
    JOIN ubigeo u
      ON  LOWER(TRIM(u.distrito))     = LOWER(TRIM(e.distrito))
      AND LOWER(TRIM(u.provincia))    = LOWER(TRIM(e.provincia))
      AND LOWER(TRIM(u.departamento)) = LOWER(TRIM(e.departamento))
    SET e.ubigueo = u.codigo_ubigeo
    WHERE e.ubigueo IS NULL
      AND e.distrito IS NOT NULL
      AND e.provincia IS NOT NULL
      AND e.departamento IS NOT NULL
  `);
  console.log(`[creado] ubigeo resuelto para ${resultado.affectedRows} empresa(s).`);

  const [[pendientes]] = await connection.query(
    "SELECT COUNT(*) AS n FROM empresa WHERE ubigueo IS NULL"
  );
  if (pendientes.n > 0) {
    console.log(
      `[atención] ${pendientes.n} empresa(s) sin ubigeo: no podrán emitir hasta cargarlo ` +
        `(el UBL lo exige). Revisar que distrito/provincia/departamento coincidan con la tabla ubigeo.`
    );
  } else {
    console.log("[verificado] todas las empresas tienen ubigeo.");
  }
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
    await crearTablaCabecera(connection);
    await crearTablaArchivos(connection);
    await crearTablaEnvios(connection);
    await asegurarUbigeoEmpresa(connection);
  } finally {
    await connection.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:migrate:cpe] ${error.message}`);
  process.exitCode = 1;
});
