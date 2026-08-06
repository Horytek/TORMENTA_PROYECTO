import crypto from "crypto";
import axios from "axios";
import jwt from "jsonwebtoken";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { Resend } from "resend";
import { getConnection } from "../database/database.js";
import { TOKEN_SECRET } from "../config.js";
import { getEcommercePlan, validateEcommercePlanPrice } from "../config/ecommercePlans.config.js";
import { hashPassword, verifyPassword } from "../utils/passwordUtil.js";
import { encryptMpToken, decryptMpToken } from "../utils/ecommerceCrypto.js";
import { uploadImage as subirAImageKit, deleteImage as borrarDeImageKit } from "../services/imagekit.service.js";

const resend = new Resend(process.env.RESEND_API_KEY);
const FRONTEND = () => process.env.FRONTEND_URL || "http://localhost:5173";
const WEBHOOK_BASE = () => String(process.env.WEBHOOK_PUBLIC_URL || "").replace(/\/$/, "");

function slugifyBase(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function generateCredentials(slug) {
  const usua = `ecom_${slugifyBase(slug).slice(0, 20)}_${crypto.randomBytes(2).toString("hex")}`;
  const clave = crypto.randomBytes(4).toString("hex");
  return { usua, clave };
}

function orderCode() {
  return `EC${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
}

function platformMpClient() {
  return new MercadoPagoConfig({ accessToken: process.env.ACCESS_TOKEN });
}

function sellerMpClient(accessToken) {
  return new MercadoPagoConfig({ accessToken });
}

/** Activación post-pago SaaS (llamado desde payment webhook). Idempotente. */
export async function activateEcommerceFromPayment({ connection, externalReference, payment }) {
  if (!externalReference || !String(externalReference).startsWith("ecommerce:")) {
    return { handled: false };
  }
  const id_tienda = Number(String(externalReference).split(":")[1]);
  if (!Number.isFinite(id_tienda) || id_tienda <= 0) return { handled: false };

  const [[tienda]] = await connection.query(
    `SELECT t.*, u.id_usuario, u.usua, u.clave_acceso, u.email AS user_email
     FROM ecommerce_tienda t
     LEFT JOIN ecommerce_usuario u ON u.id_tenant = t.id_tenant
     WHERE t.id_tienda = ? LIMIT 1`,
    [id_tienda]
  );
  if (!tienda) return { handled: true, activated: false };

  const mpId = String(payment.id);
  const [[existingSaas]] = await connection.query(
    `SELECT id FROM ecommerce_pago_saas WHERE mp_payment_id = ? LIMIT 1`,
    [mpId]
  );
  if (existingSaas) return { handled: true, activated: false, already: true };

  await connection.query(
    `INSERT INTO ecommerce_pago_saas
      (id_tienda, id_tenant, mp_payment_id, mp_preference_id, status, amount, external_reference)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      tienda.id_tienda,
      tienda.id_tenant,
      mpId,
      payment.preference_id || null,
      payment.status,
      payment.transaction_amount ?? null,
      externalReference,
    ]
  );

  if (String(payment.status).toLowerCase() !== "approved") {
    return { handled: true, activated: false };
  }

  const wasPending = tienda.estado === "pending";
  await connection.query(
    `UPDATE ecommerce_tienda SET estado = 'active', fecha_pago = CURDATE() WHERE id_tienda = ? AND id_tenant = ?`,
    [tienda.id_tienda, tienda.id_tenant]
  );
  await connection.query(
    `UPDATE ecommerce_usuario SET estado = 1 WHERE id_tenant = ?`,
    [tienda.id_tenant]
  );

  if (wasPending && tienda.clave_acceso && tienda.usua) {
    const loginUrl = `${FRONTEND()}/login?mode=ecommerce`;
    const storeUrl = `${FRONTEND()}/tienda/${tienda.slug}`;
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM || "Horytek Ecommerce <no-reply@send.horycore.online>",
        to: tienda.email,
        subject: "Tu tienda Horytek Ecommerce está lista",
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a">
            <h1 style="font-size:22px;margin:0 0 12px">¡Pago aprobado!</h1>
            <p>Tu tienda <strong>${tienda.nombre}</strong> ya está activa.</p>
            <ul>
              <li><b>Usuario admin:</b> ${tienda.usua}</li>
              <li><b>Contraseña temporal:</b> ${tienda.clave_acceso}</li>
              <li><b>Panel:</b> <a href="${loginUrl}">${loginUrl}</a></li>
              <li><b>Tienda pública:</b> <a href="${storeUrl}">${storeUrl}</a></li>
            </ul>
            <p style="color:#64748b;font-size:13px">Configura tus credenciales de Mercado Pago en el admin para empezar a cobrar.</p>
          </div>`,
      });
    } catch (err) {
      console.error("[ecommerce] Resend activación:", err.message);
    }
  }

  return { handled: true, activated: wasPending, tienda };
}

// ─── Registro + preferencia SaaS ───────────────────────────────────────────

export const registerEcommerce = async (req, res) => {
  const { nombre, slug, email, telefono, plan } = req.body;
  const planInfo = getEcommercePlan(plan);
  if (!planInfo.isValid) {
    return res.status(400).json({ success: false, message: "Plan inválido." });
  }

  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const [dup] = await connection.query(
      `SELECT slug, email FROM ecommerce_tienda WHERE slug = ? OR email = ? LIMIT 1`,
      [slug, email]
    );
    if (dup.length) {
      await connection.rollback();
      const msg = dup[0].email === email ? "Email ya registrado." : "Slug ya en uso.";
      return res.status(400).json({ success: false, message: msg });
    }

    const [[maxRow]] = await connection.query(
      `SELECT COALESCE(MAX(id_tenant), 800000) AS m FROM ecommerce_tienda`
    );
    const id_tenant = Number(maxRow.m) + 1;
    const { usua, clave } = generateCredentials(slug);
    const password_hash = await hashPassword(clave);

    const [ins] = await connection.query(
      `INSERT INTO ecommerce_tienda
        (id_tenant, id_plan, slug, nombre, email, telefono, estado)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [id_tenant, planInfo.id, slug, nombre, email, telefono || null]
    );
    const id_tienda = ins.insertId;

    await connection.query(
      `INSERT INTO ecommerce_usuario
        (id_tenant, usua, password_hash, clave_acceso, email, nombre, rol, estado)
       VALUES (?, ?, ?, ?, ?, ?, 'admin', 0)`,
      [id_tenant, usua, password_hash, clave, email, nombre]
    );

    await connection.commit();
    return res.status(201).json({
      success: true,
      data: {
        id_tienda,
        id_tenant,
        slug,
        email,
        plan: planInfo.codigo,
        price: planInfo.price,
        message: "Cuenta creada. Completa el pago para activar.",
      },
    });
  } catch (error) {
    if (connection) try { await connection.rollback(); } catch { /* noop */ }
    console.error("[ecommerce.register]", error);
    return res.status(500).json({ success: false, message: "Error al registrar la tienda." });
  } finally {
    if (connection) connection.release();
  }
};

export const createEcommerceSaasPreference = async (req, res) => {
  const { id_tienda, plan } = req.body;
  const planInfo = getEcommercePlan(plan);
  if (!planInfo.isValid) {
    return res.status(400).json({ success: false, message: "Plan inválido." });
  }

  let connection;
  try {
    connection = await getConnection();
    const [[tienda]] = await connection.query(
      `SELECT id_tienda, email, nombre, estado, id_plan FROM ecommerce_tienda WHERE id_tienda = ? LIMIT 1`,
      [id_tienda]
    );
    if (!tienda) {
      return res.status(404).json({ success: false, message: "Tienda no encontrada." });
    }
    if (tienda.estado === "active") {
      return res.status(400).json({ success: false, message: "La tienda ya está activa." });
    }
    if (Number(tienda.id_plan) !== Number(planInfo.id)) {
      await connection.query(`UPDATE ecommerce_tienda SET id_plan = ? WHERE id_tienda = ?`, [
        planInfo.id,
        id_tienda,
      ]);
    }

    const origin = FRONTEND();
    const notification_url = `${WEBHOOK_BASE()}/api/webhook`;
    const preference = new Preference(platformMpClient());
    const result = await preference.create({
      body: {
        items: [
          {
            id: `ECOM_${planInfo.codigo.toUpperCase()}`,
            title: `Horytek Ecommerce — Plan ${planInfo.nombre}`,
            quantity: 1,
            unit_price: Number(planInfo.price),
            currency_id: planInfo.currency,
            description: `Suscripción mensual ${planInfo.nombre}`,
          },
        ],
        payer: { email: tienda.email },
        external_reference: `ecommerce:${tienda.id_tienda}`,
        back_urls: {
          success: `${origin}/success`,
          failure: `${origin}/failure`,
          pending: `${origin}/pending`,
        },
        notification_url,
      },
    });

    return res.json({
      success: true,
      id: result.id,
      init_point: result.init_point || result.sandbox_init_point,
    });
  } catch (error) {
    console.error("[ecommerce.createPreference]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error al crear preferencia.",
    });
  } finally {
    if (connection) connection.release();
  }
};

export const listEcommercePlans = async (_req, res) => {
  return res.json({
    success: true,
    data: Object.values(
      (await import("../config/ecommercePlans.config.js")).ECOMMERCE_PLANS_CONFIG
    ).map((p) => ({
      id: p.codigo,
      id_plan: p.id,
      name: p.nombre,
      price: p.monthly,
      currency: p.currencySymbol,
    })),
  });
};

// ─── Auth ──────────────────────────────────────────────────────────────────

export const loginEcommerce = async (req, res) => {
  const { usuario, password } = req.body;
  let connection;
  try {
    connection = await getConnection();
    const [[user]] = await connection.query(
      `SELECT u.*, t.estado AS tienda_estado, t.slug, t.nombre AS tienda_nombre
       FROM ecommerce_usuario u
       JOIN ecommerce_tienda t ON t.id_tenant = u.id_tenant
       WHERE u.usua = ? OR u.email = ?
       LIMIT 1`,
      [usuario, usuario]
    );
    if (!user) {
      return res.status(401).json({ success: false, message: "Credenciales inválidas." });
    }
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok && user.clave_acceso !== password) {
      return res.status(401).json({ success: false, message: "Credenciales inválidas." });
    }
    if (user.tienda_estado === "pending") {
      return res.status(403).json({
        success: false,
        code: "ECOMMERCE_PENDING",
        message: "Completa el pago para activar tu tienda.",
        id_tienda: null,
      });
    }
    if (user.tienda_estado !== "active" || !user.estado) {
      return res.status(403).json({
        success: false,
        message: "Cuenta suspendida o inactiva.",
      });
    }

    const token = jwt.sign(
      {
        sub: user.id_usuario,
        usr: user.usua,
        ten: user.id_tenant,
        rol: user.rol,
      },
      TOKEN_SECRET,
      {
        expiresIn: "8h",
        algorithm: "HS256",
        issuer: "horytek-backend",
        audience: "horytek-ecommerce",
      }
    );

    return res.json({
      success: true,
      data: {
        token,
        usuario: user.usua,
        email: user.email,
        id_tenant: user.id_tenant,
        slug: user.slug,
        tienda: user.tienda_nombre,
      },
    });
  } catch (error) {
    console.error("[ecommerce.login]", error);
    return res.status(500).json({ success: false, message: "Error al iniciar sesión." });
  } finally {
    if (connection) connection.release();
  }
};

export const meEcommerce = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const [[tienda]] = await connection.query(
      `SELECT id_tienda, id_tenant, slug, nombre, email, telefono, estado, color_primario, logo_url, descripcion, id_plan
       FROM ecommerce_tienda WHERE id_tenant = ? LIMIT 1`,
      [req.id_tenant]
    );
    const [[mp]] = await connection.query(
      `SELECT public_key, modo, conectado_en FROM ecommerce_mp_credenciales WHERE id_tenant = ? LIMIT 1`,
      [req.id_tenant]
    );
    return res.json({
      success: true,
      data: {
        ...req.ecommerceUser,
        tienda,
        mp_conectado: Boolean(mp),
        mp_public_key: mp?.public_key || null,
        mp_modo: mp?.modo || null,
      },
    });
  } catch (error) {
    console.error("[ecommerce.me]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

// ─── Admin: tienda / MP / productos / órdenes / dashboard ─────────────────

export const updateTienda = async (req, res) => {
  const { nombre, descripcion, color_primario, telefono } = req.body;
  let connection;
  try {
    connection = await getConnection();
    await connection.query(
      `UPDATE ecommerce_tienda SET
        nombre = COALESCE(?, nombre),
        descripcion = COALESCE(?, descripcion),
        color_primario = COALESCE(?, color_primario),
        telefono = COALESCE(?, telefono)
       WHERE id_tenant = ?`,
      [nombre ?? null, descripcion ?? null, color_primario ?? null, telefono ?? null, req.id_tenant]
    );
    return res.json({ success: true });
  } catch (error) {
    console.error("[ecommerce.updateTienda]", error);
    return res.status(500).json({ success: false, message: "Error al actualizar." });
  } finally {
    if (connection) connection.release();
  }
};

export const saveMpCredentials = async (req, res) => {
  const { public_key, access_token, modo } = req.body;
  let connection;
  try {
    const enc = encryptMpToken(access_token);
    connection = await getConnection();
    await connection.query(
      `INSERT INTO ecommerce_mp_credenciales (id_tenant, public_key, access_token_enc, modo, conectado_en)
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         public_key = VALUES(public_key),
         access_token_enc = VALUES(access_token_enc),
         modo = VALUES(modo),
         conectado_en = NOW()`,
      [req.id_tenant, public_key, enc, modo || "test"]
    );
    return res.json({ success: true, message: "Credenciales guardadas." });
  } catch (error) {
    console.error("[ecommerce.saveMp]", error);
    return res.status(500).json({ success: false, message: "Error al guardar credenciales." });
  } finally {
    if (connection) connection.release();
  }
};

export const getDashboard = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const [[stats]] = await connection.query(
      `SELECT
         (SELECT COUNT(*) FROM ecommerce_producto WHERE id_tenant = ? AND activo = 1) AS productos,
         (SELECT COUNT(*) FROM ecommerce_orden WHERE id_tenant = ? AND estado = 'approved') AS ordenes_aprobadas,
         (SELECT COALESCE(SUM(total),0) FROM ecommerce_orden WHERE id_tenant = ? AND estado = 'approved') AS ventas,
         (SELECT COUNT(*) FROM ecommerce_producto WHERE id_tenant = ? AND activo = 1 AND stock <= stock_min) AS stock_bajo`,
      [req.id_tenant, req.id_tenant, req.id_tenant, req.id_tenant]
    );
    const [recientes] = await connection.query(
      `SELECT id_orden, codigo, estado, total, email_comprador, created_at
       FROM ecommerce_orden WHERE id_tenant = ?
       ORDER BY created_at DESC LIMIT 8`,
      [req.id_tenant]
    );
    return res.json({ success: true, data: { stats, recientes } });
  } catch (error) {
    console.error("[ecommerce.dashboard]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const listProductos = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.query(
      `SELECT p.*,
         (SELECT url FROM ecommerce_producto_imagen i
          WHERE i.id_producto = p.id_producto AND i.id_tenant = p.id_tenant
          ORDER BY i.es_principal DESC, i.orden ASC LIMIT 1) AS imagen_url
       FROM ecommerce_producto p
       WHERE p.id_tenant = ?
       ORDER BY p.id_producto DESC`,
      [req.id_tenant]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("[ecommerce.listProductos]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const createProducto = async (req, res) => {
  const { nombre, descripcion, precio, stock, stock_min, activo, sku, attrs_json } = req.body;
  let connection;
  try {
    connection = await getConnection();
    const [r] = await connection.query(
      `INSERT INTO ecommerce_producto
        (id_tenant, nombre, descripcion, precio, stock, stock_min, activo, sku, attrs_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.id_tenant,
        nombre,
        descripcion || null,
        precio,
        stock ?? 0,
        stock_min ?? 5,
        activo === false ? 0 : 1,
        sku || null,
        attrs_json ? JSON.stringify(attrs_json) : null,
      ]
    );
    return res.status(201).json({ success: true, data: { id_producto: r.insertId } });
  } catch (error) {
    console.error("[ecommerce.createProducto]", error);
    return res.status(500).json({ success: false, message: "Error al crear producto." });
  } finally {
    if (connection) connection.release();
  }
};

export const updateProducto = async (req, res) => {
  const id = Number(req.params.id);
  const { nombre, descripcion, precio, stock, stock_min, activo, sku, attrs_json } = req.body;
  let connection;
  try {
    connection = await getConnection();
    const [r] = await connection.query(
      `UPDATE ecommerce_producto SET
        nombre = COALESCE(?, nombre),
        descripcion = COALESCE(?, descripcion),
        precio = COALESCE(?, precio),
        stock = COALESCE(?, stock),
        stock_min = COALESCE(?, stock_min),
        activo = COALESCE(?, activo),
        sku = COALESCE(?, sku),
        attrs_json = COALESCE(?, attrs_json)
       WHERE id_producto = ? AND id_tenant = ?`,
      [
        nombre ?? null,
        descripcion ?? null,
        precio ?? null,
        stock ?? null,
        stock_min ?? null,
        typeof activo === "boolean" ? (activo ? 1 : 0) : null,
        sku ?? null,
        attrs_json != null ? JSON.stringify(attrs_json) : null,
        id,
        req.id_tenant,
      ]
    );
    if (!r.affectedRows) {
      return res.status(404).json({ success: false, message: "Producto no encontrado." });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error("[ecommerce.updateProducto]", error);
    return res.status(500).json({ success: false, message: "Error al actualizar." });
  } finally {
    if (connection) connection.release();
  }
};

export const deleteProducto = async (req, res) => {
  const id = Number(req.params.id);
  let connection;
  try {
    connection = await getConnection();
    const [imgs] = await connection.query(
      `SELECT file_id FROM ecommerce_producto_imagen WHERE id_producto = ? AND id_tenant = ?`,
      [id, req.id_tenant]
    );
    for (const img of imgs) {
      if (img.file_id) {
        try { await borrarDeImageKit(img.file_id); } catch { /* noop */ }
      }
    }
    const [r] = await connection.query(
      `DELETE FROM ecommerce_producto WHERE id_producto = ? AND id_tenant = ?`,
      [id, req.id_tenant]
    );
    if (!r.affectedRows) {
      return res.status(404).json({ success: false, message: "Producto no encontrado." });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error("[ecommerce.deleteProducto]", error);
    return res.status(500).json({ success: false, message: "Error al eliminar." });
  } finally {
    if (connection) connection.release();
  }
};

export const uploadProductoImagen = async (req, res) => {
  const id_producto = Number(req.params.id);
  const { file, fileName } = req.body || {};
  if (!file) {
    return res.status(400).json({ success: false, message: "Archivo requerido (base64)." });
  }

  const safeName = String(fileName || `ecom-${id_producto}.jpg`).replace(/[^\w.\-]+/g, "_");
  const extension = safeName.split(".").pop()?.toLowerCase() || "jpg";
  const allowed = new Set(["png", "jpg", "jpeg", "webp", "gif"]);
  if (!allowed.has(extension)) {
    return res.status(400).json({
      success: false,
      message: `Tipo no permitido. Usa: ${[...allowed].join(", ")}`,
    });
  }

  let connection;
  try {
    connection = await getConnection();
    const [[prod]] = await connection.query(
      `SELECT id_producto FROM ecommerce_producto WHERE id_producto = ? AND id_tenant = ? LIMIT 1`,
      [id_producto, req.id_tenant]
    );
    if (!prod) {
      return res.status(404).json({ success: false, message: "Producto no encontrado." });
    }

    const [[count]] = await connection.query(
      `SELECT COUNT(*) AS c FROM ecommerce_producto_imagen WHERE id_producto = ? AND id_tenant = ?`,
      [id_producto, req.id_tenant]
    );
    connection.release();
    connection = null;

    // Subida externa sin retener conexión del pool.
    const uploaded = await subirAImageKit({
      file,
      fileName: `ecom_${id_producto}_${Date.now()}.${extension}`,
      folder: `/ecommerce/${req.id_tenant}/`,
    });

    connection = await getConnection();
    const es_principal = count.c === 0 ? 1 : 0;
    const [ins] = await connection.query(
      `INSERT INTO ecommerce_producto_imagen
        (id_tenant, id_producto, url, file_id, orden, es_principal)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.id_tenant, id_producto, uploaded.url, uploaded.fileId, count.c, es_principal]
    );

    return res.status(201).json({
      success: true,
      data: { id_imagen: ins.insertId, url: uploaded.url, file_id: uploaded.fileId },
    });
  } catch (error) {
    console.error("[ecommerce.uploadImagen]", error);
    return res.status(500).json({ success: false, message: error.message || "Error al subir imagen." });
  } finally {
    if (connection) connection.release();
  }
};

export const listOrdenes = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.query(
      `SELECT id_orden, codigo, estado, total, moneda, email_comprador, nombre_comprador, mp_payment_id, created_at
       FROM ecommerce_orden WHERE id_tenant = ?
       ORDER BY created_at DESC LIMIT 100`,
      [req.id_tenant]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("[ecommerce.listOrdenes]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const getOrden = async (req, res) => {
  const id = Number(req.params.id);
  let connection;
  try {
    connection = await getConnection();
    const [[orden]] = await connection.query(
      `SELECT * FROM ecommerce_orden WHERE id_orden = ? AND id_tenant = ? LIMIT 1`,
      [id, req.id_tenant]
    );
    if (!orden) {
      return res.status(404).json({ success: false, message: "Orden no encontrada." });
    }
    const [detalle] = await connection.query(
      `SELECT * FROM ecommerce_orden_detalle WHERE id_orden = ? AND id_tenant = ?`,
      [id, req.id_tenant]
    );
    return res.json({ success: true, data: { ...orden, detalle } });
  } catch (error) {
    console.error("[ecommerce.getOrden]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

// ─── Storefront público ────────────────────────────────────────────────────

export const getStoreBySlug = async (req, res) => {
  const { slug } = req.params;
  let connection;
  try {
    connection = await getConnection();
    const [[tienda]] = await connection.query(
      `SELECT id_tienda, id_tenant, slug, nombre, color_primario, logo_url, descripcion, telefono, estado
       FROM ecommerce_tienda WHERE slug = ? LIMIT 1`,
      [slug]
    );
    if (!tienda || tienda.estado !== "active") {
      return res.status(404).json({ success: false, message: "Tienda no encontrada." });
    }

    const [productos] = await connection.query(
      `SELECT p.id_producto, p.nombre, p.descripcion, p.precio, p.stock, p.sku, p.attrs_json,
         (SELECT url FROM ecommerce_producto_imagen i
          WHERE i.id_producto = p.id_producto AND i.id_tenant = p.id_tenant
          ORDER BY i.es_principal DESC, i.orden ASC LIMIT 1) AS imagen_url
       FROM ecommerce_producto p
       WHERE p.id_tenant = ? AND p.activo = 1 AND p.stock > 0
       ORDER BY p.nombre ASC`,
      [tienda.id_tenant]
    );

    const [[mp]] = await connection.query(
      `SELECT public_key, modo FROM ecommerce_mp_credenciales WHERE id_tenant = ? LIMIT 1`,
      [tienda.id_tenant]
    );

    return res.json({
      success: true,
      data: {
        tienda: {
          slug: tienda.slug,
          nombre: tienda.nombre,
          color_primario: tienda.color_primario,
          logo_url: tienda.logo_url,
          descripcion: tienda.descripcion,
          telefono: tienda.telefono,
        },
        productos,
        mp_ready: Boolean(mp),
        mp_public_key: mp?.public_key || null,
      },
    });
  } catch (error) {
    console.error("[ecommerce.getStore]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const getStoreProduct = async (req, res) => {
  const { slug, id } = req.params;
  let connection;
  try {
    connection = await getConnection();
    const [[tienda]] = await connection.query(
      `SELECT id_tenant, slug, nombre, color_primario, estado FROM ecommerce_tienda WHERE slug = ? LIMIT 1`,
      [slug]
    );
    if (!tienda || tienda.estado !== "active") {
      return res.status(404).json({ success: false, message: "Tienda no encontrada." });
    }
    const [[producto]] = await connection.query(
      `SELECT * FROM ecommerce_producto WHERE id_producto = ? AND id_tenant = ? AND activo = 1 LIMIT 1`,
      [Number(id), tienda.id_tenant]
    );
    if (!producto) {
      return res.status(404).json({ success: false, message: "Producto no encontrado." });
    }
    const [imagenes] = await connection.query(
      `SELECT id_imagen, url, es_principal, orden FROM ecommerce_producto_imagen
       WHERE id_producto = ? AND id_tenant = ? ORDER BY es_principal DESC, orden ASC`,
      [producto.id_producto, tienda.id_tenant]
    );
    return res.json({
      success: true,
      data: { tienda: { slug: tienda.slug, nombre: tienda.nombre, color_primario: tienda.color_primario }, producto, imagenes },
    });
  } catch (error) {
    console.error("[ecommerce.getStoreProduct]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const checkoutStore = async (req, res) => {
  const { slug } = req.params;
  const { items, email_comprador, nombre_comprador, telefono_comprador } = req.body;
  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const [[tienda]] = await connection.query(
      `SELECT id_tienda, id_tenant, slug, nombre, estado FROM ecommerce_tienda WHERE slug = ? FOR UPDATE`,
      [slug]
    );
    if (!tienda || tienda.estado !== "active") {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Tienda no encontrada." });
    }

    const [[creds]] = await connection.query(
      `SELECT access_token_enc, public_key FROM ecommerce_mp_credenciales WHERE id_tenant = ? LIMIT 1`,
      [tienda.id_tenant]
    );
    if (!creds) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "La tienda aún no configuró Mercado Pago.",
      });
    }

    let accessToken;
    try {
      accessToken = decryptMpToken(creds.access_token_enc);
    } catch {
      await connection.rollback();
      return res.status(500).json({ success: false, message: "Credenciales MP inválidas." });
    }

    const lineItems = [];
    let total = 0;
    for (const item of items) {
      const [[prod]] = await connection.query(
        `SELECT id_producto, nombre, precio, stock FROM ecommerce_producto
         WHERE id_producto = ? AND id_tenant = ? AND activo = 1 FOR UPDATE`,
        [item.id_producto, tienda.id_tenant]
      );
      if (!prod) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: `Producto ${item.id_producto} no disponible.` });
      }
      if (prod.stock < item.cantidad) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para ${prod.nombre}.`,
        });
      }
      const sub = Number(prod.precio) * item.cantidad;
      total += sub;
      lineItems.push({
        id_producto: prod.id_producto,
        nombre: prod.nombre,
        cantidad: item.cantidad,
        precio: Number(prod.precio),
      });
    }

    const codigo = orderCode();
    const external_reference = `ecom_order:${tienda.id_tenant}:${codigo}`;
    const [ord] = await connection.query(
      `INSERT INTO ecommerce_orden
        (id_tenant, codigo, estado, total, email_comprador, nombre_comprador, telefono_comprador, external_reference)
       VALUES (?, ?, 'pending', ?, ?, ?, ?, ?)`,
      [
        tienda.id_tenant,
        codigo,
        total,
        email_comprador,
        nombre_comprador || null,
        telefono_comprador || null,
        external_reference,
      ]
    );
    const id_orden = ord.insertId;

    for (const li of lineItems) {
      await connection.query(
        `INSERT INTO ecommerce_orden_detalle
          (id_orden, id_tenant, id_producto, nombre_snapshot, cantidad, precio_unitario)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id_orden, tienda.id_tenant, li.id_producto, li.nombre, li.cantidad, li.precio]
      );
    }

    const origin = FRONTEND();
    const notification_url = `${WEBHOOK_BASE()}/api/ecommerce/webhook?id_tenant=${tienda.id_tenant}`;
    const preference = new Preference(sellerMpClient(accessToken));
    const result = await preference.create({
      body: {
        items: lineItems.map((li) => ({
          id: String(li.id_producto),
          title: li.nombre,
          quantity: li.cantidad,
          unit_price: li.precio,
          currency_id: "PEN",
        })),
        payer: { email: email_comprador, name: nombre_comprador || undefined },
        external_reference,
        back_urls: {
          success: `${origin}/tienda/${slug}/pago/resultado?status=success&orden=${codigo}`,
          failure: `${origin}/tienda/${slug}/pago/resultado?status=failure&orden=${codigo}`,
          pending: `${origin}/tienda/${slug}/pago/resultado?status=pending&orden=${codigo}`,
        },
        notification_url,
        metadata: { id_orden, id_tenant: tienda.id_tenant, codigo },
      },
    });

    await connection.query(
      `UPDATE ecommerce_orden SET mp_preference_id = ? WHERE id_orden = ? AND id_tenant = ?`,
      [result.id, id_orden, tienda.id_tenant]
    );

    await connection.commit();
    return res.json({
      success: true,
      data: {
        id_orden,
        codigo,
        preference_id: result.id,
        init_point: result.init_point || result.sandbox_init_point,
      },
    });
  } catch (error) {
    if (connection) try { await connection.rollback(); } catch { /* noop */ }
    console.error("[ecommerce.checkout]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error en checkout.",
    });
  } finally {
    if (connection) connection.release();
  }
};

/** Webhook de pagos del carrito (token del comerciante). */
export const ecommerceStoreWebhook = async (req, res) => {
  const id_tenant = Number(req.query.id_tenant);
  if (!Number.isFinite(id_tenant) || id_tenant <= 0) {
    return res.sendStatus(200);
  }

  const type = req.body?.type || req.query?.type || req.body?.topic || req.query?.topic;
  const paymentId =
    (req.body?.data && req.body.data.id) || req.query["data.id"] || req.body?.id || req.query?.id;

  if (type && type !== "payment") return res.sendStatus(200);
  if (!paymentId) return res.sendStatus(200);

  let connection;
  try {
    connection = await getConnection();
    const [[creds]] = await connection.query(
      `SELECT access_token_enc FROM ecommerce_mp_credenciales WHERE id_tenant = ? LIMIT 1`,
      [id_tenant]
    );
    if (!creds) return res.sendStatus(200);

    let accessToken;
    try {
      accessToken = decryptMpToken(creds.access_token_enc);
    } catch {
      return res.sendStatus(200);
    }

    const { data: payment } = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const external_reference = payment.external_reference || "";
    if (!external_reference.startsWith("ecom_order:")) return res.sendStatus(200);

    await connection.beginTransaction();

    const [[orden]] = await connection.query(
      `SELECT * FROM ecommerce_orden WHERE external_reference = ? AND id_tenant = ? FOR UPDATE`,
      [external_reference, id_tenant]
    );
    if (!orden) {
      await connection.rollback();
      return res.sendStatus(200);
    }

    if (orden.mp_payment_id && String(orden.mp_payment_id) === String(payment.id) && orden.estado === "approved") {
      await connection.rollback();
      return res.sendStatus(200);
    }

    const status = String(payment.status || "").toLowerCase();
    if (status === "approved" && orden.estado !== "approved") {
      const [detalle] = await connection.query(
        `SELECT id_producto, cantidad FROM ecommerce_orden_detalle WHERE id_orden = ? AND id_tenant = ?`,
        [orden.id_orden, id_tenant]
      );
      for (const d of detalle) {
        await connection.query(
          `UPDATE ecommerce_producto SET stock = GREATEST(0, stock - ?)
           WHERE id_producto = ? AND id_tenant = ?`,
          [d.cantidad, d.id_producto, id_tenant]
        );
      }
      await connection.query(
        `UPDATE ecommerce_orden SET estado = 'approved', mp_payment_id = ? WHERE id_orden = ? AND id_tenant = ?`,
        [String(payment.id), orden.id_orden, id_tenant]
      );
    } else if (status === "rejected" || status === "cancelled") {
      await connection.query(
        `UPDATE ecommerce_orden SET estado = ?, mp_payment_id = ? WHERE id_orden = ? AND id_tenant = ? AND estado = 'pending'`,
        [status === "cancelled" ? "cancelled" : "rejected", String(payment.id), orden.id_orden, id_tenant]
      );
    } else {
      await connection.query(
        `UPDATE ecommerce_orden SET mp_payment_id = ? WHERE id_orden = ? AND id_tenant = ?`,
        [String(payment.id), orden.id_orden, id_tenant]
      );
    }

    await connection.commit();
    return res.sendStatus(200);
  } catch (error) {
    if (connection) try { await connection.rollback(); } catch { /* noop */ }
    console.error("[ecommerce.webhook]", error.message);
    return res.sendStatus(200);
  } finally {
    if (connection) connection.release();
  }
};

// re-export helper for payment.controller
export { validateEcommercePlanPrice };
