/**
 * ETL: db_tormenta.ecommerce_* → db_ecommerce (schema rediseñado).
 * Gate de conteos: aborta si new queda vacío con origen con datos.
 * Uso: ALLOW_REMOTE_MIGRATE=1 node src/scripts/migrate_ecommerce_to_dedicated_db.js [--force]
 */
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import {
  DATABASE,
  ECOMMERCE_DATABASE,
  HOST,
  PASSWORD,
  PORT_DB,
  USER,
} from "../config.js";
import { hashPassword } from "../utils/passwordUtil.js";

const force = process.argv.includes("--force");

function assertRemoteOk() {
  if (!process.env.ALLOW_REMOTE_MIGRATE && !["localhost", "127.0.0.1", "::1"].includes(String(HOST))) {
    throw new Error("Usa ALLOW_REMOTE_MIGRATE=1 para Railway.");
  }
}

async function count(cx, sql, params = []) {
  const [[row]] = await cx.query(sql, params);
  return Number(row.c || 0);
}

async function main() {
  assertRemoteOk();
  if (!HOST || !USER || !DATABASE) throw new Error("Falta config DB.");

  const dumpDir = path.resolve(".local/dumps");
  fs.mkdirSync(dumpDir, { recursive: true });

  const src = await mysql.createConnection({
    host: HOST,
    database: DATABASE,
    user: USER,
    password: PASSWORD,
    port: PORT_DB,
    connectTimeout: 20000,
  });
  const dst = await mysql.createConnection({
    host: HOST,
    database: ECOMMERCE_DATABASE,
    user: USER,
    password: PASSWORD,
    port: PORT_DB,
    connectTimeout: 20000,
  });

  try {
    // ¿Existen tablas origen?
    const [srcTables] = await src.query(
      `SELECT TABLE_NAME AS t FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE 'ecommerce_%'`,
      [DATABASE]
    );
    if (srcTables.length === 0) {
      throw new Error(`No hay tablas ecommerce_* en ${DATABASE}. ¿Ya se migró?`);
    }

    const existingTiendas = await count(dst, "SELECT COUNT(*) AS c FROM tienda");
    if (existingTiendas > 0 && !force) {
      throw new Error(
        `${ECOMMERCE_DATABASE}.tienda ya tiene ${existingTiendas} filas. Usa --force para re-ETL.`
      );
    }
    if (force && existingTiendas > 0) {
      console.log("[force] limpiando destino…");
      await dst.query("SET FOREIGN_KEY_CHECKS=0");
      for (const t of [
        "orden_item",
        "orden",
        "producto_imagen",
        "producto",
        "mp_cuenta",
        "suscripcion_pago",
        "usuario",
        "tienda",
        "plan",
      ]) {
        await dst.query(`TRUNCATE TABLE \`${t}\``);
      }
      await dst.query("SET FOREIGN_KEY_CHECKS=1");
      // re-seed plans
      await dst.query(`
        INSERT INTO plan (id_plan, codigo, nombre, precio_mensual, moneda, descripcion) VALUES
          (1, 'starter', 'Starter', 79.00, 'PEN', 'Tienda online con catálogo, carrito y Mercado Pago'),
          (2, 'pro', 'Pro', 129.00, 'PEN', 'Starter + más productos y soporte prioritario')
      `);
    }

    const old = {
      plan: await count(src, "SELECT COUNT(*) AS c FROM ecommerce_plan"),
      tienda: await count(src, "SELECT COUNT(*) AS c FROM ecommerce_tienda"),
      usuario: await count(src, "SELECT COUNT(*) AS c FROM ecommerce_usuario"),
      producto: await count(src, "SELECT COUNT(*) AS c FROM ecommerce_producto"),
      imagen: await count(src, "SELECT COUNT(*) AS c FROM ecommerce_producto_imagen"),
      mp: await count(src, "SELECT COUNT(*) AS c FROM ecommerce_mp_credenciales"),
      orden: await count(src, "SELECT COUNT(*) AS c FROM ecommerce_orden"),
      detalle: await count(src, "SELECT COUNT(*) AS c FROM ecommerce_orden_detalle"),
      saas: await count(src, "SELECT COUNT(*) AS c FROM ecommerce_pago_saas"),
    };
    console.log("[origen]", JSON.stringify(old));

    // Dump counts metadata only (no PII payloads in chat); full row dump as JSON lines without tokens if needed
    const metaPath = path.join(dumpDir, `ecommerce_precut_counts_${Date.now()}.json`);
    fs.writeFileSync(metaPath, JSON.stringify({ database: DATABASE, at: new Date().toISOString(), old }, null, 2));
    console.log(`[dump] conteos → ${metaPath}`);

    // Plans
    const [plans] = await src.query("SELECT * FROM ecommerce_plan");
    if (plans.length === 0) {
      // keep seed from migrate script
    } else {
      for (const p of plans) {
        await dst.query(
          `INSERT INTO plan (id_plan, codigo, nombre, precio_mensual, moneda, descripcion, activo)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), precio_mensual=VALUES(precio_mensual),
             moneda=VALUES(moneda), descripcion=VALUES(descripcion), activo=VALUES(activo)`,
          [
            p.id_plan,
            p.codigo,
            p.nombre,
            p.precio_mensual,
            p.moneda || "PEN",
            p.descripcion ?? null,
            p.activo ?? 1,
          ]
        );
      }
    }

    // Tiendas
    const [tiendas] = await src.query("SELECT * FROM ecommerce_tienda");
    for (const t of tiendas) {
      await dst.query(
        `INSERT INTO tienda
          (id_tienda, id_plan, slug, nombre, email, telefono, estado, color_primario, logo_url,
           theme_json, descripcion, fecha_pago, legacy_tenant_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          t.id_tienda,
          t.id_plan,
          t.slug,
          t.nombre,
          t.email,
          t.telefono ?? null,
          t.estado,
          t.color_primario ?? "#0E7C7B",
          t.logo_url ?? null,
          t.theme_json ? (typeof t.theme_json === "string" ? t.theme_json : JSON.stringify(t.theme_json)) : null,
          t.descripcion ?? null,
          t.fecha_pago ?? null,
          t.id_tenant ?? null,
          t.created_at ?? null,
          t.updated_at ?? null,
        ]
      );
    }

    const tenantToTienda = new Map(tiendas.map((t) => [Number(t.id_tenant), Number(t.id_tienda)]));

    // Usuarios
    const [usuarios] = await src.query("SELECT * FROM ecommerce_usuario");
    const expires = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    for (const u of usuarios) {
      const id_tienda = tenantToTienda.get(Number(u.id_tenant));
      if (!id_tienda) {
        console.warn(`[skip usuario] id_tenant=${u.id_tenant} sin tienda`);
        continue;
      }
      let tempHash = null;
      let tempExp = null;
      if (u.clave_acceso) {
        tempHash = await hashPassword(String(u.clave_acceso));
        tempExp = expires;
      }
      await dst.query(
        `INSERT INTO usuario
          (id_usuario, id_tienda, usua, password_hash, temp_password_hash, temp_password_expires_at,
           email, nombre, rol, estado, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          u.id_usuario,
          id_tienda,
          u.usua,
          u.password_hash,
          tempHash,
          tempExp,
          u.email,
          u.nombre ?? null,
          u.rol || "admin",
          u.estado ?? 0,
          u.created_at ?? null,
        ]
      );
    }

    // Productos
    const [productos] = await src.query("SELECT * FROM ecommerce_producto");
    for (const p of productos) {
      const id_tienda = tenantToTienda.get(Number(p.id_tenant));
      if (!id_tienda) continue;
      let attrs = p.attrs_json;
      if (typeof attrs === "string") {
        try {
          attrs = JSON.parse(attrs);
        } catch {
          attrs = null;
        }
      }
      const categoria =
        attrs && typeof attrs === "object" && typeof attrs.categoria === "string"
          ? attrs.categoria
          : null;
      await dst.query(
        `INSERT INTO producto
          (id_producto, id_tienda, nombre, descripcion, precio, stock, stock_min, activo, sku, categoria, attrs_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.id_producto,
          id_tienda,
          p.nombre,
          p.descripcion ?? null,
          p.precio,
          p.stock,
          p.stock_min ?? 5,
          p.activo ?? 1,
          p.sku ?? null,
          categoria,
          attrs ? JSON.stringify(attrs) : null,
          p.created_at ?? null,
          p.updated_at ?? null,
        ]
      );
    }

    // Imágenes
    const [imagenes] = await src.query("SELECT * FROM ecommerce_producto_imagen");
    for (const i of imagenes) {
      const id_tienda = tenantToTienda.get(Number(i.id_tenant));
      if (!id_tienda) continue;
      await dst.query(
        `INSERT INTO producto_imagen
          (id_imagen, id_tienda, id_producto, url, file_id, orden, es_principal, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          i.id_imagen,
          id_tienda,
          i.id_producto,
          i.url,
          i.file_id ?? null,
          i.orden ?? 0,
          i.es_principal ?? 0,
          i.created_at ?? null,
        ]
      );
    }

    // MP
    const [mps] = await src.query("SELECT * FROM ecommerce_mp_credenciales");
    for (const m of mps) {
      const id_tienda = tenantToTienda.get(Number(m.id_tenant));
      if (!id_tienda) continue;
      await dst.query(
        `INSERT INTO mp_cuenta (id_tienda, public_key, access_token_enc, modo, conectado_en)
         VALUES (?, ?, ?, ?, ?)`,
        [id_tienda, m.public_key, m.access_token_enc, m.modo || "test", m.conectado_en ?? null]
      );
    }

    // Órdenes
    const [ordenes] = await src.query("SELECT * FROM ecommerce_orden");
    for (const o of ordenes) {
      const id_tienda = tenantToTienda.get(Number(o.id_tenant));
      if (!id_tienda) continue;
      await dst.query(
        `INSERT INTO orden
          (id_orden, id_tienda, codigo, estado, total, moneda, email_comprador, nombre_comprador,
           telefono_comprador, mp_preference_id, mp_payment_id, external_reference, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          o.id_orden,
          id_tienda,
          o.codigo,
          o.estado,
          o.total,
          o.moneda || "PEN",
          o.email_comprador ?? null,
          o.nombre_comprador ?? null,
          o.telefono_comprador ?? null,
          o.mp_preference_id ?? null,
          o.mp_payment_id ?? null,
          o.external_reference ?? null,
          o.created_at ?? null,
          o.updated_at ?? null,
        ]
      );
    }

    const [detalles] = await src.query("SELECT * FROM ecommerce_orden_detalle");
    for (const d of detalles) {
      const id_tienda = tenantToTienda.get(Number(d.id_tenant));
      if (!id_tienda) continue;
      await dst.query(
        `INSERT INTO orden_item
          (id_detalle, id_orden, id_tienda, id_producto, nombre_snapshot, cantidad, precio_unitario)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          d.id_detalle,
          d.id_orden,
          id_tienda,
          d.id_producto,
          d.nombre_snapshot,
          d.cantidad,
          d.precio_unitario,
        ]
      );
    }

    // SaaS pagos
    const [saas] = await src.query("SELECT * FROM ecommerce_pago_saas");
    for (const s of saas) {
      await dst.query(
        `INSERT INTO suscripcion_pago
          (id, id_tienda, mp_payment_id, mp_preference_id, status, amount, external_reference, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          s.id,
          s.id_tienda,
          s.mp_payment_id,
          s.mp_preference_id ?? null,
          s.status,
          s.amount ?? null,
          s.external_reference ?? null,
          s.created_at ?? null,
        ]
      );
    }

    // Reset AUTO_INCREMENT hints
    for (const [table, col] of [
      ["tienda", "id_tienda"],
      ["usuario", "id_usuario"],
      ["producto", "id_producto"],
      ["producto_imagen", "id_imagen"],
      ["orden", "id_orden"],
      ["orden_item", "id_detalle"],
      ["suscripcion_pago", "id"],
    ]) {
      const [[mx]] = await dst.query(`SELECT COALESCE(MAX(${col}), 0) + 1 AS n FROM \`${table}\``);
      await dst.query(`ALTER TABLE \`${table}\` AUTO_INCREMENT = ?`, [mx.n]);
    }

    const neu = {
      plan: await count(dst, "SELECT COUNT(*) AS c FROM plan"),
      tienda: await count(dst, "SELECT COUNT(*) AS c FROM tienda"),
      usuario: await count(dst, "SELECT COUNT(*) AS c FROM usuario"),
      producto: await count(dst, "SELECT COUNT(*) AS c FROM producto"),
      imagen: await count(dst, "SELECT COUNT(*) AS c FROM producto_imagen"),
      mp: await count(dst, "SELECT COUNT(*) AS c FROM mp_cuenta"),
      orden: await count(dst, "SELECT COUNT(*) AS c FROM orden"),
      detalle: await count(dst, "SELECT COUNT(*) AS c FROM orden_item"),
      saas: await count(dst, "SELECT COUNT(*) AS c FROM suscripcion_pago"),
    };
    console.log("[destino]", JSON.stringify(neu));

    const checks = [
      ["plan", old.plan, neu.plan],
      ["tienda", old.tienda, neu.tienda],
      ["usuario", old.usuario, neu.usuario],
      ["producto", old.producto, neu.producto],
      ["imagen", old.imagen, neu.imagen],
      ["mp", old.mp, neu.mp],
      ["orden", old.orden, neu.orden],
      ["detalle", old.detalle, neu.detalle],
      ["saas", old.saas, neu.saas],
    ];
    const failures = [];
    for (const [name, o, n] of checks) {
      if (o > 0 && n === 0) failures.push(`${name}: origen=${o} destino=0 (vacío prohibido)`);
      else if (n < o) failures.push(`${name}: origen=${o} destino=${n} (faltan filas)`);
    }
    // plan: si old=0, new debe tener al menos seed (2)
    if (old.plan === 0 && neu.plan < 2) failures.push("plan: seed starter/pro ausente");

    if (failures.length) {
      throw new Error(`Gate de integridad falló:\n- ${failures.join("\n- ")}`);
    }

    console.log(JSON.stringify({ ok: true, old, neu, message: "ETL OK — listo para cutover app + DROP tormenta" }));
  } finally {
    await src.end();
    await dst.end();
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exitCode = 1;
});
