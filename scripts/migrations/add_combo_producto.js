import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";

/**
 * Combos/Kits de productos.
 *
 * `producto.es_combo` marca un producto como combo; su composición vive en
 * `combo_item` (qué productos y cuántas unidades de cada uno lo forman). El
 * combo NO tiene stock propio: al venderse se descuenta el stock de sus
 * componentes (ver `src/services/combos/comboRepository.js`).
 *
 * Uso: npm run db:migrate:combos
 */

const HOSTS_LOCALES = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"]);
const esHostLocal = (host) => HOSTS_LOCALES.has(String(host).trim().toLowerCase());

const existeColumna = async (cx, tabla, columna) => {
  const [filas] = await cx.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [DATABASE, tabla, columna]
  );
  return filas.length > 0;
};

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
    if (await existeColumna(cx, "producto", "es_combo")) {
      console.log("[omitido] producto.es_combo ya existe.");
    } else {
      await cx.query("ALTER TABLE producto ADD COLUMN es_combo TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Combo/kit: su stock se deriva de combo_item, no tiene inventario propio'");
      console.log("[creado] producto.es_combo.");
    }

    if (await existeTabla(cx, "combo_item")) {
      console.log("[omitido] combo_item ya existía.");
    } else {
      await cx.query(`
        CREATE TABLE combo_item (
          id_combo_item INT NOT NULL AUTO_INCREMENT,
          id_producto_combo INT NOT NULL COMMENT 'producto.id_producto con es_combo=1',
          id_producto_componente INT NOT NULL COMMENT 'producto real que se descuenta al vender el combo',
          cantidad DECIMAL(10,2) NOT NULL DEFAULT 1,
          id_tenant INT NOT NULL,
          PRIMARY KEY (id_combo_item),
          UNIQUE KEY uq_combo_componente (id_producto_combo, id_producto_componente, id_tenant),
          KEY idx_combo_item_combo (id_producto_combo, id_tenant)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);
      console.log("[creado] combo_item.");
    }
  } finally {
    await cx.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:migrate:combos] ${error.message}`);
  process.exitCode = 1;
});
