import axios from "axios";
import { MercadoPagoConfig, Preference } from "mercadopago";
import dotenv from "dotenv";
import { getConnection } from "../database/database.js";
import { Resend } from "resend";
import PDFDocument from "pdfkit";
dotenv.config();

const client = new MercadoPagoConfig({
  accessToken: process.env.ACCESS_TOKEN,
});
// !TODO: Instancia de Resend para envío de correos
const resend = new Resend(process.env.RESEND_API_KEY);

export const createPreference = async (req, res) => {
  try {
    //console.log('\n────────────────────────────────────────────────────────');
    //console.log('CREANDO PREFERENCIA DE PAGO');
    //console.log('────────────────────────────────────────────────────────');
    //console.log('Body recibido:', JSON.stringify(req.body, null, 2));
    
    const items = Array.isArray(req.body?.items) && req.body.items.length > 0
      ? req.body.items
      : [{
          id: "PLAN_DEFAULT",
          title: "Plan de suscripción",
          quantity: 1,
          unit_price: 0,
        }];

    const payer = req.body?.payer?.email
      ? req.body.payer
      : { email: "test_user_123456@testuser.com" };

    const origin =
      process.env.FRONTEND_URL ||
      req.headers.origin ||
      "http://localhost:5173";

    const back_urls = req.body?.back_urls || {
      success: `${origin}/success`,
      failure: `${origin}/failure`,
      pending: `${origin}/pending`,
    };

    // URL pública del webhook:
    // 1) Usa env si existe (recomendado en prod)
    // 2) Por defecto usa tu ngrok actual
    const baseWebhook =
      (process.env.WEBHOOK_PUBLIC_URL)
        .replace(/\/$/, "");
    const notification_url = `${baseWebhook}/api/webhook`;
    // External reference: Email de la empresa para vincular el pago
    const external_reference = req.body.external_reference || (payer && payer.email) || "";
    
    /*console.log('\Datos de la preferencia:');
    console.log('- Items:', items.length, 'producto(s)');
    console.log('- Precio total:', items[0]?.unit_price || 0);
    console.log('- Payer Email:', payer.email);
    console.log('- External Reference:', external_reference);
    console.log('\nCONFIGURACIÓN DEL WEBHOOK:');
    console.log('ESTA ES LA URL QUE MERCADOPAGO USARÁ PARA NOTIFICAR');
    console.log('Notification URL:', notification_url);
    console.log('Base Webhook:', baseWebhook);
    console.log('Verifica que ngrok esté corriendo y la URL sea correcta');
    console.log('\n Back URLs:');
    console.log('- Success:', back_urls.success);
    console.log('- Failure:', back_urls.failure);
    console.log('- Pending:', back_urls.pending);*/

    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items,
        payer,
        back_urls,
        notification_url,
        external_reference,
      },
    });

    /*console.log('\Preferencia creada exitosamente');
    console.log('- Preference ID:', result.id);
    console.log('- Init Point:', result.init_point);
    console.log('────────────────────────────────────────────────────────');
*/
    res.status(200).json({ id: result.id, success: true });
  } catch (error) {
    /*console.error('\ERROR al crear preferencia:');
    console.error('- Mensaje:', error.message);
    console.error('- Causa:', error.cause);
    console.error('- Stack:', error.stack);
    console.log('────────────────────────────────────────────────────────');
    */
    res.status(500).json({
      error: "Error al crear preferencia",
      message: error.message,
      details: error.cause,
    });
  }
};

// Utilidad para extraer type + id desde body o query
function parseMPEvent(req) {
  // Nuevo formato: POST body { type, action, data: { id }, live_mode, ... }
  const b = req.body || {};
  // Query que a veces manda MP en pruebas: ?type=payment&data.id=123
  const q = req.query || {};

  // Formatos posibles:
  // 1) Nuevo: type=payment, data.id=...
  let type = b.type || q.type || b.topic || q.topic; // 'payment', 'subscription', etc.
  // 2) ID en body.data.id, o en query 'data.id', o en 'id'
  let id = (b.data && b.data.id) || q["data.id"] || b.id || q.id;

  return { type, id, live_mode: Boolean(b.live_mode), action: b.action || q.action };
}

async function saveMPPayment(connection, id_tenant, payment) {
  try {
    const paymentData = {
      id_tenant,
      mp_payment_id: payment.id,
      status: payment.status || 'unknown',
      transaction_amount: payment.transaction_amount || 0,
      currency_id: payment.currency_id || 'PEN',
      external_reference: payment.external_reference || null,
      mp_preference_id: payment.preference_id || null,
      mp_preapproval_id: payment.metadata?.preapproval_id || payment.preapproval_id || payment.subscription_id || null, // <- NUEVO
      date_created: payment.date_created ? new Date(payment.date_created) : null,
      date_approved: payment.date_approved ? new Date(payment.date_approved) : null,
    };

    const query = `
      INSERT INTO mp_payments (
        id_tenant,
        mp_payment_id,
        status,
        transaction_amount,
        currency_id,
        external_reference,
        mp_preference_id,
        mp_preapproval_id,
        date_created,
        date_approved
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        transaction_amount = VALUES(transaction_amount),
        currency_id = VALUES(currency_id),
        external_reference = VALUES(external_reference),
        mp_preference_id = VALUES(mp_preference_id),
        mp_preapproval_id = VALUES(mp_preapproval_id),
        date_created = VALUES(date_created),
        date_approved = VALUES(date_approved)
    `;

    const values = [
      paymentData.id_tenant,
      paymentData.mp_payment_id,
      paymentData.status,
      paymentData.transaction_amount,
      paymentData.currency_id,
      paymentData.external_reference,
      paymentData.mp_preference_id,
      paymentData.mp_preapproval_id,
      paymentData.date_created,
      paymentData.date_approved,
    ];

    const [result] = await connection.query(query, values);
    if (result.affectedRows > 0) {
      return { success: true, isNew: Boolean(result.insertId) };
    }
    return { success: false, isNew: false };
  } catch (error) {
    throw error;
  }
}

export const paymentWebhook = async (req, res) => {
  let connection;
  try {
    const { type, id } = parseMPEvent(req);
    if (req.method === "GET" && !type && !id) return res.sendStatus(200);
    if (!type || !id) return res.sendStatus(200);

    // 1) Suscripciones (preapproval)
    if (type === "preapproval") {
      try {
        const { data: pre } = await axios.get(
          `https://api.mercadopago.com/preapproval/${id}`,
          { headers: { Authorization: `Bearer ${process.env.ACCESS_TOKEN}` } }
        );
        const payerEmail = pre?.payer_email || null;

        connection = await getConnection();
        const [emp] = await connection.query(
          "SELECT id_tenant, email FROM empresa WHERE email = ? LIMIT 1",
          [payerEmail]
        );
        if (!emp.length) return res.sendStatus(200);

        const id_tenant = emp[0].id_tenant;
        const emailEmpresa = emp[0].email;
        const status = String(pre?.status || "").toLowerCase();

        if (status === "authorized") {
          // Solo activar. NO sumar días aquí.
          await connection.query(
            "UPDATE usuario SET estado_usuario = 1 WHERE id_tenant = ?",
            [id_tenant]
          );
        } else if (["paused", "cancelled", "canceled", "expired"].includes(status)) {
          await connection.query(
            "UPDATE usuario SET estado_usuario = 0 WHERE id_tenant = ?",
            [id_tenant]
          );
          try {
            if (emailEmpresa) {
              await resend.emails.send({
                from: "HoryCore <no-reply@send.horycore.online>",
                to: emailEmpresa,
                subject: "Acceso denegado por incumplimiento de pago",
                html: `
                  <div style="background:#0b1020;padding:24px 12px;">
                    <div style="max-width:680px;margin:0 auto;background:#0f172a;border-radius:16px;overflow:hidden;border:1px solid rgba(148,163,184,.2);color:#e2e8f0">
                      <div style="background:linear-gradient(135deg,#0ea5e9,#7c3aed);padding:18px 20px;display:flex;align-items:center;gap:12px">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="white" style="opacity:.95">
                          <path d="M12 2l7 3v6c0 5.55-3.84 10.74-7 12-3.16-1.26-7-6.45-7-12V5l7-3z"/>
                        </svg>
                        <div style="font-weight:800;font-size:16px;letter-spacing:.2px">Acceso temporalmente deshabilitado</div>
                        <span style="margin-left:auto;background:rgba(255,255,255,.18);color:#fff;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700">HoryCore</span>
                      </div>
                      <div style="padding:22px">
                        <div style="color:#e2e8f0;font-size:15px;margin-bottom:10px">
                          Detectamos que tu suscripción está <b>pausada o vencida</b>. Por esta razón, el acceso al sistema ha sido <b>denegado</b>.
                        </div>
                        <div style="color:#cbd5e1;font-size:14px;margin-bottom:10px">
                          Para restablecer el acceso, reactiva tu suscripción desde Mercado Pago o contáctanos para asistencia.
                        </div>
                        <div style="margin-top:12px;color:#94a3b8;font-size:12px">
                          Si ya regularizaste el pago, el acceso se habilitará automáticamente en pocos minutos.
                        </div>
                      </div>
                      <div style="padding:18px 20px;border-top:1px solid rgba(148,163,184,.2);background:#0b1220;color:#94a3b8;text-align:center">
                        <div style="font-weight:800;color:#e2e8f0">Horytek ERP</div>
                        <div style="font-size:12px">Sistema de Gestión Empresarial</div>
                        <div style="margin-top:6px;font-size:12px;color:#64748b">
                          Este correo fue enviado automáticamente por la plataforma.
                        </div>
                      </div>
                    </div>
                  </div>
                `
              });
            } 
          } catch { /* noop */ }
        }
      } catch { /* noop */ }
      finally { if (connection) { connection.release(); connection = null; } }
      return res.sendStatus(200);
    }

    // 2) Pagos (producto y cobros de suscripción)
    if (type !== "payment") return res.sendStatus(200);

    const { data: payment } = await axios.get(
      `https://api.mercadopago.com/v1/payments/${id}`,
      { headers: { Authorization: `Bearer ${process.env.ACCESS_TOKEN}` } }
    );

    const externalReference = payment.external_reference || null;
    if (!externalReference) return res.sendStatus(200);

    // Detectar si el pago proviene de suscripción
    const isSubscriptionPayment = Boolean(
      payment?.metadata?.preapproval_id || payment?.preapproval_id || payment?.subscription_id
    );

    if (String(payment.status).toLowerCase() === "approved") {
      connection = await getConnection();

      let empresa;
      // Producto: enviar clave una vez. Suscripción: sumar días una vez.
      let shouldSendInitialCode = false;
      let shouldRenewAccess = false;

      try {
        await connection.beginTransaction();

        // Idempotencia
        const [[locked]] = await connection.query(
          "SELECT status FROM mp_payments WHERE mp_payment_id = ? LIMIT 1 FOR UPDATE",
          [payment.id]
        );
        const alreadyApproved = String(locked?.status || "").toLowerCase() === "approved";

        shouldSendInitialCode = !isSubscriptionPayment && !alreadyApproved;
        shouldRenewAccess    =  isSubscriptionPayment && !alreadyApproved; // SOLO suscripción suma +30 días

        const [empresas] = await connection.query(
          "SELECT id_empresa, id_tenant FROM empresa WHERE email = ? LIMIT 1",
          [externalReference]
        );
        if (!empresas.length) { await connection.rollback(); return res.sendStatus(200); }
        empresa = empresas[0];

        // Guardar/actualizar el pago
        try { await saveMPPayment(connection, empresa.id_tenant, payment); } catch {}

        if (shouldRenewAccess) {
          // Suscripción: sumar +30 días solo una vez por cobro
          await connection.query(
            `UPDATE usuario
               SET fecha_pago = DATE_ADD(
                     CASE
                       WHEN fecha_pago IS NULL OR fecha_pago < CURDATE() THEN CURDATE()
                       ELSE fecha_pago
                     END, INTERVAL 30 DAY
                   ),
                   estado_usuario = 1
             WHERE id_tenant = ?`,
            [empresa.id_tenant]
          );
        }
        // Producto: NO tocar fecha_pago ni estado_usuario

        await connection.commit();
      } catch {
        try { await connection.rollback(); } catch {}
        return res.sendStatus(200);
      }

      // Enviar clave inicial SOLO en producto y solo una vez
      if (shouldSendInitialCode) {
        try {
          const [usuarios] = await connection.query(
            "SELECT id_usuario, usua, clave_acceso FROM usuario WHERE id_tenant = ? AND id_rol = 1 LIMIT 1",
            [empresa.id_tenant]
          );
          const admin = usuarios?.[0];
          if (admin?.clave_acceso) {
            await resend.emails.send({
              from: "HoryCore <no-reply@send.horycore.online>",
              to: externalReference,
              subject: "Clave de acceso inicial a HoryCore",
              html: `
                <div style="background:#0b1020;padding:24px 12px;">
                <div style="max-width:680px;margin:0 auto;background:#0f172a;border-radius:16px;overflow:hidden;border:1px solid rgba(148,163,184,.2);color:#e2e8f0">
                  <div style="background:linear-gradient(135deg,#1d4ed8,#7c3aed);padding:18px 20px;display:flex;align-items:center;gap:12px">
                   <svg width="28" height="28" viewBox="0 0 24 24" fill="white" style="opacity:.95"><path d="M12 2l7 3v6c0 5.55-3.84 10.74-7 12-3.16-1.26-7-6.45-7-12V5l7-3z"/></svg>
                   <div style="font-weight:800;font-size:16px;letter-spacing:.2px">¡Pago recibido y clave de acceso generada!</div>
                     <span style="margin-left:auto;background:rgba(255,255,255,.18);color:#fff;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700">HoryCore</span>
                    </div>
                  <div style="padding:22px">
                    <div style="font-size:15px;color:#cbd5e1;font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:8px">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color:#16a34a"><path d="M12 2l7 3v6c0 5.55-3.84 10.74-7 12-3.16-1.26-7-6.45-7-12V5l7-3z"/></svg>
                         Acceso a tu cuenta HoryCore
                      </div>
                       <div style="margin-bottom:18px;color:#e2e8f0;font-size:15px">
                        Tu pago ha sido aprobado correctamente.<br>
                        <b>Clave de acceso inicial:</b>
                         <span style="display:inline-block;font-size:1.7rem;letter-spacing:0.22em;background:#1e293b;color:#a7f3d0;padding:8px 18px;border-radius:10px;margin:10px 0 10px 0;border:1px solid #22d3ee;">
                           ${usuarios?.[0]?.clave_acceso}
                          </span>
                           </div>
                        <div style="color:#cbd5e1;font-size:15px;margin-bottom:10px">Esta es tu clave de acceso. Cuando autentiques tu cuenta, recibirás un nuevo correo que indique si el proceso de activación fue exitoso.</div>
                         </div>
                       <div style="padding:18px 20px;border-top:1px solid rgba(148,163,184,.2);background:#0b1220;color:#94a3b8;text-align:center">
                      <div style="font-weight:800;color:#e2e8f0">Horytek ERP</div>
                     <div style="font-size:12px">Sistema de Gestión Empresarial</div>
                    </div>
                    </div>
                  </div>`
              });
          }
        } catch { /* noop */ }
      }
    }

    return res.sendStatus(200);
  } catch {
    return res.sendStatus(200);
  } finally {
    if (connection) connection.release();
  }
};
// NUEVO: listar pagos del tenant (mp_payments)
export const getMpPayments = async (req, res) => {
  let connection;
  try {
    const id_tenant = req.id_tenant;
    const { page = 1, limit = 20, email } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    connection = await getConnection();

    const params = [id_tenant];
    let where = "WHERE id_tenant = ?";
    if (email) {
      where += " AND external_reference = ?";
      params.push(email);
    }

    const [rows] = await connection.query(
      `SELECT id, id_tenant, mp_payment_id, status, transaction_amount, currency_id, external_reference,
              mp_preference_id, mp_preapproval_id, date_created, date_approved, created_at, updated_at
       FROM mp_payments
       ${where}
       ORDER BY COALESCE(date_created, created_at) DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    const [[{ total }]] = await connection.query(
      `SELECT COUNT(*) AS total FROM mp_payments ${where}`,
      params
    );

    res.json({ success: true, data: rows, total });
  } catch (e) {
    res.status(500).json({ success: false, message: "Error obteniendo pagos", error: e?.message });
  } finally {
    if (connection) connection.release();
  }
};

// NUEVO: crear preapproval (renovación automática)
export const createPreapproval = async (req, res) => {
  let connection;
  try {
    const { plan = "", email } = req.body || {};

    const p = String(plan).toLowerCase();
    const PLAN_KEY =
      p.includes("enterprise") ? "Enterprise" :
      p.includes("pro") ? "Pro" : "Basic";

    const PLAN_IDS = {
      Enterprise: process.env.MP_PLAN_ID_ENTERPRISE,
      Pro:        process.env.MP_PLAN_ID_PRO,
      Basic:      process.env.MP_PLAN_ID_BASIC,
    };
    const base = process.env.MP_SUBS_BASE_URL || "https://www.mercadopago.com.pe/subscriptions/checkout";
    const planId = PLAN_IDS[PLAN_KEY];

    const init_point = planId
      ? `${base}?preapproval_plan_id=${planId}${email ? `&payer_email=${encodeURIComponent(email)}` : ""}`
      : null;

    // Estado estricto desde Mercado Pago
    let activeStrict = false;
    let nextPaymentDate = null;

    if (email) {
      try {
        const { data: search } = await axios.get(
          "https://api.mercadopago.com/preapproval/search",
          {
            headers: { Authorization: `Bearer ${process.env.ACCESS_TOKEN}` },
            params: { payer_email: email }
          }
        );
        const results = Array.isArray(search?.results) ? search.results : [];
        const latest = results
          .slice()
          .sort((a, b) => new Date(b.last_modified) - new Date(a.last_modified))[0];

        if (latest) {
          const status = String(latest.status || "").toLowerCase();
          activeStrict = status === "authorized";
          nextPaymentDate =
            latest.next_payment_date ||
            latest.charge_schedule?.next_execution_date ||
            null;
        }
      } catch { /* silencio */ }
    }

    // Fallback SOLO informativo (no define el “active” principal)
    let activeFallback = false;
    if (!activeStrict && email) {
      try {
        connection = await getConnection();
        const [[emp]] = await connection.query("SELECT id_tenant FROM empresa WHERE email = ? LIMIT 1", [email]);
        if (emp?.id_tenant) {
          const [[row]] = await connection.query(
            `SELECT MAX(estado_usuario) AS any_active, MAX(fecha_pago) AS max_fecha
             FROM usuario WHERE id_tenant = ?`,
            [emp.id_tenant]
          );
          const f = row?.max_fecha ? new Date(row.max_fecha) : null;
          activeFallback = Boolean(row?.any_active) && f && f >= new Date();
          // Si no vino fecha de MP, usar la de BD para mostrar al usuario
          nextPaymentDate = nextPaymentDate || (f ? new Date(f).toISOString() : null);
        }
      } catch { /* silencio */ }
      finally { if (connection) { connection.release(); connection = null; } }
    }

    return res.json({
      success: true,
      init_point,
      plan: PLAN_KEY,
      // IMPORTANTE: “active” ahora es estricto (solo MP)
      active: activeStrict,
      active_strict: activeStrict,
      active_fallback: activeFallback,
      source: activeStrict ? "mp" : (activeFallback ? "db" : "none"),
      preapproval: { next_payment_date: nextPaymentDate }
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Error creando enlace de suscripción", error: e?.message });
  }
};

// NUEVO: enviar solicitud de cambio de plan por correo (Resend)
// Helpers para el template
function escapeHTML(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
function formatFechaES(date = new Date()) {
  try {
    return new Date(date).toLocaleString("es-PE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return new Date().toLocaleString("es-PE");
  }
}
// Template de correo con iconos personalizados (inline SVG)
function buildPlanChangeEmailTemplate({
  requester_email,
  requester_name,
  current_plan,
  target_plan,
  reason,
  receivedAt,
}) {
  const safeEmail = escapeHTML(requester_email || "-");
  const safeName = escapeHTML(requester_name || "Cliente");
  const safeCurrent = escapeHTML(current_plan || "N/D");
  const safeTarget = escapeHTML(target_plan || "N/D");
  const safeReason = escapeHTML(reason || "-");
  const fechaRecibido = formatFechaES(receivedAt);

  // Iconos SVG propios
  const icoMail = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color:#2563eb">
      <path d="M3 5h18a2 2 0 0 1 2 2v.3l-11 6.6L1 7.3V7a2 2 0 0 1 2-2zm19 5.7V17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6.3l10 6 10-6z"/>
    </svg>`;
  const icoUser = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color:#0ea5e9">
      <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm-7 9a7 7 0 0 1 14 0z"/>
    </svg>`;
  const icoShieldStar = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color:#16a34a">
      <path d="M12 2l7 3v6c0 5.55-3.84 10.74-7 12-3.16-1.26-7-6.45-7-12V5l7-3zM9.7 15.5L12 14l2.3 1.5-.6-2.6 2-1.7-2.6-.2L12 8.5l-1.1 2.5-2.6.2 2 1.7-.6 2.6z"/>
    </svg>`;
  const icoTrophy = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color:#a855f7">
      <path d="M18 4V2H6v2H2v3a5 5 0 0 0 5 5 7 7 0 0 0 5 3 7 7 0 0 0 5-3 5 5 0 0 0 5-5V4h-4zM4 7V6h2v2a3 3 0 0 1-2-1zm16-1v1a3 3 0 0 1-2 1V6zM12 22a4 4 0 0 0 4-4h-8a4 4 0 0 0 4 4z"/>
    </svg>`;
  const icoCalendar = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color:#f59e0b">
      <path d="M7 2h2v2h6V2h2v2h4v18H3V4h4V2zm14 8H3v10h18V10zM5 12h4v4H5v-4z"/>
    </svg>`;
  const icoMessage = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color:#ef4444">
      <path d="M2 3h20v14H6l-4 4V3zm4 5v2h12V8H6z"/>
    </svg>`;

  return `
  <div style="background:#0b1020;padding:24px 12px;">
    <div style="max-width:680px;margin:0 auto;background:#0f172a;border-radius:16px;overflow:hidden;border:1px solid rgba(148,163,184,.2);color:#e2e8f0">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#1d4ed8,#7c3aed);padding:18px 20px;display:flex;align-items:center;gap:12px">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white" style="opacity:.95">
          <path d="M12 2l3 6 6 .9-4.5 4.4 1 6.3L12 17l-5.5 2.6 1-6.3L3 8.9 9 8z"/>
        </svg>
        <div style="font-weight:800;font-size:16px;letter-spacing:.2px">Nueva Solicitud de Cambio de Plan</div>
        <span style="margin-left:auto;background:rgba(255,255,255,.18);color:#fff;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700">HoryCore</span>
      </div>

      <!-- Body -->
      <div style="padding:22px">
        <!-- De -->
        <div style="margin-bottom:14px;font-weight:700;color:#cbd5e1;display:flex;align-items:center;gap:8px">${icoMail} <span>De</span></div>
        <div style="border:1px solid rgba(148,163,184,.25);border-radius:12px;padding:12px 14px;background:#0b1220">
          <a href="mailto:${safeEmail}" style="color:#60a5fa;text-decoration:none">${safeEmail}</a>
          <div style="margin-top:6px;color:#94a3b8;font-size:12px">Puedes responder directamente a este correo</div>
        </div>

        <!-- Grid resumen -->
        <div style="margin-top:18px;display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div style="border:1px solid rgba(148,163,184,.25);border-radius:12px;padding:10px 12px;background:#0b1220">
            <div style="font-size:12px;color:#94a3b8;margin-bottom:6px;display:flex;align-items:center;gap:8px">${icoUser}<span>Solicitante</span></div>
            <div style="font-weight:700;color:#e2e8f0">${safeName}</div>
          </div>
          <div style="border:1px solid rgba(148,163,184,.25);border-radius:12px;padding:10px 12px;background:#0b1220">
            <div style="font-size:12px;color:#94a3b8;margin-bottom:6px;display:flex;align-items:center;gap:8px">${icoShieldStar}<span>Plan actual</span></div>
            <div style="font-weight:700;color:#e2e8f0">${safeCurrent}</div>
          </div>
          <div style="border:1px solid rgba(148,163,184,.25);border-radius:12px;padding:10px 12px;background:#0b1220">
            <div style="font-size:12px;color:#94a3b8;margin-bottom:6px;display:flex;align-items:center;gap:8px">${icoTrophy}<span>Plan solicitado</span></div>
            <div style="font-weight:800;color:#c084fc;background:#2e1065;border:1px solid #7c3aed;padding:6px 10px;border-radius:10px;display:inline-block">${safeTarget}</div>
          </div>
          <div style="border:1px solid rgba(148,163,184,.25);border-radius:12px;padding:10px 12px;background:#0b1220">
            <div style="font-size:12px;color:#94a3b8;margin-bottom:6px;display:flex;align-items:center;gap:8px">${icoCalendar}<span>Fecha de solicitud</span></div>
            <div style="font-weight:700;color:#e2e8f0">${fechaRecibido}</div>
          </div>
        </div>

        <!-- Mensaje -->
        <div style="margin-top:18px;font-weight:700;color:#cbd5e1;display:flex;align-items:center;gap:8px">${icoMessage}<span>Mensaje del Usuario</span></div>
        <div style="margin-top:8px;border:1px solid rgba(148,163,184,.25);border-radius:12px;background:#0b1220">
          <pre style="margin:0;padding:14px 16px;font-family:ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap;color:#e2e8f0">${safeReason}</pre>
        </div>

        <div style="margin-top:16px;color:#94a3b8;font-size:12px">⏱ Recibido el ${fechaRecibido}</div>
      </div>

      <!-- Footer -->
      <div style="padding:18px 20px;border-top:1px solid rgba(148,163,184,.2);background:#0b1220;color:#94a3b8;text-align:center">
        <div style="font-weight:800;color:#e2e8f0">Horytek ERP</div>
        <div style="font-size:12px">Sistema de Gestión Empresarial</div>
        <div style="margin-top:6px;font-size:12px;color:#64748b">
          Este correo fue enviado automáticamente desde la plataforma. Responde directamente para contactar al usuario.
        </div>
      </div>
    </div>
  </div>
  `;
}


export const requestPlanChange = async (req, res) => {
  try {
    const { current_plan, target_plan, reason, requester_email, requester_name } = req.body || {};
    if (!target_plan || !reason) {
      return res.status(400).json({ success: false, message: "Faltan datos del cambio de plan" });
    }

    // Enviar a soporte (fallback a tu correo)
    const toEmail = process.env.SUPPORT_EMAIL || "bustamante777a@gmail.com";
    const receivedAt = new Date();

    await resend.emails.send({
      from: process.env.RESEND_FROM || "HoryCore <no-reply@send.horycore.online>",
      to: [toEmail],
      reply_to: requester_email || undefined,
      subject: `Solicitud de cambio de plan · ${requester_name || "Cliente"} → ${target_plan}`,
      html: buildPlanChangeEmailTemplate({
        requester_email,
        requester_name,
        current_plan,
        target_plan,
        reason,
        receivedAt
      }),
    });

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: "Error enviando solicitud", error: e?.message });
  }
};

// Generar comprobante PDF improvisado de un pago Mercado Pago
export const downloadPaymentReceipt = async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await getConnection();
    const [[payment]] = await connection.query(
      "SELECT * FROM mp_payments WHERE id = ? LIMIT 1",
      [id]
    );
    if (!payment) return res.status(404).send("Pago no encontrado");

    // Formatos
    const fmtMoney = (amt, cur = payment.currency_id || "PEN") =>
      new Intl.NumberFormat("es-PE", { style: "currency", currency: cur }).format(Number(amt || 0));
    const fmtDate = (d) =>
      d ? new Date(d).toLocaleString("es-PE", { timeZone: "America/Lima", hour12: true }) : "-";

    // Headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="voucher_pago_${payment.id}.pdf"`);

    // Documento (80mm térmico alto dinámico)
    const doc = new PDFDocument({
      size: [240, 680],
      margins: { top: 22, left: 16, right: 16, bottom: 22 }
    });
    doc.pipe(res); // pipe SIEMPRE antes de escribir

    const pageW = doc.page.width;
    const x0 = doc.page.margins.left;
    const x1 = pageW - doc.page.margins.right;

    // Encabezado minimalista
    doc.save();
    doc.rect(0, 0, pageW, 48).fill("#1d4ed8");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(16).text("HoryCore ERP", 0, 14, { align: "center" });
    doc.fontSize(10).text("COMPROBANTE DE PAGO", { align: "center" });
    doc.restore();
    doc.moveDown(1.6);

    // Separador fino
    doc.lineWidth(0.6).strokeColor("#e5e7eb").moveTo(x0, doc.y).lineTo(x1, doc.y).stroke();
    doc.moveDown(0.6);

    // Badge de estado
    const approved = String(payment.status || "").toLowerCase() === "approved";
    const statusText = approved ? "PAGO APROBADO" : (payment.status || "PENDIENTE").toUpperCase();
    const badgeW = doc.widthOfString(statusText, { font: "Helvetica-Bold", size: 9 }) + 20;
    const badgeX = (pageW - badgeW) / 2;
    const badgeY = doc.y;
    doc.roundedRect(badgeX, badgeY, badgeW, 18, 9).fill(approved ? "#16a34a" : "#f59e0b");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9).text(statusText, badgeX, badgeY + 4, { width: badgeW, align: "center" });
    doc.fillColor("#111827").moveDown(1.2);

    // Utilitario: par etiqueta/valor alineado
    const labelColor = "#6b7280";
    const drawKV = (label, value) => {
      doc.font("Helvetica").fontSize(9).fillColor(labelColor).text(label.toUpperCase(), x0, doc.y, { width: 86 });
      doc.font("Helvetica-Bold").fillColor("#111827").text(String(value || "-"), x0 + 92);
      doc.moveDown(0.3);
    };

    // Bloque Detalle
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text("Detalle del pago");
    doc.moveDown(0.4);
    doc.lineWidth(0.6).strokeColor("#eef2f7").moveTo(x0, doc.y).lineTo(x1, doc.y).stroke();
    doc.moveDown(0.6);

    drawKV("ID Pago", payment.mp_payment_id);
    drawKV("Estado", (payment.status || "").toUpperCase());
    drawKV("Monto", fmtMoney(payment.transaction_amount));
    drawKV("Moneda", payment.currency_id || "PEN");
    drawKV("Fecha", fmtDate(payment.date_created));
    drawKV("Aprobado", fmtDate(payment.date_approved));
    drawKV("Referencia", payment.external_reference || "-");
    if (payment.mp_preference_id) drawKV("Preference ID", payment.mp_preference_id);
    if (payment.mp_preapproval_id) drawKV("Preapproval ID", payment.mp_preapproval_id);

    // Línea final
    doc.moveDown(0.6);
    doc.lineWidth(0.6).strokeColor("#eef2f7").moveTo(x0, doc.y).lineTo(x1, doc.y).stroke();

    // Totales/resumen mínimo
    doc.moveDown(0.8);
    doc.font("Helvetica").fontSize(9).fillColor("#374151");
    doc.text("Total pagado", x0, doc.y, { continued: true });
    doc.font("Helvetica-Bold").fillColor("#111827").text(`  ${fmtMoney(payment.transaction_amount)}`, { align: "right" });

    // Mensaje y marca
    doc.moveDown(1.2);
    doc.font("Helvetica").fontSize(9).fillColor("#6b7280").text("Gracias por su preferencia.", { align: "center" });
    doc.moveDown(0.2);
    doc.text("Este comprobante fue generado automáticamente por HoryCore.", { align: "center" });
    doc.moveDown(0.2);
    doc.fontSize(8).fillColor("#9ca3af").text("www.horycore.com", { align: "center" });

    doc.end();
  } catch (e) {
    res.status(500).send("Error generando comprobante PDF");
  } finally {
    if (connection) connection.release();
  }
};