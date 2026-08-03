import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * `factura_compra` (create_compras_tables.js) se diseñó solo para cuentas por
 * pagar: `num_factura` es texto libre y `monto_total` no distingue base
 * gravada de IGV. Le faltan los campos que un Registro de Compras (RCE) de
 * SUNAT exige — serie/correlativo separados, tipo de documento del proveedor,
 * moneda/tipo de cambio, y el desglose gravada/IGV. Todas nullable: no
 * rompen el flujo de creación de factura existente, que sigue funcionando
 * sin ellas hasta que el formulario las capture.
 *
 * Uso: npm run db:migrate:factura-compra-fiscal
 */

const HOSTS_LOCALES = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"]);
const esHostLocal = (host) => HOSTS_LOCALES.has(String(host).trim().toLowerCase());

const existeColumna = async (connection, tabla, columna) => {
  const [filas] = await connection.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [DATABASE, tabla, columna]
  );
  return filas.length > 0;
};

const COLUMNAS = [
  { nombre: "tipo_doc_proveedor", ddl: "CHAR(2) NULL COMMENT 'Catálogo 01 SUNAT: 01=Factura, 03=Boleta, 07=Nota crédito, 08=Nota débito'" },
  { nombre: "serie", ddl: "VARCHAR(4) NULL" },
  { nombre: "correlativo", ddl: "VARCHAR(8) NULL" },
  { nombre: "ruc_proveedor", ddl: "VARCHAR(11) NULL COMMENT 'Snapshot al crear la factura; si el proveedor cambia de RUC después, esta factura no cambia retroactivamente'" },
  { nombre: "moneda", ddl: "CHAR(3) NOT NULL DEFAULT 'PEN'" },
  { nombre: "tipo_cambio", ddl: "DECIMAL(6,3) NULL COMMENT 'Solo si moneda distinta de PEN'" },
  { nombre: "mto_oper_gravadas", ddl: "DECIMAL(12,2) NULL" },
  { nombre: "mto_igv", ddl: "DECIMAL(12,2) NULL" },
];

const ejecutar = async () => {
  if (!HOST || !DATABASE || !USER) {
    throw new Error("Falta configurar la conexión MySQL local en el archivo .env.");
  }
  if (!esHostLocal(HOST) && !process.env.ALLOW_REMOTE_MIGRATE) {
    throw new Error("Migración cancelada: esta versión solo está autorizada para MySQL local (o establece ALLOW_REMOTE_MIGRATE=1).");
  }

  const connection = await mysql.createConnection({
    host: HOST, database: DATABASE, user: USER, password: PASSWORD, port: PORT_DB, connectTimeout: 5000,
  });

  try {
    for (const { nombre, ddl } of COLUMNAS) {
      if (await existeColumna(connection, "factura_compra", nombre)) {
        console.log(`[omitido] factura_compra.${nombre} ya existe.`);
        continue;
      }
      await connection.query(`ALTER TABLE factura_compra ADD COLUMN ${nombre} ${ddl}`);
      console.log(`[creado] factura_compra.${nombre}.`);
    }
  } finally {
    await connection.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:migrate:factura-compra-fiscal] ${error.message}`);
  process.exitCode = 1;
});
