import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * Arqueo de caja por turno de cajero (POS).
 *
 * Concepto nuevo, independiente de Tesorería (que cierra caja a nivel de día
 * completo del negocio, no por cajero/turno). Un turno se abre con un monto
 * inicial y se cierra con un arqueo ciego: el cajero declara cuánto contó por
 * método de pago SIN ver antes lo que el sistema espera según las ventas
 * registradas en la ventana [fecha_apertura, fecha_cierre] de esa sucursal.
 *
 * `declarado_json` / `esperado_json` / `diferencia_json` son objetos
 * { "EFECTIVO": monto, "YAPE": monto, ... } — mismo vocabulario de métodos
 * que ya usa `venta.metodo_pago` (ver `parseMetodoPago` en reporte.controller.js).
 *
 * Uso: npm run db:migrate:caja-turno
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
    if (await existeTabla(cx, "caja_turno")) {
      console.log("[omitido] caja_turno ya existía.");
    } else {
      await cx.query(`
        CREATE TABLE caja_turno (
          id_turno INT NOT NULL AUTO_INCREMENT,
          id_tenant INT NOT NULL,
          id_sucursal INT NOT NULL,
          id_usuario_apertura INT NOT NULL,
          monto_inicial DECIMAL(12,2) NOT NULL DEFAULT 0,
          fecha_apertura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          estado ENUM('abierto','cerrado') NOT NULL DEFAULT 'abierto',
          id_usuario_cierre INT NULL,
          fecha_cierre DATETIME NULL,
          declarado_json JSON NULL COMMENT 'Conteo ciego del cajero por método al cerrar',
          esperado_json JSON NULL COMMENT 'Calculado por el sistema desde venta.metodo_pago del turno',
          diferencia_json JSON NULL COMMENT 'declarado - esperado, por método',
          observaciones TEXT NULL,
          PRIMARY KEY (id_turno),
          KEY idx_turno_tenant_estado (id_tenant, estado),
          KEY idx_turno_sucursal (id_sucursal, estado)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);
      console.log("[creado] caja_turno.");
    }
  } finally {
    await cx.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:migrate:caja-turno] ${error.message}`);
  process.exitCode = 1;
});
