import mysql from "mysql2/promise";
import {
  ECOMMERCE_DATABASE,
  HOST,
  PASSWORD,
  PORT_DB,
  USER,
} from "../../src/config.js";

/**
 * Catálogo de atributos por tienda + snapshot en orden_item + id_variante en galería.
 * Uso: ALLOW_REMOTE_MIGRATE=1 npm run db:migrate:ecommerce-attrs
 */

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

  const columnExists = async (tabla, col) => {
    const [rows] = await cx.query(
      `SELECT 1 FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
      [ECOMMERCE_DATABASE, tabla, col]
    );
    return rows.length > 0;
  };

  try {
    if (!(await tableExists("ecom_atributo"))) {
      await cx.query(`
        CREATE TABLE ecom_atributo (
          id_atributo INT NOT NULL AUTO_INCREMENT,
          id_tienda INT NOT NULL,
          codigo VARCHAR(64) NOT NULL,
          nombre VARCHAR(120) NOT NULL,
          tipo ENUM(
            'texto','numero','seleccion','seleccion_multiple','booleano','rango','color','medida'
          ) NOT NULL DEFAULT 'seleccion',
          es_variante TINYINT(1) NOT NULL DEFAULT 0,
          activo TINYINT(1) NOT NULL DEFAULT 1,
          orden INT NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id_atributo),
          UNIQUE KEY uq_ecom_attr_tienda_codigo (id_tienda, codigo),
          KEY idx_ecom_attr_tienda (id_tienda, activo, orden),
          CONSTRAINT fk_ecom_attr_tienda
            FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] ecom_atributo");
    } else {
      console.log("[omitido] ecom_atributo");
    }

    if (!(await tableExists("ecom_atributo_valor"))) {
      await cx.query(`
        CREATE TABLE ecom_atributo_valor (
          id_valor INT NOT NULL AUTO_INCREMENT,
          id_atributo INT NOT NULL,
          id_tienda INT NOT NULL,
          valor VARCHAR(160) NOT NULL,
          hex VARCHAR(16) NULL,
          orden INT NOT NULL DEFAULT 0,
          activo TINYINT(1) NOT NULL DEFAULT 1,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id_valor),
          KEY idx_ecom_attr_val (id_atributo, activo, orden),
          KEY idx_ecom_attr_val_tienda (id_tienda),
          CONSTRAINT fk_ecom_attr_val_attr
            FOREIGN KEY (id_atributo) REFERENCES ecom_atributo (id_atributo) ON DELETE CASCADE,
          CONSTRAINT fk_ecom_attr_val_tienda
            FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] ecom_atributo_valor");
    } else {
      console.log("[omitido] ecom_atributo_valor");
    }

    if (!(await tableExists("ecom_producto_atributo"))) {
      await cx.query(`
        CREATE TABLE ecom_producto_atributo (
          id_prod_attr INT NOT NULL AUTO_INCREMENT,
          id_producto INT NOT NULL,
          id_atributo INT NOT NULL,
          id_tienda INT NOT NULL,
          visible_storefront TINYINT(1) NOT NULL DEFAULT 1,
          requiere_seleccion TINYINT(1) NOT NULL DEFAULT 0,
          obligatorio TINYINT(1) NOT NULL DEFAULT 0,
          valor_fijo VARCHAR(255) NULL,
          orden INT NOT NULL DEFAULT 0,
          PRIMARY KEY (id_prod_attr),
          UNIQUE KEY uq_ecom_prod_attr (id_producto, id_atributo),
          KEY idx_ecom_prod_attr_tienda (id_tienda),
          CONSTRAINT fk_ecom_prod_attr_prod
            FOREIGN KEY (id_producto) REFERENCES producto (id_producto) ON DELETE CASCADE,
          CONSTRAINT fk_ecom_prod_attr_attr
            FOREIGN KEY (id_atributo) REFERENCES ecom_atributo (id_atributo) ON DELETE CASCADE,
          CONSTRAINT fk_ecom_prod_attr_tienda
            FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] ecom_producto_atributo");
    } else {
      console.log("[omitido] ecom_producto_atributo");
    }

    if (!(await tableExists("ecom_producto_atributo_valor"))) {
      await cx.query(`
        CREATE TABLE ecom_producto_atributo_valor (
          id INT NOT NULL AUTO_INCREMENT,
          id_prod_attr INT NOT NULL,
          id_valor INT NULL,
          id_tienda INT NOT NULL,
          valor_texto VARCHAR(255) NULL,
          PRIMARY KEY (id),
          UNIQUE KEY uq_ecom_pav (id_prod_attr, id_valor),
          CONSTRAINT fk_ecom_pav_pa
            FOREIGN KEY (id_prod_attr) REFERENCES ecom_producto_atributo (id_prod_attr) ON DELETE CASCADE,
          CONSTRAINT fk_ecom_pav_val
            FOREIGN KEY (id_valor) REFERENCES ecom_atributo_valor (id_valor) ON DELETE SET NULL,
          CONSTRAINT fk_ecom_pav_tienda
            FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] ecom_producto_atributo_valor");
    } else {
      console.log("[omitido] ecom_producto_atributo_valor");
    }

    if (await tableExists("orden_item")) {
      if (!(await columnExists("orden_item", "attrs_snapshot"))) {
        await cx.query(`ALTER TABLE orden_item ADD COLUMN attrs_snapshot JSON NULL`);
        console.log("[alter] orden_item.attrs_snapshot");
      } else {
        console.log("[omitido] orden_item.attrs_snapshot");
      }
    }

    if (await tableExists("producto_imagen")) {
      if (!(await columnExists("producto_imagen", "id_variante"))) {
        await cx.query(`ALTER TABLE producto_imagen ADD COLUMN id_variante INT NULL`);
        console.log("[alter] producto_imagen.id_variante");
      } else {
        console.log("[omitido] producto_imagen.id_variante");
      }
    }

    // Seed legacy talla/tonalidad desde attrs_json
    const [tiendas] = await cx.query(`SELECT id_tienda FROM tienda`);
    for (const t of tiendas) {
      const id_tienda = t.id_tienda;
      const [prods] = await cx.query(
        `SELECT id_producto, attrs_json FROM producto WHERE id_tienda = ?`,
        [id_tienda]
      );

      const tallas = new Map();
      const tonos = new Map();
      const prodTallas = new Map();
      const prodTonos = new Map();

      for (const p of prods) {
        let attrs = p.attrs_json;
        if (typeof attrs === "string") {
          try {
            attrs = JSON.parse(attrs);
          } catch {
            attrs = {};
          }
        }
        if (!attrs || typeof attrs !== "object") continue;
        const raw =
          attrs.atributos && typeof attrs.atributos === "object" ? attrs.atributos : attrs;
        const tallaList = Array.isArray(raw.talla) ? raw.talla : [];
        const tonoList = Array.isArray(raw.tonalidad)
          ? raw.tonalidad
          : Array.isArray(raw.color)
            ? raw.color
            : [];
        const tNorm = tallaList.map((x) => String(x).trim()).filter(Boolean);
        const cNorm = tonoList
          .map((x) => {
            if (typeof x === "string") return { nombre: x.trim(), hex: null };
            if (x && typeof x === "object") {
              return {
                nombre: String(x.nombre || "").trim(),
                hex: x.hex ? String(x.hex) : null,
              };
            }
            return null;
          })
          .filter((x) => x?.nombre);
        if (tNorm.length) {
          prodTallas.set(p.id_producto, tNorm);
          for (const v of tNorm) tallas.set(v.toLowerCase(), v);
        }
        if (cNorm.length) {
          prodTonos.set(p.id_producto, cNorm);
          for (const v of cNorm) {
            if (!tonos.has(v.nombre.toLowerCase())) tonos.set(v.nombre.toLowerCase(), v);
          }
        }
      }

      if (!tallas.size && !tonos.size) continue;

      const ensureAttr = async (codigo, nombre, tipo, es_variante, orden) => {
        const [[ex]] = await cx.query(
          `SELECT id_atributo FROM ecom_atributo WHERE id_tienda = ? AND codigo = ? LIMIT 1`,
          [id_tienda, codigo]
        );
        if (ex) return ex.id_atributo;
        const [ins] = await cx.query(
          `INSERT INTO ecom_atributo (id_tienda, codigo, nombre, tipo, es_variante, activo, orden)
           VALUES (?, ?, ?, ?, ?, 1, ?)`,
          [id_tienda, codigo, nombre, tipo, es_variante, orden]
        );
        return ins.insertId;
      };

      let idTalla = null;
      let idTono = null;
      if (tallas.size) idTalla = await ensureAttr("talla", "Talla", "seleccion", 1, 10);
      if (tonos.size) idTono = await ensureAttr("tonalidad", "Tonalidad", "color", 1, 20);

      const valorIds = new Map();
      const insertVal = async (id_atributo, valor, hex, orden) => {
        const key = `${id_atributo}:${valor.toLowerCase()}`;
        if (valorIds.has(key)) return valorIds.get(key);
        const [[ex]] = await cx.query(
          `SELECT id_valor FROM ecom_atributo_valor
           WHERE id_atributo = ? AND id_tienda = ? AND valor = ? LIMIT 1`,
          [id_atributo, id_tienda, valor]
        );
        if (ex) {
          valorIds.set(key, ex.id_valor);
          return ex.id_valor;
        }
        const [ins] = await cx.query(
          `INSERT INTO ecom_atributo_valor (id_atributo, id_tienda, valor, hex, orden, activo)
           VALUES (?, ?, ?, ?, ?, 1)`,
          [id_atributo, id_tienda, valor, hex, orden]
        );
        valorIds.set(key, ins.insertId);
        return ins.insertId;
      };

      let i = 0;
      for (const v of tallas.values()) await insertVal(idTalla, v, null, i++);
      i = 0;
      for (const v of tonos.values()) await insertVal(idTono, v.nombre, v.hex, i++);

      const linkProd = async (id_producto, id_atributo, values, esColor) => {
        const [[pa]] = await cx.query(
          `SELECT id_prod_attr FROM ecom_producto_atributo
           WHERE id_producto = ? AND id_atributo = ? LIMIT 1`,
          [id_producto, id_atributo]
        );
        let id_prod_attr = pa?.id_prod_attr;
        if (!id_prod_attr) {
          const [ins] = await cx.query(
            `INSERT INTO ecom_producto_atributo
              (id_producto, id_atributo, id_tienda, visible_storefront, requiere_seleccion, obligatorio, orden)
             VALUES (?, ?, ?, 1, 1, 1, ?)`,
            [id_producto, id_atributo, id_tienda, esColor ? 20 : 10]
          );
          id_prod_attr = ins.insertId;
        }
        for (const v of values) {
          const nombre = esColor ? v.nombre : v;
          const id_valor = valorIds.get(`${id_atributo}:${String(nombre).toLowerCase()}`);
          if (!id_valor) continue;
          await cx.query(
            `INSERT IGNORE INTO ecom_producto_atributo_valor (id_prod_attr, id_valor, id_tienda)
             VALUES (?, ?, ?)`,
            [id_prod_attr, id_valor, id_tienda]
          );
        }
      };

      for (const [id_producto, vals] of prodTallas) {
        await linkProd(id_producto, idTalla, vals, false);
      }
      for (const [id_producto, vals] of prodTonos) {
        await linkProd(id_producto, idTono, vals, true);
      }
      console.log(`[seed] tienda ${id_tienda} talla=${tallas.size} tono=${tonos.size}`);
    }

    console.log("Migración ecommerce_tenant_attributes OK");
  } finally {
    await cx.end();
  }
};

ejecutar().catch((err) => {
  console.error(err);
  process.exit(1);
});
