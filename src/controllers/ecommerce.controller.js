import crypto from "crypto";
import axios from "axios";
import jwt from "jsonwebtoken";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { Resend } from "resend";
import { getEcommerceConnection } from "../database/database_ecommerce.js";
import { TOKEN_SECRET } from "../config.js";
import { getEcommercePlan, validateEcommercePlanPrice } from "../config/ecommercePlans.config.js";
import { hashPassword, verifyPassword } from "../utils/passwordUtil.js";
import { encryptMpToken, decryptMpToken } from "../utils/ecommerceCrypto.js";
import {
  MP_TEST_ACCESS_TOKEN,
} from "../scripts/ecommerce_mp_test_creds.js";
import { uploadImage as subirAImageKit, deleteImage as borrarDeImageKit } from "../services/imagekit.service.js";
import {
  listSucursalesActivas,
  getSucursal,
  getSucursalDefault,
  mapPublicSucursal,
} from "../services/ecommerce/BranchService.js";
import {
  getStockTotalProducto,
  getStockMapPorProductos,
  ensureDefaultVariante,
  ensureInventarioProducto,
  reservarStock,
  liberarReserva,
  confirmarVenta,
} from "../services/ecommerce/InventoryService.js";
import { registrarHistFulfillment, registrarOrdenCreada } from "../services/ecommerce/PickupService.js";
import { cotizarEntrega, getOrCreateEntregaConfig } from "../services/ecommerce/DeliveryQuoteService.js";

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

function parseThemeJson(raw) {
  if (raw == null) return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function mapPublicTienda(tienda) {
  return {
    slug: tienda.slug,
    nombre: tienda.nombre,
    color_primario: tienda.color_primario,
    logo_url: tienda.logo_url,
    descripcion: tienda.descripcion,
    telefono: tienda.telefono,
    theme_json: parseThemeJson(tienda.theme_json),
  };
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

/** Preferencia sandbox vs live según modo de la cuenta seller. */
function pickMpCheckoutUrl(result, modo) {
  const isTest = String(modo || "").toLowerCase() === "test";
  if (isTest) {
    return result.sandbox_init_point || result.init_point || null;
  }
  return result.init_point || result.sandbox_init_point || null;
}

/**
 * Resuelve access_token del seller.
 * Si el TOKEN_SECRET del runtime no coincide con el usado al cifrar (típico Vercel vs seed local),
 * en modo test cae al token TEST canónico para no romper demos.
 */
function resolveSellerAccessToken(creds) {
  try {
    return decryptMpToken(creds.access_token_enc);
  } catch (err) {
    const modo = String(creds.modo || "").toLowerCase();
    if (modo === "test") {
      const fallback = process.env.MP_TEST_ACCESS_TOKEN || MP_TEST_ACCESS_TOKEN;
      if (fallback) {
        console.warn(
          "[ecommerce.mp] decrypt falló; usando MP TEST fallback (modo=test). Revisá TOKEN_SECRET en el deploy."
        );
        return fallback;
      }
    }
    throw err;
  }
}

/** Activación post-pago SaaS (llamado desde payment webhook). Idempotente.
 *  Siempre usa db_ecommerce (el `connection` del caller puede ser db_tormenta).
 */
export async function activateEcommerceFromPayment({ externalReference, payment }) {
  if (!externalReference || !String(externalReference).startsWith("ecommerce:")) {
    return { handled: false };
  }
  const id_tienda = Number(String(externalReference).split(":")[1]);
  if (!Number.isFinite(id_tienda) || id_tienda <= 0) return { handled: false };

  let connection;
  try {
    connection = await getEcommerceConnection();
    await connection.beginTransaction();

    const [[tienda]] = await connection.query(
      `SELECT t.*, u.id_usuario, u.usua, u.email AS user_email
       FROM tienda t
       LEFT JOIN usuario u ON u.id_tienda = t.id_tienda
       WHERE t.id_tienda = ? LIMIT 1`,
      [id_tienda]
    );
    if (!tienda) {
      await connection.rollback();
      return { handled: true, activated: false };
    }

    const mpId = String(payment.id);
    const [[existingSaas]] = await connection.query(
      `SELECT id FROM suscripcion_pago WHERE mp_payment_id = ? LIMIT 1`,
      [mpId]
    );
    if (existingSaas) {
      await connection.rollback();
      return { handled: true, activated: false, already: true };
    }

    await connection.query(
      `INSERT INTO suscripcion_pago
        (id_tienda, mp_payment_id, mp_preference_id, status, amount, external_reference)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        tienda.id_tienda,
        mpId,
        payment.preference_id || null,
        payment.status,
        payment.transaction_amount ?? null,
        externalReference,
      ]
    );

    if (String(payment.status).toLowerCase() !== "approved") {
      await connection.commit();
      return { handled: true, activated: false };
    }

    const wasPending = tienda.estado === "pending";
    await connection.query(
      `UPDATE tienda SET estado = 'active', fecha_pago = CURDATE() WHERE id_tienda = ?`,
      [tienda.id_tienda]
    );
    await connection.query(
      `UPDATE usuario SET estado = 1 WHERE id_tienda = ?`,
      [tienda.id_tienda]
    );

    let claveEmail = null;
    if (wasPending && tienda.usua) {
      const { clave } = generateCredentials(tienda.slug || "tienda");
      claveEmail = clave;
      const temp_password_hash = await hashPassword(clave);
      // password_hash + temp: tras login con temp se limpian solo los campos temp;
      // la clave del email sigue válida vía password_hash.
      await connection.query(
        `UPDATE usuario
         SET password_hash = ?,
             temp_password_hash = ?,
             temp_password_expires_at = DATE_ADD(NOW(), INTERVAL 7 DAY)
         WHERE id_tienda = ?`,
        [temp_password_hash, temp_password_hash, tienda.id_tienda]
      );
    }

    await connection.commit();

    if (claveEmail && tienda.usua) {
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
              <li><b>Contraseña temporal:</b> ${claveEmail}</li>
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
  } catch (error) {
    if (connection) try { await connection.rollback(); } catch { /* noop */ }
    throw error;
  } finally {
    if (connection) connection.release();
  }
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
    connection = await getEcommerceConnection();
    await connection.beginTransaction();

    const [dup] = await connection.query(
      `SELECT slug, email FROM tienda WHERE slug = ? OR email = ? LIMIT 1`,
      [slug, email]
    );
    if (dup.length) {
      await connection.rollback();
      const msg = dup[0].email === email ? "Email ya registrado." : "Slug ya en uso.";
      return res.status(400).json({ success: false, message: msg });
    }

    const { usua, clave } = generateCredentials(slug);
    const password_hash = await hashPassword(clave);

    const [ins] = await connection.query(
      `INSERT INTO tienda
        (id_plan, slug, nombre, email, telefono, estado)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [planInfo.id, slug, nombre, email, telefono || null]
    );
    const id_tienda = ins.insertId;

    await connection.query(
      `INSERT INTO usuario
        (id_tienda, usua, password_hash, email, nombre, rol, estado)
       VALUES (?, ?, ?, ?, ?, 'admin', 0)`,
      [id_tienda, usua, password_hash, email, nombre]
    );

    await connection.commit();
    return res.status(201).json({
      success: true,
      data: {
        id_tienda,
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
    connection = await getEcommerceConnection();
    const [[tienda]] = await connection.query(
      `SELECT id_tienda, email, nombre, estado, id_plan FROM tienda WHERE id_tienda = ? LIMIT 1`,
      [id_tienda]
    );
    if (!tienda) {
      return res.status(404).json({ success: false, message: "Tienda no encontrada." });
    }
    if (tienda.estado === "active") {
      return res.status(400).json({ success: false, message: "La tienda ya está activa." });
    }
    if (Number(tienda.id_plan) !== Number(planInfo.id)) {
      await connection.query(`UPDATE tienda SET id_plan = ? WHERE id_tienda = ?`, [
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
    connection = await getEcommerceConnection();
    const [[user]] = await connection.query(
      `SELECT u.*, t.estado AS tienda_estado, t.slug, t.nombre AS tienda_nombre
       FROM usuario u
       JOIN tienda t ON t.id_tienda = u.id_tienda
       WHERE u.usua = ? OR u.email = ?
       LIMIT 1`,
      [usuario, usuario]
    );
    if (!user) {
      return res.status(401).json({ success: false, message: "Credenciales inválidas." });
    }

    const okHash = await verifyPassword(password, user.password_hash);
    let usedTemp = false;
    if (!okHash) {
      const tempValid =
        user.temp_password_hash &&
        user.temp_password_expires_at &&
        new Date(user.temp_password_expires_at) > new Date();
      if (!tempValid || !(await verifyPassword(password, user.temp_password_hash))) {
        return res.status(401).json({ success: false, message: "Credenciales inválidas." });
      }
      usedTemp = true;
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

    if (usedTemp) {
      await connection.query(
        `UPDATE usuario SET temp_password_hash = NULL, temp_password_expires_at = NULL WHERE id_usuario = ?`,
        [user.id_usuario]
      );
    }

    const token = jwt.sign(
      {
        sub: user.id_usuario,
        usr: user.usua,
        ten: user.id_tienda,
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
        id_tienda: user.id_tienda,
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
    connection = await getEcommerceConnection();
    const [[tienda]] = await connection.query(
      `SELECT id_tienda, slug, nombre, email, telefono, estado, color_primario, logo_url, descripcion, id_plan, theme_json
       FROM tienda WHERE id_tienda = ? LIMIT 1`,
      [req.id_tienda]
    );
    if (tienda) {
      tienda.theme_json = parseThemeJson(tienda.theme_json);
    }
    const [[mp]] = await connection.query(
      `SELECT public_key, modo, conectado_en FROM mp_cuenta WHERE id_tienda = ? LIMIT 1`,
      [req.id_tienda]
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
  const { nombre, descripcion, color_primario, telefono, logo_url, theme_json } = req.body;
  let connection;
  try {
    connection = await getEcommerceConnection();
    const themeValue =
      theme_json === undefined ? null : theme_json === null ? null : JSON.stringify(theme_json);

    // theme_json: si viene en body, reemplaza; si no, COALESCE mantiene
    if (theme_json !== undefined) {
      await connection.query(
        `UPDATE tienda SET
          nombre = COALESCE(?, nombre),
          descripcion = COALESCE(?, descripcion),
          color_primario = COALESCE(?, color_primario),
          telefono = COALESCE(?, telefono),
          logo_url = COALESCE(?, logo_url),
          theme_json = ?
         WHERE id_tienda = ?`,
        [
          nombre ?? null,
          descripcion ?? null,
          color_primario ?? null,
          telefono ?? null,
          logo_url ?? null,
          themeValue,
          req.id_tienda,
        ]
      );
    } else {
      await connection.query(
        `UPDATE tienda SET
          nombre = COALESCE(?, nombre),
          descripcion = COALESCE(?, descripcion),
          color_primario = COALESCE(?, color_primario),
          telefono = COALESCE(?, telefono),
          logo_url = COALESCE(?, logo_url)
         WHERE id_tienda = ?`,
        [
          nombre ?? null,
          descripcion ?? null,
          color_primario ?? null,
          telefono ?? null,
          logo_url ?? null,
          req.id_tienda,
        ]
      );
    }
    return res.json({ success: true });
  } catch (error) {
    console.error("[ecommerce.updateTienda]", error);
    return res.status(500).json({ success: false, message: "Error al actualizar." });
  } finally {
    if (connection) connection.release();
  }
};

async function uploadBrandAsset(req, res, kind) {
  const { file, fileName } = req.body || {};
  if (!file) {
    return res.status(400).json({ success: false, message: "Archivo requerido (base64)." });
  }

  const safeName = String(fileName || `ecom-brand-${kind}.jpg`).replace(/[^\w.\-]+/g, "_");
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
    const uploaded = await subirAImageKit({
      file,
      fileName: `ecom_${kind}_${req.id_tienda}_${Date.now()}.${extension}`,
      folder: `/ecommerce/${req.id_tienda}/brand/`,
    });

    connection = await getEcommerceConnection();
    if (kind === "logo") {
      await connection.query(`UPDATE tienda SET logo_url = ? WHERE id_tienda = ?`, [
        uploaded.url,
        req.id_tienda,
      ]);
      return res.status(201).json({
        success: true,
        data: { url: uploaded.url, file_id: uploaded.fileId, kind: "logo" },
      });
    }

    // banner → merge into theme_json.banner_url
    const [[row]] = await connection.query(
      `SELECT theme_json FROM tienda WHERE id_tienda = ? LIMIT 1`,
      [req.id_tienda]
    );
    const theme = parseThemeJson(row?.theme_json) || {};
    theme.banner_url = uploaded.url;
    await connection.query(`UPDATE tienda SET theme_json = ? WHERE id_tienda = ?`, [
      JSON.stringify(theme),
      req.id_tienda,
    ]);
    return res.status(201).json({
      success: true,
      data: { url: uploaded.url, file_id: uploaded.fileId, kind: "banner", theme_json: theme },
    });
  } catch (error) {
    console.error(`[ecommerce.uploadBrand.${kind}]`, error);
    return res.status(500).json({ success: false, message: error.message || "Error al subir." });
  } finally {
    if (connection) connection.release();
  }
}

export const uploadTiendaLogo = (req, res) => uploadBrandAsset(req, res, "logo");
export const uploadTiendaBanner = (req, res) => uploadBrandAsset(req, res, "banner");

export const saveMpCredentials = async (req, res) => {
  const { public_key, access_token, modo } = req.body;
  let connection;
  try {
    const enc = encryptMpToken(access_token);
    connection = await getEcommerceConnection();
    await connection.query(
      `INSERT INTO mp_cuenta (id_tienda, public_key, access_token_enc, modo, conectado_en)
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         public_key = VALUES(public_key),
         access_token_enc = VALUES(access_token_enc),
         modo = VALUES(modo),
         conectado_en = NOW()`,
      [req.id_tienda, public_key, enc, modo || "test"]
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
    connection = await getEcommerceConnection();
    const [[stats]] = await connection.query(
      `SELECT
         (SELECT COUNT(*) FROM producto WHERE id_tienda = ? AND activo = 1) AS productos,
         (SELECT COUNT(*) FROM orden WHERE id_tienda = ? AND estado = 'approved') AS ordenes_aprobadas,
         (SELECT COALESCE(SUM(total),0) FROM orden WHERE id_tienda = ? AND estado = 'approved') AS ventas,
         (SELECT COUNT(*) FROM producto WHERE id_tienda = ? AND activo = 1 AND stock <= stock_min) AS stock_bajo`,
      [req.id_tienda, req.id_tienda, req.id_tienda, req.id_tienda]
    );
    const [recientes] = await connection.query(
      `SELECT id_orden, codigo, estado, total, email_comprador, created_at
       FROM orden WHERE id_tienda = ?
       ORDER BY created_at DESC LIMIT 8`,
      [req.id_tienda]
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
    connection = await getEcommerceConnection();
    const [rows] = await connection.query(
      `SELECT p.*,
         (SELECT url FROM producto_imagen i
          WHERE i.id_producto = p.id_producto AND i.id_tienda = p.id_tienda
          ORDER BY i.es_principal DESC, i.orden ASC LIMIT 1) AS imagen_url
       FROM producto p
       WHERE p.id_tienda = ?
       ORDER BY p.id_producto DESC`,
      [req.id_tienda]
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
  const { nombre, descripcion, precio, stock, stock_min, activo, sku, categoria, attrs_json } = req.body;
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [r] = await connection.query(
      `INSERT INTO producto
        (id_tienda, nombre, descripcion, precio, stock, stock_min, activo, sku, categoria, attrs_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.id_tienda,
        nombre,
        descripcion || null,
        precio,
        stock ?? 0,
        stock_min ?? 5,
        activo === false ? 0 : 1,
        sku || null,
        categoria || null,
        attrs_json ? JSON.stringify(attrs_json) : null,
      ]
    );
    if (activo !== false) {
      await ensureInventarioProducto(connection, req.id_tienda, r.insertId);
    }
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
  const { nombre, descripcion, precio, stock, stock_min, activo, sku, categoria, attrs_json } = req.body;
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [r] = await connection.query(
      `UPDATE producto SET
        nombre = COALESCE(?, nombre),
        descripcion = COALESCE(?, descripcion),
        precio = COALESCE(?, precio),
        stock = COALESCE(?, stock),
        stock_min = COALESCE(?, stock_min),
        activo = COALESCE(?, activo),
        sku = COALESCE(?, sku),
        categoria = COALESCE(?, categoria),
        attrs_json = COALESCE(?, attrs_json)
       WHERE id_producto = ? AND id_tienda = ?`,
      [
        nombre ?? null,
        descripcion ?? null,
        precio ?? null,
        stock ?? null,
        stock_min ?? null,
        typeof activo === "boolean" ? (activo ? 1 : 0) : null,
        sku ?? null,
        categoria ?? null,
        attrs_json != null ? JSON.stringify(attrs_json) : null,
        id,
        req.id_tienda,
      ]
    );
    if (!r.affectedRows) {
      return res.status(404).json({ success: false, message: "Producto no encontrado." });
    }
    if (activo === true) {
      await ensureInventarioProducto(connection, req.id_tienda, id);
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
    connection = await getEcommerceConnection();
    const [imgs] = await connection.query(
      `SELECT file_id FROM producto_imagen WHERE id_producto = ? AND id_tienda = ?`,
      [id, req.id_tienda]
    );
    for (const img of imgs) {
      if (img.file_id) {
        try { await borrarDeImageKit(img.file_id); } catch { /* noop */ }
      }
    }
    const [r] = await connection.query(
      `DELETE FROM producto WHERE id_producto = ? AND id_tienda = ?`,
      [id, req.id_tienda]
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
    connection = await getEcommerceConnection();
    const [[prod]] = await connection.query(
      `SELECT id_producto FROM producto WHERE id_producto = ? AND id_tienda = ? LIMIT 1`,
      [id_producto, req.id_tienda]
    );
    if (!prod) {
      return res.status(404).json({ success: false, message: "Producto no encontrado." });
    }

    const [[count]] = await connection.query(
      `SELECT COUNT(*) AS c FROM producto_imagen WHERE id_producto = ? AND id_tienda = ?`,
      [id_producto, req.id_tienda]
    );
    connection.release();
    connection = null;

    // Subida externa sin retener conexión del pool.
    const uploaded = await subirAImageKit({
      file,
      fileName: `ecom_${id_producto}_${Date.now()}.${extension}`,
      folder: `/ecommerce/${req.id_tienda}/`,
    });

    connection = await getEcommerceConnection();
    const es_principal = count.c === 0 ? 1 : 0;
    const [ins] = await connection.query(
      `INSERT INTO producto_imagen
        (id_tienda, id_producto, url, file_id, orden, es_principal)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.id_tienda, id_producto, uploaded.url, uploaded.fileId, count.c, es_principal]
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
    connection = await getEcommerceConnection();
    const [rows] = await connection.query(
      `SELECT id_orden, codigo, estado, estado_fulfillment, total, moneda, email_comprador, nombre_comprador, mp_payment_id, created_at
       FROM orden WHERE id_tienda = ?
       ORDER BY created_at DESC LIMIT 100`,
      [req.id_tienda]
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
    connection = await getEcommerceConnection();
    const [[orden]] = await connection.query(
      `SELECT * FROM orden WHERE id_orden = ? AND id_tienda = ? LIMIT 1`,
      [id, req.id_tienda]
    );
    if (!orden) {
      return res.status(404).json({ success: false, message: "Orden no encontrada." });
    }
    const [detalle] = await connection.query(
      `SELECT * FROM orden_item WHERE id_orden = ? AND id_tienda = ?`,
      [id, req.id_tienda]
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
  const id_sucursal = req.query.branch ? Number(req.query.branch) : null;
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [[tienda]] = await connection.query(
      `SELECT id_tienda, slug, nombre, color_primario, logo_url, descripcion, telefono, estado, theme_json, fulfillment_default
       FROM tienda WHERE slug = ? LIMIT 1`,
      [slug]
    );
    if (!tienda || tienda.estado !== "active") {
      return res.status(404).json({ success: false, message: "Tienda no encontrada." });
    }

    const sucursales = await listSucursalesActivas(connection, tienda.id_tienda);

    const [productosRaw] = await connection.query(
      `SELECT p.id_producto, p.nombre, p.descripcion, p.precio, p.stock, p.sku, p.categoria, p.attrs_json,
         (SELECT url FROM producto_imagen i
          WHERE i.id_producto = p.id_producto AND i.id_tienda = p.id_tienda
          ORDER BY i.es_principal DESC, i.orden ASC LIMIT 1) AS imagen_url
       FROM producto p
       WHERE p.id_tienda = ? AND p.activo = 1
       ORDER BY p.nombre ASC`,
      [tienda.id_tienda]
    );

    const productos = [];
    if (sucursales.length) {
      const stockMap = await getStockMapPorProductos(connection, tienda.id_tienda, id_sucursal);
      for (const p of productosRaw) {
        const stock = stockMap.get(p.id_producto) ?? 0;
        if (stock > 0) productos.push({ ...p, stock });
      }
    } else {
      for (const p of productosRaw) {
        const stock = Number(p.stock);
        if (stock > 0) productos.push({ ...p, stock });
      }
    }

    const [[mp]] = await connection.query(
      `SELECT public_key, modo FROM mp_cuenta WHERE id_tienda = ? LIMIT 1`,
      [tienda.id_tienda]
    );

    return res.json({
      success: true,
      data: {
        tienda: mapPublicTienda(tienda),
        productos,
        sucursales: sucursales.map(mapPublicSucursal),
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
  const id_sucursal = req.query.branch ? Number(req.query.branch) : null;
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [[tienda]] = await connection.query(
      `SELECT id_tienda, slug, nombre, color_primario, logo_url, descripcion, telefono, estado, theme_json, fulfillment_default FROM tienda WHERE slug = ? LIMIT 1`,
      [slug]
    );
    if (!tienda || tienda.estado !== "active") {
      return res.status(404).json({ success: false, message: "Tienda no encontrada." });
    }
    const [[producto]] = await connection.query(
      `SELECT * FROM producto WHERE id_producto = ? AND id_tienda = ? AND activo = 1 LIMIT 1`,
      [Number(id), tienda.id_tienda]
    );
    if (!producto) {
      return res.status(404).json({ success: false, message: "Producto no encontrado." });
    }
    const sucursales = await listSucursalesActivas(connection, tienda.id_tienda);
    const stockBranch = await getStockTotalProducto(
      connection,
      tienda.id_tienda,
      producto.id_producto,
      id_sucursal
    );
    producto.stock = sucursales.length ? stockBranch : Number(producto.stock);

    const [imagenes] = await connection.query(
      `SELECT id_imagen, url, es_principal, orden FROM producto_imagen
       WHERE id_producto = ? AND id_tienda = ? ORDER BY es_principal DESC, orden ASC`,
      [producto.id_producto, tienda.id_tienda]
    );
    return res.json({
      success: true,
      data: {
        tienda: mapPublicTienda(tienda),
        producto,
        imagenes,
        sucursales: sucursales.map(mapPublicSucursal),
      },
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
  const {
    items,
    id_sucursal: idSucursalBody,
    fulfillment = "pickup",
    telefono_comprador,
    whatsapp_context,
    id_zona,
    id_destino,
    id_agencia,
    lat,
    lng,
    entrega,
  } = req.body;
  const buyer = req.storefrontUser;
  if (!buyer) {
    return res.status(401).json({ success: false, message: "Inicia sesión para comprar." });
  }
  const email_comprador = buyer.email;
  const nombre_comprador = buyer.nombre;
  const id_cliente = buyer.id_cliente;
  let connection;
  try {
    connection = await getEcommerceConnection();
    await connection.beginTransaction();

    const [[tienda]] = await connection.query(
      `SELECT id_tienda, slug, nombre, estado FROM tienda WHERE slug = ? FOR UPDATE`,
      [slug]
    );
    if (!tienda || tienda.estado !== "active") {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Tienda no encontrada." });
    }

    const config = await getOrCreateEntregaConfig(connection, tienda.id_tienda);
    if (fulfillment === "pickup" && !config.retiro_activo) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "El retiro en tienda no está activo." });
    }
    if (fulfillment === "delivery" && !config.delivery_activo) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "El delivery no está activo." });
    }
    if (fulfillment === "provincia" && !config.provincia_activo) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "El envío a provincia no está activo." });
    }

    // Calcular subtotal productos primero (precios server-side)
    const lineItems = [];
    let subtotal = 0;
    const allSucursales = await listSucursalesActivas(connection, tienda.id_tienda);
    const useBranchInv = allSucursales.length > 0;

    for (const item of items) {
      const [[prod]] = await connection.query(
        `SELECT id_producto, nombre, precio, stock FROM producto
         WHERE id_producto = ? AND id_tienda = ? AND activo = 1 FOR UPDATE`,
        [item.id_producto, tienda.id_tienda]
      );
      if (!prod) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: `Producto ${item.id_producto} no disponible.` });
      }
      const sub = Number(prod.precio) * item.cantidad;
      subtotal += sub;
      lineItems.push({
        id_producto: prod.id_producto,
        id_variante: item.id_variante || null,
        nombre: prod.nombre,
        cantidad: item.cantidad,
        precio: Number(prod.precio),
        stock_legacy: prod.stock,
      });
    }

    // Resolver sucursal + cotización
    let sucursal = null;
    let id_sucursal = idSucursalBody ? Number(idSucursalBody) : null;
    let costo_envio = 0;
    let quoteMeta = {};
    let entrega_json = entrega || null;
    let finalZona = id_zona || null;
    let finalDestino = id_destino || null;
    let finalAgencia = id_agencia || null;

    if (fulfillment === "pickup") {
      if (!id_sucursal) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: "Debe elegir sucursal de recojo." });
      }
      sucursal = await getSucursal(connection, tienda.id_tienda, id_sucursal);
      if (!sucursal || !sucursal.allow_pickup) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: "Sucursal de recojo inválida." });
      }
      if (!sucursal.direccion || !String(sucursal.direccion).trim()) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: "La sucursal no tiene dirección configurada." });
      }
      const quote = await cotizarEntrega(connection, {
        id_tienda: tienda.id_tienda,
        fulfillment: "pickup",
        subtotal,
        id_sucursal,
      });
      if (!quote.disponible) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: quote.motivo || "Retiro no disponible." });
      }
      costo_envio = 0;
    } else if (fulfillment === "delivery") {
      if (!entrega?.direccion) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: "Indica la dirección de entrega." });
      }
      const quote = await cotizarEntrega(connection, {
        id_tienda: tienda.id_tienda,
        fulfillment: "delivery",
        subtotal,
        id_zona: id_zona || null,
        punto: lat != null && lng != null ? { lat: Number(lat), lng: Number(lng) } : null,
      });
      if (!quote.disponible) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: quote.motivo || "Delivery no disponible." });
      }
      costo_envio = Number(quote.costo || 0);
      finalZona = quote.zona?.id_zona || id_zona || null;
      id_sucursal = quote.id_sucursal || id_sucursal;
      if (!id_sucursal) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "No se pudo determinar la sucursal que atiende el delivery.",
        });
      }
      sucursal = await getSucursal(connection, tienda.id_tienda, id_sucursal);
      if (!sucursal || !sucursal.allow_delivery) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: "Sucursal de despacho inválida." });
      }
      quoteMeta = { zona: quote.zona, tiempo_estimado: quote.tiempo_estimado };
      entrega_json = {
        ...(entrega || {}),
        lat: lat ?? null,
        lng: lng ?? null,
        id_zona: finalZona,
      };
    } else if (fulfillment === "provincia") {
      if (!id_destino) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: "Elige un destino de provincia." });
      }
      if (config.provincia_requiere_agencia && !id_agencia) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: "Elige una agencia de transporte." });
      }
      if (id_agencia) {
        const [[ag]] = await connection.query(
          `SELECT id_agencia FROM ecom_envio_agencia
           WHERE id_agencia = ? AND id_tienda = ? AND activo = 1 LIMIT 1`,
          [id_agencia, tienda.id_tienda]
        );
        if (!ag) {
          await connection.rollback();
          return res.status(400).json({ success: false, message: "Agencia inválida." });
        }
      }
      const quote = await cotizarEntrega(connection, {
        id_tienda: tienda.id_tienda,
        fulfillment: "provincia",
        subtotal,
        id_destino,
      });
      if (!quote.disponible) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: quote.motivo || "Envío no disponible." });
      }
      costo_envio = Number(quote.costo || 0);
      finalDestino = id_destino;
      finalAgencia = id_agencia || null;
      sucursal = id_sucursal
        ? await getSucursal(connection, tienda.id_tienda, id_sucursal)
        : await getSucursalDefault(connection, tienda.id_tienda);
      if (!sucursal) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "Configura una sucursal para despachar envíos a provincia.",
        });
      }
      id_sucursal = sucursal.id_sucursal;
      quoteMeta = { destino: quote.destino, tiempo_estimado: quote.tiempo_estimado };
      entrega_json = {
        ...(entrega || {}),
        id_destino: finalDestino,
        id_agencia: finalAgencia,
      };
    } else {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "Método de entrega inválido." });
    }

    const [[creds]] = await connection.query(
      `SELECT access_token_enc, public_key, modo FROM mp_cuenta WHERE id_tienda = ? LIMIT 1`,
      [tienda.id_tienda]
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
      accessToken = resolveSellerAccessToken(creds);
    } catch {
      await connection.rollback();
      return res.status(500).json({
        success: false,
        message:
          "Credenciales MP inválidas. En modo test re-sembrá con seed_ecommerce_demo_mp.js o alineá TOKEN_SECRET del deploy.",
      });
    }

    // Reservar stock en la sucursal resuelta
    for (const li of lineItems) {
      if (useBranchInv) {
        const variante = li.id_variante
          ? { id_variante: li.id_variante }
          : await ensureDefaultVariante(connection, tienda.id_tienda, li.id_producto);
        li.id_variante = variante.id_variante;
        try {
          await reservarStock(connection, {
            id_tienda: tienda.id_tienda,
            id_variante: li.id_variante,
            id_sucursal,
            cantidad: li.cantidad,
            ref_tipo: "checkout",
            ref_id: null,
          });
        } catch (err) {
          await connection.rollback();
          return res.status(err.status || 400).json({
            success: false,
            message: `Stock insuficiente para ${li.nombre} en ${sucursal.nombre}.`,
          });
        }
      } else if (li.stock_legacy < li.cantidad) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para ${li.nombre}.`,
        });
      }
    }

    const total = Math.round((subtotal + costo_envio) * 100) / 100;
    const codigo = orderCode();
    const external_reference = `ecom_order:${tienda.id_tienda}:${codigo}`;
    const pickup_direccion =
      fulfillment === "pickup" ? String(sucursal.direccion).trim() : null;
    const telFinal = telefono_comprador || buyer.telefono || entrega?.telefono || null;

    const [ord] = await connection.query(
      `INSERT INTO orden
        (id_tienda, id_cliente, codigo, estado, estado_fulfillment, total, costo_envio,
         email_comprador, nombre_comprador, telefono_comprador,
         external_reference, id_sucursal, fulfillment, pickup_direccion, whatsapp_context,
         id_zona, id_destino, id_agencia, entrega_json, estado_entrega)
       VALUES (?, ?, ?, 'pending', 'pago_pendiente', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tienda.id_tienda,
        id_cliente,
        codigo,
        total,
        costo_envio,
        email_comprador,
        nombre_comprador || null,
        telFinal,
        external_reference,
        id_sucursal,
        fulfillment,
        pickup_direccion,
        whatsapp_context ? JSON.stringify(whatsapp_context) : null,
        finalZona,
        finalDestino,
        finalAgencia,
        entrega_json ? JSON.stringify(entrega_json) : null,
        "pendiente",
      ]
    );
    const id_orden = ord.insertId;

    await registrarOrdenCreada(connection, id_orden, tienda.id_tienda);

    for (const li of lineItems) {
      await connection.query(
        `INSERT INTO orden_item
          (id_orden, id_tienda, id_producto, id_variante, nombre_snapshot, cantidad, precio_unitario)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id_orden,
          tienda.id_tienda,
          li.id_producto,
          li.id_variante,
          li.nombre,
          li.cantidad,
          li.precio,
        ]
      );
      if (useBranchInv && li.id_variante) {
        await connection.query(
          `UPDATE ecom_inventario_mov SET ref_id = ? WHERE id_tienda = ? AND id_variante = ? AND id_sucursal = ?
           AND ref_tipo = 'checkout' AND ref_id IS NULL ORDER BY id_mov DESC LIMIT 1`,
          [id_orden, tienda.id_tienda, li.id_variante, id_sucursal]
        );
      }
    }

    const origin = FRONTEND();
    const notification_url = `${WEBHOOK_BASE()}/api/ecommerce/webhook?id_tienda=${tienda.id_tienda}`;
    const preference = new Preference(sellerMpClient(accessToken));
    const mpItems = lineItems.map((li) => ({
      id: String(li.id_producto),
      title: li.nombre,
      quantity: li.cantidad,
      unit_price: li.precio,
      currency_id: "PEN",
    }));
    if (costo_envio > 0) {
      mpItems.push({
        id: "envio",
        title: fulfillment === "provincia" ? "Envío a provincia" : "Delivery",
        quantity: 1,
        unit_price: costo_envio,
        currency_id: "PEN",
      });
    }

    const result = await preference.create({
      body: {
        items: mpItems,
        payer: { email: email_comprador, name: nombre_comprador || undefined },
        external_reference,
        back_urls: {
          success: `${origin}/tienda/${slug}/pago/resultado?status=success&orden=${codigo}`,
          failure: `${origin}/tienda/${slug}/pago/resultado?status=failure&orden=${codigo}`,
          pending: `${origin}/tienda/${slug}/pago/resultado?status=pending&orden=${codigo}`,
        },
        notification_url,
        metadata: {
          id_orden,
          id_tienda: tienda.id_tienda,
          codigo,
          id_sucursal,
          fulfillment,
          costo_envio,
        },
      },
    });

    await connection.query(
      `UPDATE orden SET mp_preference_id = ? WHERE id_orden = ? AND id_tienda = ?`,
      [result.id, id_orden, tienda.id_tienda]
    );

    await connection.commit();
    return res.json({
      success: true,
      data: {
        id_orden,
        codigo,
        preference_id: result.id,
        modo: creds.modo || "test",
        init_point: pickMpCheckoutUrl(result, creds.modo),
        sandbox_init_point: result.sandbox_init_point || null,
        subtotal,
        costo_envio,
        total,
        fulfillment,
        pickup:
          fulfillment === "pickup"
            ? { sucursal: sucursal.nombre, direccion: pickup_direccion }
            : null,
        entrega: entrega_json,
        quote: quoteMeta,
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
  const id_tienda = Number(req.query.id_tienda ?? req.query.id_tenant);
  if (!Number.isFinite(id_tienda) || id_tienda <= 0) {
    return res.sendStatus(200);
  }

  const type = req.body?.type || req.query?.type || req.body?.topic || req.query?.topic;
  const paymentId =
    (req.body?.data && req.body.data.id) || req.query["data.id"] || req.body?.id || req.query?.id;

  if (type && type !== "payment") return res.sendStatus(200);
  if (!paymentId) return res.sendStatus(200);

  let connection;
  try {
    connection = await getEcommerceConnection();
    const [[creds]] = await connection.query(
      `SELECT access_token_enc, modo FROM mp_cuenta WHERE id_tienda = ? LIMIT 1`,
      [id_tienda]
    );
    if (!creds) return res.sendStatus(200);

    let accessToken;
    try {
      accessToken = resolveSellerAccessToken(creds);
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
      `SELECT * FROM orden WHERE external_reference = ? AND id_tienda = ? FOR UPDATE`,
      [external_reference, id_tienda]
    );
    if (!orden) {
      await connection.rollback();
      return res.sendStatus(200);
    }

    // Idempotencia: mismo pago ya aprobado. Aún así repara fulfillment si quedó desfasado.
    if (orden.mp_payment_id && String(orden.mp_payment_id) === String(payment.id) && orden.estado === "approved") {
      if (
        orden.estado_fulfillment === "pago_pendiente" ||
        orden.estado_fulfillment === "pendiente_confirmacion" ||
        !orden.estado_fulfillment
      ) {
        await connection.query(
          `UPDATE orden SET estado_fulfillment = 'pago_confirmado'
           WHERE id_orden = ? AND id_tienda = ?`,
          [orden.id_orden, id_tienda]
        );
        await registrarHistFulfillment(connection, {
          id_orden: orden.id_orden,
          id_tienda,
          estado_anterior: orden.estado_fulfillment || "pago_pendiente",
          estado_nuevo: "pago_confirmado",
          notas: "Sincronizado: pago MP ya aprobado",
        });
        await connection.commit();
      } else {
        await connection.rollback();
      }
      return res.sendStatus(200);
    }

    const status = String(payment.status || "").toLowerCase();
    if (status === "approved" && orden.estado !== "approved") {
      const [detalle] = await connection.query(
        `SELECT id_producto, id_variante, cantidad FROM orden_item WHERE id_orden = ? AND id_tienda = ?`,
        [orden.id_orden, id_tienda]
      );
      const id_sucursal = orden.id_sucursal;
      for (const d of detalle) {
        if (id_sucursal && d.id_variante) {
          await confirmarVenta(connection, {
            id_tienda,
            id_variante: d.id_variante,
            id_sucursal,
            cantidad: d.cantidad,
            ref_tipo: "orden",
            ref_id: orden.id_orden,
          });
        } else {
          await connection.query(
            `UPDATE producto SET stock = GREATEST(0, stock - ?)
             WHERE id_producto = ? AND id_tienda = ?`,
            [d.cantidad, d.id_producto, id_tienda]
          );
        }
      }
      const prevFulfillment = orden.estado_fulfillment || "pago_pendiente";
      await connection.query(
        `UPDATE orden SET estado = 'approved', mp_payment_id = ?, estado_fulfillment = 'pago_confirmado'
         WHERE id_orden = ? AND id_tienda = ?`,
        [String(payment.id), orden.id_orden, id_tienda]
      );
      if (prevFulfillment !== "pago_confirmado") {
        await registrarHistFulfillment(connection, {
          id_orden: orden.id_orden,
          id_tienda,
          estado_anterior: prevFulfillment,
          estado_nuevo: "pago_confirmado",
          notas: "Pago aprobado (Mercado Pago)",
        });
      }
    } else if (status === "rejected" || status === "cancelled") {
      if (orden.estado === "pending") {
        const [detalle] = await connection.query(
          `SELECT id_producto, id_variante, cantidad FROM orden_item WHERE id_orden = ? AND id_tienda = ?`,
          [orden.id_orden, id_tienda]
        );
        for (const d of detalle) {
          if (orden.id_sucursal && d.id_variante) {
            await liberarReserva(connection, {
              id_tienda,
              id_variante: d.id_variante,
              id_sucursal: orden.id_sucursal,
              cantidad: d.cantidad,
              ref_tipo: "orden",
              ref_id: orden.id_orden,
            });
          }
        }
      }
      const prevFulfillment = orden.estado_fulfillment || "pago_pendiente";
      await connection.query(
        `UPDATE orden SET estado = ?, mp_payment_id = ?, estado_fulfillment = 'cancelado'
         WHERE id_orden = ? AND id_tienda = ? AND estado = 'pending'`,
        [status === "cancelled" ? "cancelled" : "rejected", String(payment.id), orden.id_orden, id_tienda]
      );
      if (prevFulfillment !== "cancelado") {
        await registrarHistFulfillment(connection, {
          id_orden: orden.id_orden,
          id_tienda,
          estado_anterior: prevFulfillment,
          estado_nuevo: "cancelado",
          notas: `Pago ${status} (Mercado Pago)`,
        });
      }
    } else {
      await connection.query(
        `UPDATE orden SET mp_payment_id = ? WHERE id_orden = ? AND id_tienda = ?`,
        [String(payment.id), orden.id_orden, id_tienda]
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
