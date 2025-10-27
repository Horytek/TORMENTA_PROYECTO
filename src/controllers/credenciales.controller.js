import { Resend } from 'resend';
import { getConnection } from '../database/database.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendCredencialesEmail = async (req, res) => {
  let connection;
  try {
    const { to, usuario, contrasena } = req.body;
    if (!to || !usuario || !contrasena) {
      return res.status(400).json({ ok: false, message: 'Faltan campos requeridos' });
    }

    // Generar clave de 4 dígitos
    const claveAcceso = Math.floor(1000 + Math.random() * 9000).toString();

    // Guardar la clave en el usuario (campo clave_acceso)
    connection = await getConnection();
    await connection.query(
      "UPDATE usuario SET clave_acceso = ? WHERE usua = ? LIMIT 1",
      [claveAcceso, usuario]
    );

    // Enviar correo SOLO con usuario y contraseña, indicando que falta la clave
    const { data, error } = await resend.emails.send({
      from: 'HoryCore <soporte@send.horycore.online>', // evita no-reply
      to,
      subject: 'Credenciales de acceso a HoryCore',
      reply_to: 'soporte@horycore.online',              // permite respuestas reales
      html: `
        <h2>Usuario administrador generado</h2>
        <p>Usuario: <b>${usuario}</b></p>
        <p>Contraseña: <b>${contrasena}</b></p>
        <p style="color:#d97706;"><b>Importante:</b> Para activar tu cuenta y acceder, recibirás una clave de activación de 4 dígitos una vez confirmado tu pago.</p>
        <p style="font-size:13px;color:#888;">Guarda estos datos en un lugar seguro.</p>
      `
    });

    if (error) {
      return res.status(500).json({ ok: false, message: 'Error enviando correo', error });
    }

    res.json({ ok: true, message: 'Correo enviado', data });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error interno', error: err.message });
  } finally {
    if (connection) connection.release();
  }
};