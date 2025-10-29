import axios from "axios";
import { MercadoPagoConfig, Preference } from "mercadopago";
import dotenv from "dotenv";
import { getConnection } from "../database/database.js";
import { Resend } from "resend";
dotenv.config();

const client = new MercadoPagoConfig({
  accessToken: process.env.ACCESS_TOKEN,
});
const resend = new Resend(process.env.RESEND_API_KEY);

export const createPreference = async (req, res) => {
  try {
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

    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items,
        payer,
        back_urls,
        notification_url,
        external_reference: req.body.external_reference || (payer && payer.email) || "",
      },
    });

    res.status(200).json({ id: result.id });
  } catch (error) {
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

export const paymentWebhook = async (req, res) => {
  let connection;
  try {
    const { type, id, live_mode, action } = parseMPEvent(req);

    if (req.method === "GET" && !type && !id) return res.sendStatus(200);
    if (!type || !id) return res.sendStatus(200);
    if (!live_mode && String(id).match(/^(12345|test|dummy)/i)) return res.sendStatus(200);

    // Solo procesar una vez el evento de pago aprobado
    if (type === "payment") {
      try {
        const { data: payment } = await axios.get(
          `https://api.mercadopago.com/v1/payments/${id}`,
          { headers: { Authorization: `Bearer ${process.env.ACCESS_TOKEN}` } }
        );

        // Solo loguear y enviar correo si es la primera vez (action: 'payment.created')
        if (payment.status === "approved" && action === "payment.created") {
          /*console.log("=== Pago vía webhook ===", {
            id: payment.id,
            status: payment.status,
            status_detail: payment.status_detail,
            amount: payment.transaction_amount,
            email: payment.payer?.email,
            pref: payment.order?.id,
            references: payment.external_reference,
            action,
            live_mode,
          });*/

          connection = await getConnection();

          const externalReference = payment.external_reference;
          if (!externalReference) {
            console.warn("No se encontró email del pagador en el pago aprobado.");
            return res.sendStatus(200);
          }
          const [empresas] = await connection.query(
            "SELECT id_empresa, id_tenant FROM empresa WHERE email = ? LIMIT 1",
            [externalReference]
          );
          if (!empresas.length) {
            console.warn("No se encontró empresa para el email");
            return res.sendStatus(200);
          }
          const empresa = empresas[0];

          const [usuarios] = await connection.query(
            "SELECT id_usuario, usua, clave_acceso FROM usuario WHERE id_tenant = ? AND id_rol = 1 LIMIT 1",
            [empresa.id_tenant]
          );
          if (!usuarios.length) {
            console.warn("No se encontró usuario administrador para id_tenant");
            return res.sendStatus(200);
          }
          const usuario = usuarios[0];

          const { error } = await resend.emails.send({
            from: 'HoryCore <no-reply@send.horycore.online>',
            to: externalReference,
            subject: 'Clave de acceso inicial a HoryCore',
            html: `
              <h2>¡Pago recibido!</h2>
              <p>Tu pago ha sido aprobado correctamente.</p>
              <p><b>Clave de acceso inicial:</b> <span style="font-size:1.5rem;letter-spacing:0.2em;">${usuario.clave_acceso}</span></p>
              <p>Esta es tu clave de acceso. Cuando autentiques tu cuenta, recibirás un nuevo correo que indique si el proceso de activación fue exitoso.</p>
              <p style="font-size:13px;color:#888;">Si tienes dudas, contacta a soporte.</p>
            `
          });

          if (error) {
            console.error("Error enviando correo de clave inicial");
          } else {
            //console.log("Correo de clave inicial enviado");
          }
        }
      } catch (err) {
        const code = err?.response?.status;
        const body = err?.response?.data;
        if (code === 404) {
          console.warn("Payment aún no existe en la API (404). Reintentar con cola/backoff.", { id });
          return res.sendStatus(200);
        }
        console.error("Error consultando payment:", { code, body });
        return res.sendStatus(200);
      } finally {
        if (connection) connection.release();
      }
    } else {
      // Solo loguear eventos no payment una vez
      if (action === "payment.created" || !action) {
        //console.log("Evento no 'payment' recibido:", { type, id, action });
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("Error general en webhook MP");
    return res.sendStatus(200);
  }
};