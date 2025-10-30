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
      from: 'HoryCore <soporte@send.horycore.online>',
      to,
      subject: 'Credenciales de acceso a HoryCore',
      reply_to: 'soporte@horycore.online',
      html: `
        <div style="background:#0b1020;padding:24px 12px;">
          <div style="max-width:680px;margin:0 auto;background:#0f172a;border-radius:16px;overflow:hidden;border:1px solid rgba(148,163,184,.2);color:#e2e8f0">
            <div style="background:linear-gradient(135deg,#1d4ed8,#7c3aed);padding:18px 20px;display:flex;align-items:center;gap:12px">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white" style="opacity:.95">
                <path d="M12 2l3 6 6 .9-4.5 4.4 1 6.3L12 17l-5.5 2.6 1-6.3L3 8.9 9 8z"/>
              </svg>
              <div style="font-weight:800;font-size:16px;letter-spacing:.2px">Usuario administrador generado</div>
              <span style="margin-left:auto;background:rgba(255,255,255,.18);color:#fff;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700">HoryCore</span>
            </div>
            <div style="padding:22px">
              <div style="font-size:15px;color:#cbd5e1;font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:8px">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color:#0ea5e9">
                  <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm-7 9a7 7 0 0 1 14 0z"/>
                </svg>
                Usuario: <span style="color:#e2e8f0;font-weight:700;margin-left:6px">${usuario}</span>
              </div>
              <div style="font-size:15px;color:#cbd5e1;font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:8px">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color:#16a34a">
                  <path d="M12 17a2 2 0 0 0 2-2V7a2 2 0 0 0-4 0v8a2 2 0 0 0 2 2zm0 2a4 4 0 0 1-4-4V7a4 4 0 0 1 8 0v8a4 4 0 0 1-4 4z"/>
                </svg>
                Contraseña: <span style="color:#e2e8f0;font-weight:700;margin-left:6px">${contrasena}</span>
              </div>
              <div style="margin:18px 0 10px 0;color:#fbbf24;font-size:15px;display:flex;align-items:center;gap:8px">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color:#fbbf24">
                  <path d="M12 2a10 10 0 1 1-10 10A10 10 0 0 1 12 2zm1 15h-2v-2h2zm0-4h-2V7h2z"/>
                </svg>
                <b>Importante:</b> Para activar tu cuenta y acceder, recibirás una clave de activación de 4 dígitos una vez confirmado tu pago.
              </div>
              <div style="font-size:13px;color:#94a3b8;margin-top:10px">
                Guarda estos datos en un lugar seguro.
              </div>
            </div>
            <div style="padding:18px 20px;border-top:1px solid rgba(148,163,184,.2);background:#0b1220;color:#94a3b8;text-align:center">
              <div style="font-weight:800;color:#e2e8f0">Horytek ERP</div>
              <div style="font-size:12px">Sistema de Gestión Empresarial</div>
              <div style="margin-top:6px;font-size:12px;color:#64748b">
                Este correo fue enviado automáticamente desde la plataforma. Responde directamente para contactar a soporte.
              </div>
            </div>
          </div>
        </div>
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