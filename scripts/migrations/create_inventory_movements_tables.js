import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * Migración para Transferencias Guiadas e Inventario Físico Ciego.
 *
 * Tablas creadas:
 * - `transferencia_guiada`: Cabecera de traslados multi-almacén (SOLICITADA -> DESPACHADA -> RECIBIDA/CANCELADA)
 * - `transferencia_guiada_detalle`: Detalle de SKUs, cantidades solicitadas, despachadas y recibidas
 * - `inventario_fisico`: Cabecera de auditorías de inventario ciego
 * - `inventario_fisico_detalle`: Conteo ciego por SKU con snapshot de stock/costo y diferencia calculada
 *
 * Uso: node scripts/migrations/create_inventory_movements_tables.js
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
    throw new Error("Migración cancelada: esta versión solo está autorizada para MySQL local.");
  }

  const cx = await mysql.createConnection({
    host: HOST, database: DATABASE, user: USER, password: PASSWORD, port: PORT_DB, connectTimeout: 5000,
  });

  try {
    if (await existeTabla(cx, "transferencia_guiada")) {
      console.log("[omitido] transferencia_guiada ya existía.");
    } else {
      await cx.query(`
        CREATE TABLE transferencia_guiada (
          id_transferencia INT NOT NULL AUTO_INCREMENT,
          id_tenant INT NOT NULL,
          id_almacen_origen INT NOT NULL,
          id_almacen_destino INT NOT NULL,
          codigo_transferencia VARCHAR(30) NOT NULL,
          estado ENUM('SOLICITADA', 'DESPACHADA', 'RECIBIDA', 'CANCELADA') NOT NULL DEFAULT 'SOLICITADA',
          glosa VARCHAR(255) NULL,
          id_usuario_solicita INT NOT NULL,
          id_usuario_despacha INT NULL,
          id_usuario_recibe INT NULL,
          f_solicitud DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          f_despacho DATETIME NULL,
          f_recepcion DATETIME NULL,
          observaciones TEXT NULL,
          PRIMARY KEY (id_transferencia),
          KEY idx_trans_tenant_estado (id_tenant, estado),
          KEY idx_trans_almacenes (id_tenant, id_almacen_origen, id_almacen_destino)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);
      console.log("[creado] transferencia_guiada.");
    }

    if (await existeTabla(cx, "transferencia_guiada_detalle")) {
      console.log("[omitido] transferencia_guiada_detalle ya existía.");
    } else {
      await cx.query(`
        CREATE TABLE transferencia_guiada_detalle (
          id_detalle INT NOT NULL AUTO_INCREMENT,
          id_transferencia INT NOT NULL,
          id_sku INT NOT NULL,
          cantidad_solicitada INT NOT NULL,
          cantidad_despachada INT NOT NULL DEFAULT 0,
          cantidad_recibida INT NOT NULL DEFAULT 0,
          observacion_item VARCHAR(255) NULL,
          PRIMARY KEY (id_detalle),
          KEY idx_trans_det_trans (id_transferencia),
          KEY idx_trans_det_sku (id_sku)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);
      console.log("[creado] transferencia_guiada_detalle.");
    }

    if (await existeTabla(cx, "inventario_fisico")) {
      console.log("[omitido] inventario_fisico ya existía.");
    } else {
      await cx.query(`
        CREATE TABLE inventario_fisico (
          id_inventario_fisico INT NOT NULL AUTO_INCREMENT,
          id_tenant INT NOT NULL,
          id_almacen INT NOT NULL,
          codigo_conteo VARCHAR(30) NOT NULL,
          titulo VARCHAR(150) NOT NULL,
          estado ENUM('EN_PROCESO', 'CONTEO_COMPLETADO', 'APLICADO', 'CANCELADO') NOT NULL DEFAULT 'EN_PROCESO',
          id_usuario_crea INT NOT NULL,
          id_usuario_aplica INT NULL,
          id_nota_ingreso_ajuste INT NULL,
          id_nota_salida_ajuste INT NULL,
          f_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          f_aplicacion DATETIME NULL,
          observaciones TEXT NULL,
          PRIMARY KEY (id_inventario_fisico),
          KEY idx_inv_fis_tenant_almacen (id_tenant, id_almacen, estado)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);
      console.log("[creado] inventario_fisico.");
    }

    if (await existeTabla(cx, "inventario_fisico_detalle")) {
      console.log("[omitido] inventario_fisico_detalle ya existía.");
    } else {
      await cx.query(`
        CREATE TABLE inventario_fisico_detalle (
          id_detalle INT NOT NULL AUTO_INCREMENT,
          id_inventario_fisico INT NOT NULL,
          id_sku INT NOT NULL,
          stock_sistema_snapshot INT NOT NULL DEFAULT 0,
          cantidad_contada INT NULL,
          diferencia INT NULL,
          costo_unitario_snapshot DECIMAL(12,4) NOT NULL DEFAULT 0.0000,
          observacion_item VARCHAR(255) NULL,
          PRIMARY KEY (id_detalle),
          KEY idx_inv_fis_det_inv (id_inventario_fisico),
          KEY idx_inv_fis_det_sku (id_sku)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);
      console.log("[creado] inventario_fisico_detalle.");
    }
  } finally {
    await cx.end();
  }
};

ejecutar().catch((error) => {
  console.error("Error al ejecutar migración:", error);
  process.exit(1);
});
