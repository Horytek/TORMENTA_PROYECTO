import axios from "axios";
import { MercadoPagoConfig, Preference } from "mercadopago";
import dotenv from "dotenv";
import { getConnection } from "../database/database.js";
import { getExpressConnection } from "../database/express_db.js";
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

    let externalReference = payment.external_reference || null;

    // Detectar si el pago proviene de suscripción
    const isSubscriptionPayment = Boolean(
      payment?.metadata?.preapproval_id || payment?.preapproval_id || payment?.subscription_id
    );

    // Si es suscripción y NO vino external_reference en el objeto payment,
    // intentamos buscar la suscripción (preapproval) para obtener el email (payer_email).
    if (isSubscriptionPayment && !externalReference) {
      try {
        const preId = payment?.metadata?.preapproval_id || payment?.preapproval_id || payment?.subscription_id;
        const { data: preInfo } = await axios.get(
          `https://api.mercadopago.com/preapproval/${preId}`,
          { headers: { Authorization: `Bearer ${process.env.ACCESS_TOKEN}` } }
        );
        // Usamos el email del payer como referencia si existe
        if (preInfo?.payer_email) {
          externalReference = preInfo.payer_email;
          // Actualizamos el payment object en memoria para que saveMPPayment tenga el dato
          payment.external_reference = externalReference;
        }
      } catch (err) {
        console.error("Error recuperando external_reference de preapproval:", err.message);
      }
    }

    if (!externalReference) return res.sendStatus(200);

    if (String(payment.status).toLowerCase() === "approved") {
      connection = await getConnection();

      let empresa;
      let isExpress = false;
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
        shouldRenewAccess = isSubscriptionPayment && !alreadyApproved; // SOLO suscripción suma +30 días

        const [empresas] = await connection.query(
          "SELECT id_empresa, id_tenant FROM empresa WHERE email = ? LIMIT 1",
          [externalReference]
        );

        if (empresas.length > 0) {
          empresa = empresas[0];
        } else {
          // 2. Si no es ERP, buscar en EXPRESS (Pocket)
          let expressConnection;
          try {
            expressConnection = await getExpressConnection();
            const [expressTenants] = await expressConnection.query(
              "SELECT tenant_id, email, business_name FROM express_tenants WHERE email = ? LIMIT 1",
              [externalReference]
            );
            if (expressTenants.length > 0) {
              empresa = { id_tenant: expressTenants[0].tenant_id, ...expressTenants[0] };
              isExpress = true;
            }
          } catch (err) {
            console.error("Error checking express db:", err);
          } finally {
            if (expressConnection) expressConnection.release();
          }
        }

        if (!empresa) { await connection.rollback(); return res.sendStatus(200); }

        // Guardar/actualizar el pago
        try { await saveMPPayment(connection, empresa.id_tenant, payment); } catch { }

        if (isExpress) {
          // Lógica para Pocket / Express
          if (!alreadyApproved) {
            // Determinar duración según monto o metadata
            let daysToAdd = 30;
            const amount = Number(payment.transaction_amount);
            if (amount < 8) daysToAdd = 1; // Diario
            else if (amount < 25) daysToAdd = 7; // Semanal

            let expressUpdateConn;
            try {
              expressUpdateConn = await getExpressConnection();
              await expressUpdateConn.query(
                `UPDATE express_tenants 
                          SET subscription_status = 'active',
                              created_at = NOW(),
                              subscription_end_date = DATE_ADD(NOW(), INTERVAL ? DAY)
                          WHERE tenant_id = ?`,
                [daysToAdd, empresa.id_tenant]
              );
            } catch (err) {
              console.error("Error updating express tenant:", err);
              // Should we throw to rollback the main transaction? 
              // Yes, better to be consistent.
              throw err;
            } finally {
              if (expressUpdateConn) expressUpdateConn.release();
            }

            // Enviar Correo de Bienvenida / Confirmación
            await resend.emails.send({
              from: "HoryCore Pocket <no-reply@horycore.online>",
              to: externalReference,
              subject: "¡Pago Exitoso! Tu HoryCore Pocket está listo",
              html: `
                      <div style="background:#02040a;padding:40px 20px;font-family:sans-serif;">
                        <div style="max-width:600px;margin:0 auto;background:#0f121a;border-radius:24px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);">
                           <div style="padding:40px;text-align:center;">
                              <div style="width:64px;height:64px;background:rgba(16,185,129,0.1);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;">
                                 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                              </div>
                              <h1 style="color:white;font-size:24px;margin:0 0 12px;">¡Pago Recibido!</h1>
                              <p style="color:#9ca3af;font-size:16px;line-height:1.5;margin:0 0 32px;">
                                 Tu suscripción a <strong>HoryCore Pocket</strong> ha sido activada correctamente. Ya puedes acceder a todas las funciones premium.
                              </p>
                              
                              <div style="background:#1a1d2d;border-radius:16px;padding:20px;text-align:left;margin-bottom:32px;">
                                 <div style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">PLAN</div>
                                 <div style="color:white;font-weight:bold;font-size:18px;">${daysToAdd === 1 ? 'Diario' : daysToAdd === 7 ? 'Semanal' : 'Express Mensual'}</div>
                                 <div style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;margin-top:16px;">ESTADO</div>
                                 <div style="color:#10b981;font-weight:bold;font-size:14px;">ACTIVO</div>
                              </div>

                              <a href="${process.env.FRONTEND_URL}/login" style="display:inline-block;background:#10b981;color:black;font-weight:bold;text-decoration:none;padding:16px 32px;border-radius:12px;transition:all 0.2s;">
                                 Ingresar al Sistema
                              </a>
                           </div>
                           <div style="background:#0a0c10;padding:20px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
                              <p style="color:#4b5563;font-size:12px;margin:0;">Horytek Solutions &copy; ${new Date().getFullYear()}</p>
                           </div>
                        </div>
                      </div>
                    `
            });
          }
        } else {
          // Lógica ERP original
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
        }

        // Producto: NO tocar fecha_pago ni estado_usuario

        await connection.commit();
      } catch (err) {
        console.error("Webhook Logic Error:", err);
        try { await connection.rollback(); } catch { }
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
      Pro: process.env.MP_PLAN_ID_PRO,
      Basic: process.env.MP_PLAN_ID_BASIC,
    };
    const base = process.env.MP_SUBS_BASE_URL || "https://www.mercadopago.com.pe/subscriptions/checkout";
    const planId = PLAN_IDS[PLAN_KEY];

    const init_point = planId
      ? `${base}?preapproval_plan_id=${planId}${email ? `&payer_email=${encodeURIComponent(email)}&external_reference=${encodeURIComponent(email)}` : ""}`
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

// Generar comprobante PDF profesional (A4)
export const downloadPaymentReceipt = async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await getConnection();

    // Obtener pago y datos de la empresa vinculada
    const sql = `
      SELECT p.*, e.razonSocial, e.ruc, e.email as email_empresa, e.direccion 
      FROM mp_payments p
      LEFT JOIN empresa e ON p.id_tenant = e.id_tenant
      WHERE p.id = ? 
      LIMIT 1
    `;
    const [[payment]] = await connection.query(sql, [id]);

    if (!payment) return res.status(404).send("Pago no encontrado");

    // Configuración del documento
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    // Headers de respuesta
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Comprobante_HoryCore_${payment.mp_payment_id}.pdf"`);

    doc.pipe(res);

    // --- Estilos y Helpers ---
    const colors = {
      primary: "#1d4ed8", // Blue 700
      secondary: "#64748b", // Slate 500
      text: "#1e293b", // Slate 800
      lightBg: "#f8fafc", // Slate 50
      line: "#e2e8f0"
    };

    const fmtMoney = (amt) =>
      new Intl.NumberFormat("es-PE", { style: "currency", currency: payment.currency_id || "PEN" }).format(Number(amt || 0));

    const fmtDate = (d) =>
      d ? new Date(d).toLocaleDateString("es-PE", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "-";

    // --- Header ---
    doc.rect(0, 0, 595.28, 120).fill(colors.lightBg); // Fondo cabecera

    // Logo / Marca
    doc.fontSize(24).font("Helvetica-Bold").fillColor(colors.primary).text("HoryCore", 50, 45);
    doc.fontSize(10).font("Helvetica").fillColor(colors.secondary).text("ERP Management System", 50, 75);

    // Título del documento
    const isApproved = String(payment.status).toLowerCase() === "approved";
    const statusLabel = isApproved ? "PAGADO" : "PENDIENTE";

    doc.fontSize(10).font("Helvetica-Bold").fillColor(isApproved ? "#16a34a" : "#f59e0b")
      .text(statusLabel, 0, 45, { align: "right" });
    doc.fontSize(20).font("Helvetica").fillColor(colors.text)
      .text("RECIBO DE PAGO", 0, 60, { align: "right" });

    // ID y Fecha
    doc.fontSize(9).font("Helvetica").fillColor(colors.secondary)
      .text(`ID Transacción: ${payment.mp_payment_id}`, 0, 85, { align: "right" });
    doc.text(`Fecha: ${fmtDate(payment.date_created)}`, 0, 98, { align: "right" });

    // --- Info Secciones (Emisor y Receptor) ---
    const yInfo = 150;

    // Emisor (Nosotros)
    doc.fontSize(10).font("Helvetica-Bold").fillColor(colors.text).text("De:", 50, yInfo);
    doc.font("Helvetica").fontSize(9).fillColor(colors.secondary)
      .text("Horytek Solutions", 50, yInfo + 15)
      .text("soporte@horycore.online")
      .text("Lima, Perú");

    // Receptor (Cliente)
    doc.fontSize(10).font("Helvetica-Bold").fillColor(colors.text).text("Para:", 300, yInfo);
    doc.font("Helvetica").fontSize(9).fillColor(colors.secondary)
      .text(payment.razonSocial || "Cliente", 300, yInfo + 15)
      .text(`RUC: ${payment.ruc || "-"}`)
      .text(payment.email_empresa || payment.external_reference || "-")
      .text(payment.direccion || "");

    // --- Tabla de Detalles ---
    const yTable = 240;
    doc.rect(50, yTable, 495, 25).fill(colors.line); // Header bg
    doc.fillColor(colors.text).font("Helvetica-Bold").fontSize(9);
    doc.text("DESCRIPCIÓN", 60, yTable + 8);
    doc.text("MONTO", 450, yTable + 8, { width: 90, align: "right" });

    // Item 1
    const yRow = yTable + 35;
    const desc = payment.mp_preapproval_id
      ? `Suscripción Mensual (ID: ${payment.mp_preapproval_id})`
      : "Servicio de Software ERP";

    doc.fillColor(colors.text).font("Helvetica").fontSize(9);
    doc.text(desc, 60, yRow);
    doc.text(fmtMoney(payment.transaction_amount), 450, yRow, { width: 90, align: "right" });

    // Línea separadora
    doc.moveTo(50, yRow + 20).lineTo(545, yRow + 20).strokeColor(colors.line).stroke();

    // --- Totales ---
    const yTotal = yRow + 40;
    doc.font("Helvetica-Bold").fontSize(11).fillColor(colors.text);
    doc.text("TOTAL PAGADO", 350, yTotal, { width: 100, align: "right" });
    doc.fontSize(14).fillColor(colors.primary);
    doc.text(fmtMoney(payment.transaction_amount), 460, yTotal - 2, { width: 85, align: "right" });

    // --- Footer ---
    const pageHeight = 841.89; // A4 height
    doc.fontSize(8).fillColor(colors.secondary);

    // Nota legal
    doc.text("Este documento es un comprobante de pago interno del sistema y no reemplaza a una factura electrónica SUNAT salvo que se indique lo contrario.", 50, pageHeight - 80, { align: "center", width: 495 });

    // Website
    doc.fillColor(colors.primary).text("www.horycore.online", 50, pageHeight - 50, { align: "center" });

    doc.end();
  } catch (e) {
    console.error(e);
    res.status(500).send("Error generando comprobante PDF");
  } finally {
    if (connection) connection.release();
  }
};