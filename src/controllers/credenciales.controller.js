import { Resend } from 'resend';
import axios from "axios";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendCredencialesEmail = async (req, res) => {
  try {
    const { to, usuario, contrasena, paymentId, preferenceId } = req.body;
    if (!to || !usuario || !contrasena || !(paymentId || preferenceId)) {
      return res.status(400).json({ ok: false, message: 'Faltan campos requeridos' });
    }

    // Verificar pago en Mercado Pago
    let pagoAprobado = false;
    let payment_id = paymentId;

    if (!payment_id && preferenceId) {
      const { data } = await axios.get(
        `https://api.mercadopago.com/v1/payments/search?external_reference=${preferenceId}`,
        { headers: { Authorization: `Bearer ${process.env.ACCESS_TOKEN}` } }
      );
      const pago = data.results?.find(p => p.status === "approved");
      if (pago) {
        pagoAprobado = true;
        payment_id = pago.id;
      }
    } else if (payment_id) {
      const { data } = await axios.get(
        `https://api.mercadopago.com/v1/payments/${payment_id}`,
        { headers: { Authorization: `Bearer ${process.env.ACCESS_TOKEN}` } }
      );
      if (data.status === "approved") {
        pagoAprobado = true;
      }
    }

    if (!pagoAprobado) {
      return res.status(400).json({ ok: false, message: "El pago no está aprobado o no existe" });
    }

    const { data, error } = await resend.emails.send({
      from: 'HoryCore <no-reply@send.horycore.online>',
      to,
      subject: 'Credenciales de acceso a HoryCore',
      html: `
        <h2>Usuario administrador generado</h2>
        <p>Usuario: <b>${usuario}</b></p>
        <p>Contraseña: <b>${contrasena}</b></p>
        <p style="font-size:13px;color:#888;">Guárdalas en un lugar seguro.</p>
        <p>ID de pago: <b>${payment_id}</b></p>
      `
    });

    if (error) {
      return res.status(500).json({ ok: false, message: 'Error enviando correo', error });
    }

    res.json({ ok: true, message: 'Correo enviado', data });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error interno', error: err.message });
  }
};