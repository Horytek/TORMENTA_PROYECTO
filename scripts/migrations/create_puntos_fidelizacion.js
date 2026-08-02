import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * Club de Puntos / Fidelización.
 *
 * `puntos_config`: 1 fila por tenant. `soles_por_punto` = cuánto hay que
 * gastar para ganar 1 punto (ej. 10 → 1 punto cada S/10). `valor_canje_por_punto`
 * = a cuántos soles de descuento equivale 1 punto al canjear.
 *
 * `cliente.puntos_saldo`: saldo cacheado (igual criterio que `stock_cache` en
 * `producto_sku`) — se lee en cada venta del POS, no tiene sentido sumar el
 * ledger completo cada vez. `puntos_movimiento` es el ledger real (auditoría).
 *
 * El canje se resuelve como un descuento más sobre `venta.descuento_global`
 * (mecanismo ya existente) — esta migración no toca esa tabla.
 *
 * Uso: npm run db:migrate:puntos
 */

const HOSTS_LOCALES = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"]);
const esHostLocal = (host) => HOSTS_LOCALES.has(String(host).trim().toLowerCase());

const existeTabla = async (cx, tabla) => {
  const [filas] = await cx.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [DATABASE, tabla]
  );
  return filas.length > 0;
};

const existeColumna = async (cx, tabla, columna) => {
  const [filas] = await cx.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [DATABASE, tabla, columna]
  );
  return filas.length > 0;
};

const ejecutar = async () => {
  if (!HOST || !DATABASE || !USER) {
    throw new Error("Falta configurar la conexión MySQL local en el archivo .env.");
  }
  if (!esHostLocal(HOST) && !process.env.ALLOW_REMOTE_MIGRATE) {
    throw new Error("Migración cancelada: esta versión solo está autorizada para MySQL local (o establece ALLOW_REMOTE_MIGRATE=1).");
  }

  const cx = await mysql.createConnection({
    host: HOST, database: DATABASE, user: USER, password: PASSWORD, port: PORT_DB, connectTimeout: 5000,
  });

  try {
    if (await existeTabla(cx, "puntos_config")) {
      console.log("[omitido] puntos_config ya existía.");
    } else {
      await cx.query(`
        CREATE TABLE puntos_config (
          id_tenant INT NOT NULL,
          activo TINYINT(1) NOT NULL DEFAULT 0,
          soles_por_punto DECIMAL(10,2) NOT NULL DEFAULT 10.00,
          valor_canje_por_punto DECIMAL(10,4) NOT NULL DEFAULT 0.1000,
          f_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id_tenant)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);
      console.log("[creado] puntos_config.");
    }

    if (await existeColumna(cx, "cliente", "puntos_saldo")) {
      console.log("[omitido] cliente.puntos_saldo ya existe.");
    } else {
      await cx.query("ALTER TABLE cliente ADD COLUMN puntos_saldo INT NOT NULL DEFAULT 0");
      console.log("[creado] cliente.puntos_saldo.");
    }

    if (await existeTabla(cx, "puntos_movimiento")) {
      console.log("[omitido] puntos_movimiento ya existía.");
    } else {
      await cx.query(`
        CREATE TABLE puntos_movimiento (
          id_movimiento INT NOT NULL AUTO_INCREMENT,
          id_tenant INT NOT NULL,
          id_cliente INT NOT NULL,
          id_venta INT NULL,
          tipo ENUM('GANADO','CANJEADO','AJUSTE') NOT NULL,
          puntos INT NOT NULL COMMENT 'Siempre positivo; el signo lo da la columna tipo',
          fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id_movimiento),
          KEY idx_puntos_mov_cliente (id_tenant, id_cliente),
          KEY idx_puntos_mov_venta (id_venta)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);
      console.log("[creado] puntos_movimiento.");
    }
  } finally {
    await cx.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:migrate:puntos] ${error.message}`);
  process.exitCode = 1;
});
