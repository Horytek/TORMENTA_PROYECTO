import axios from "axios";
import { MercadoPagoConfig, Preference } from "mercadopago";
import dotenv from "dotenv";
import { getConnection } from "../database/database.js";
import { Resend } from "resend";
dotenv.config();

const client = new MercadoPagoConfig({
  accessToken: process.env.ACCESS_TOKEN,
});
// !TODO: Instancia de Resend para envío de correos
const resend = new Resend(process.env.RESEND_API_KEY);

export const createPreference = async (req, res) => {
  try {
    console.log('\n────────────────────────────────────────────────────────');
    console.log('CREANDO PREFERENCIA DE PAGO');
    console.log('────────────────────────────────────────────────────────');
    console.log('Body recibido:', JSON.stringify(req.body, null, 2));
    
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
    
    console.log('\Datos de la preferencia:');
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
    console.log('- Pending:', back_urls.pending);

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

    console.log('\Preferencia creada exitosamente');
    console.log('- Preference ID:', result.id);
    console.log('- Init Point:', result.init_point);
    console.log('────────────────────────────────────────────────────────');

    res.status(200).json({ id: result.id, success: true });
  } catch (error) {
    console.error('\ERROR al crear preferencia:');
    console.error('- Mensaje:', error.message);
    console.error('- Causa:', error.cause);
    console.error('- Stack:', error.stack);
    console.log('────────────────────────────────────────────────────────');
    
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
    console.log('\n[GUARDANDO PAGO EN BD]');
    console.log(`ID Tenant: ${id_tenant}`);
    console.log(`Payment ID: ${payment.id}`);

    // Preparar datos para insertar
    const paymentData = {
      id_tenant: id_tenant,
      mp_payment_id: payment.id,
      status: payment.status || 'unknown',
      transaction_amount: payment.transaction_amount || 0,
      currency_id: payment.currency_id || 'PEN',
      external_reference: payment.external_reference || null,
      mp_preference_id: payment.preference_id || null,
      date_created: payment.date_created ? new Date(payment.date_created) : null,
      date_approved: payment.date_approved ? new Date(payment.date_approved) : null,
    };

    // Usar INSERT ... ON DUPLICATE KEY UPDATE para evitar duplicados
    const query = `
      INSERT INTO mp_payments (
        id_tenant,
        mp_payment_id,
        status,
        transaction_amount,
        currency_id,
        external_reference,
        mp_preference_id,
        date_created,
        date_approved
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        transaction_amount = VALUES(transaction_amount),
        currency_id = VALUES(currency_id),
        external_reference = VALUES(external_reference),
        mp_preference_id = VALUES(mp_preference_id),
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
      paymentData.date_created,
      paymentData.date_approved,
    ];

    const [result] = await connection.query(query, values);

    if (result.affectedRows > 0) {
      console.log(`Pago guardado correctamente (${result.insertId ? 'nuevo' : 'actualizado'})`);
      return { success: true, isNew: Boolean(result.insertId) };
    } else {
      console.warn('No se realizaron cambios en la BD');
      return { success: false, isNew: false };
    }
  } catch (error) {
    console.error('ERROR guardando pago en BD:');
    console.error(error.message);
    throw error;
  }
}

export const paymentWebhook = async (req, res) => {
  let connection;
  try {
    console.log('\n────────────────────────────────────────────────────────');
    console.log('[WEBHOOK] - Notificación recibida de Mercado Pago');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Method:', req.method);
    console.log('URL:', req.originalUrl);
    console.log('IP:', req.ip || req.connection?.remoteAddress);
    console.log('Headers (principales):');
    console.log(`   x-signature: ${req.headers['x-signature'] || '(sin firma)'}`);
    console.log(`   x-request-id: ${req.headers['x-request-id'] || '(sin id)'}`);
    console.log(`   user-agent: ${req.headers['user-agent']}`);
    console.log('────────────────────────────────────────────────────────');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Query params:', JSON.stringify(req.query, null, 2));
    console.log('────────────────────────────────────────────────────────');

    // Extraer datos del evento
    const { type, id, live_mode, action } = parseMPEvent(req);

    console.log('\n[EVENTO DETECTADO]');
    console.log(`Tipo: ${type || 'NO DETECTADO'}`);
    console.log(`ID: ${id || 'NO DETECTADO'}`);
    console.log(`Acción: ${action || 'N/A'}`);
    console.log('────────────────────────────────────────────────────────');

    // Validación inicial
    if (req.method === 'GET' && !type && !id) {
      console.log('Petición GET de verificación de Mercado Pago');
      return res.sendStatus(200);
    }

    if (!type || !id) {
      console.warn('Notificación incompleta: falta "type" o "id"');
      return res.sendStatus(200);
    }

    // Solo procesar pagos
    if (type !== 'payment') {
      console.log(`Evento no es de tipo "payment" (type=${type}), ignorado.`);
      return res.sendStatus(200);
    }

    console.log('\n[PROCESANDO EVENTO DE PAGO]');
    console.log(`Consultando API de MP con ID: ${id}`);

    // Consultar detalles del pago
    const { data: payment } = await axios.get(
      `https://api.mercadopago.com/v1/payments/${id}`,
      { headers: { Authorization: `Bearer ${process.env.ACCESS_TOKEN}` } }
    );

    console.log('\n[DETALLES DEL PAGO]');
    console.log(`ID: ${payment.id}`);
    console.log(`Status: ${payment.status}`);
    console.log(`Status Detail: ${payment.status_detail}`);
    console.log(`Monto: ${payment.transaction_amount} ${payment.currency_id}`);
    console.log(`Comprador: ${payment.payer?.email}`);
    console.log(`External Ref: ${payment.external_reference}`);
    console.log(`Fecha creación: ${payment.date_created}`);
    console.log(`Fecha aprobación: ${payment.date_approved}`);
    console.log('────────────────────────────────────────────────────────');

    if (payment.status === 'approved' && action === 'payment.created') {
      console.log('[PAGO APROBADO] Acción: payment.created');
      console.log('Iniciando proceso de envío de clave de acceso...');

      connection = await getConnection();
      console.log('Conexión a base de datos establecida.');

      const externalReference = payment.external_reference;
      if (!externalReference) {
        console.error('ERROR: No existe external_reference en el pago.');
        return res.sendStatus(200);
      }

      console.log(`Buscando empresa con email: ${externalReference}`);

      const [empresas] = await connection.query(
        'SELECT id_empresa, id_tenant FROM empresa WHERE email = ? LIMIT 1',
        [externalReference]
      );

      if (!empresas.length) {
        console.error('ERROR: No se encontró empresa para el email proporcionado.');
        return res.sendStatus(200);
      }

      const empresa = empresas[0];
      console.log(`Empresa encontrada (id_empresa=${empresa.id_empresa}, id_tenant=${empresa.id_tenant})`);

      // GUARDAR PAGO EN LA BASE DE DATOS
      try {
        await saveMPPayment(connection, empresa.id_tenant, payment);
      } catch (error) {
        console.error('Error al guardar el pago, pero se continuará con el proceso');
      }

      console.log('Buscando usuario administrador...');
      const [usuarios] = await connection.query(
        'SELECT id_usuario, usua, clave_acceso FROM usuario WHERE id_tenant = ? AND id_rol = 1 LIMIT 1',
        [empresa.id_tenant]
      );

      if (!usuarios.length) {
        console.error(`ERROR: No se encontró usuario administrador para el tenant ${empresa.id_tenant}`);
        return res.sendStatus(200);
      }

      const usuario = usuarios[0];
      console.log(`Usuario admin encontrado: ${usuario.usua}`);
      console.log(`Clave de acceso: ${usuario.clave_acceso ? '✓ (existe)' : '✗ (no existe)'}`);

      console.log('\n[ENVÍO DE CLAVE]');
      console.log(`Para: ${externalReference}`);
      console.log(`Clave: ${usuario.clave_acceso}`);
      
      // !TODO: Envío de correo con clave de acceso inicial
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
        console.error('ERROR enviando correo de clave inicial:');
        console.error(JSON.stringify(error, null, 2));
      } else {
        console.log('¡Correo de clave inicial enviado exitosamente!');
        console.log('────────────────────────────────────────────────────────');
      }
    } else {
      console.log('\[EVENTO IGNORADO]');
      if (payment.status !== 'approved') console.log(`   Razón: status=${payment.status}`);
      if (action !== 'payment.created') console.log(`   Razón: action=${action}`);
      console.log('────────────────────────────────────────────────────────');
    }

    return res.sendStatus(200);

  } catch (error) {
    console.error('\n[ERROR GENERAL EN WEBHOOK]');
    console.error('Mensaje:', error.message);
    if (error.response) {
      console.error('Status Code:', error.response.status);
      console.error('Response Body:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('Stack Trace:', error.stack);
    console.log('────────────────────────────────────────────────────────');
    return res.sendStatus(200);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
