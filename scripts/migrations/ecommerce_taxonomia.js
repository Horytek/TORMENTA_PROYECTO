import mysql from "mysql2/promise";
import {
  ECOMMERCE_DATABASE,
  HOST,
  PASSWORD,
  PORT_DB,
  USER,
} from "../../src/config.js";

/**
 * Catálogo por tienda: marcas, categorías y tags (selects del producto).
 * Uso: ALLOW_REMOTE_MIGRATE=1 npm run db:migrate:ecommerce-taxonomia
 */

const TIPOS = new Set(["marca", "categoria", "tag"]);

function parseJson(v) {
  if (v == null) return null;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

const ejecutar = async () => {
  if (!HOST || !USER) {
    throw new Error("Falta configurar DB_HOST / DB_USERNAME en .env.");
  }
  if (
    !process.env.ALLOW_REMOTE_MIGRATE &&
    !["localhost", "127.0.0.1", "::1"].includes(String(HOST))
  ) {
    throw new Error(
      "Migración remota cancelada. Usa ALLOW_REMOTE_MIGRATE=1 (Railway / proxy)."
    );
  }

  const cx = await mysql.createConnection({
    host: HOST,
    database: ECOMMERCE_DATABASE,
    user: USER,
    password: PASSWORD,
    port: PORT_DB,
    connectTimeout: 15000,
    multipleStatements: true,
  });

  const tableExists = async (tabla) => {
    const [rows] = await cx.query(
      `SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? LIMIT 1`,
      [ECOMMERCE_DATABASE, tabla]
    );
    return rows.length > 0;
  };

  try {
    if (!(await tableExists("ecom_taxonomia"))) {
      await cx.query(`
        CREATE TABLE ecom_taxonomia (
          id_termino INT NOT NULL AUTO_INCREMENT,
          id_tienda INT NOT NULL,
          tipo ENUM('marca','categoria','tag') NOT NULL,
          nombre VARCHAR(80) NOT NULL,
          activo TINYINT(1) NOT NULL DEFAULT 1,
          orden INT NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id_termino),
          UNIQUE KEY uq_ecom_tax_tienda_tipo_nombre (id_tienda, tipo, nombre),
          KEY idx_ecom_tax_tienda_tipo (id_tienda, tipo, activo, orden),
          CONSTRAINT fk_ecom_tax_tienda
            FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] ecom_taxonomia");
    } else {
      console.log("[omitido] ecom_taxonomia");
    }

    const [productos] = await cx.query(
      `SELECT id_tienda, categoria, attrs_json FROM producto`
    );
    const seen = new Set();
    let inserted = 0;
    for (const p of productos) {
      const add = async (tipo, raw) => {
        const nombre = String(raw || "").trim().slice(0, 80);
        if (!nombre || !TIPOS.has(tipo)) return;
        const key = `${p.id_tienda}|${tipo}|${nombre.toLowerCase()}`;
        if (seen.has(key)) return;
        seen.add(key);
        try {
          await cx.query(
            `INSERT IGNORE INTO ecom_taxonomia (id_tienda, tipo, nombre, activo, orden)
             VALUES (?, ?, ?, 1, 0)`,
            [p.id_tienda, tipo, nombre]
          );
          inserted += 1;
        } catch {
          /* ignore */
        }
      };
      await add("categoria", p.categoria);
      const attrs = parseJson(p.attrs_json) || {};
      await add("marca", attrs.marca);
      if (Array.isArray(attrs.tags)) {
        for (const t of attrs.tags) await add("tag", t);
      }
    }
    console.log(`[seed] términos revisados=${seen.size} inserts_intentados=${inserted}`);
    console.log("Migración ecommerce_taxonomia OK");
  } finally {
    await cx.end();
  }
};

ejecutar().catch((err) => {
  console.error(err);
  process.exit(1);
});
