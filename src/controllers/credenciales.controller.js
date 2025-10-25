import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendCredencialesEmail = async (req, res) => {
  try {
    const { to, usuario, contrasena } = req.body;
    if (!to || !usuario || !contrasena) {
      return res.status(400).json({ ok: false, message: 'Faltan campos requeridos' });
    }

    const { data, error } = await resend.emails.send({
      from: 'HoryCore <no-reply@send.horycore.online>', // Usa tu dominio verificado
      to,
      subject: 'Credenciales de acceso a HoryCore',
      html: `
        <h2>Usuario administrador generado</h2>
        <p>Usuario: <b>${usuario}</b></p>
        <p>Contraseña: <b>${contrasena}</b></p>
        <p style="font-size:13px;color:#888;">Guárdalas en un lugar seguro.</p>
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