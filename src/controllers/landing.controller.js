import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Controlador para manejar consultas desde la landing page
 * Recibe correos y mensajes de usuarios interesados
 */

// Enviar consulta/solicitud desde landing
export const sendLandingContact = async (req, res) => {
  try {
    const { email, message, tipo = 'general' } = req.body;

    // Validaciones
    if (!email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Email y mensaje son requeridos'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }

    // Determinar el asunto según el tipo de consulta
    const asuntoMap = {
      demo: 'Nueva solicitud HoryCore',
      contact: 'Nueva consulta de contacto',
      support: 'Solicitud de soporte',
      general: 'Nueva consulta general'
    };

    const asunto = asuntoMap[tipo] || asuntoMap.general;

    // Email del gerente (destinatario final)
    const emailGerente = process.env.GERENTE_EMAIL || 'bustamante777a@gmail.com';

    // Usar dominio de prueba de Resend o dominio verificado
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    // Enviar email al gerente con reply-to del usuario
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [emailGerente],
      replyTo: email,
      subject: asunto,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="margin:0;padding:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
            <div style="background:#0b1020;padding:24px 12px">
              <div style="max-width:680px;margin:0 auto;background:#0f172a;border-radius:16px;overflow:hidden;border:1px solid rgba(148,163,184,.2);color:#e2e8f0">
                <!-- Header -->
                <div style="background:linear-gradient(135deg,#1d4ed8,#7c3aed);padding:18px 20px;display:flex;align-items:center;gap:12px">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white" style="opacity:.95">
                    <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z" stroke="white" stroke-width="2"/>
                  </svg>
                  <div style="font-weight:800;font-size:16px;letter-spacing:.2px">Nueva Solicitud desde Landing</div>
                  <span style="margin-left:auto;background:rgba(255,255,255,.18);color:#fff;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700">HORYCORE</span>
                </div>

                <!-- Body -->
                <div style="padding:22px">
                  <!-- De -->
                  <div style="margin-bottom:14px;font-weight:700;color:#cbd5e1;display:flex;align-items:center;gap:8px">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color:#2563eb">
                      <path d="M3 5h18a2 2 0 0 1 2 2v.3l-11 6.6L1 7.3V7a2 2 0 0 1 2-2zm19 5.7V17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6.3l10 6 10-6z"/>
                    </svg>
                    <span>De</span>
                  </div>
                  <div style="border:1px solid rgba(148,163,184,.25);border-radius:12px;padding:12px 14px;background:#0b1220">
                    <a href="mailto:${email}" style="color:#60a5fa;text-decoration:none;font-weight:600">${email}</a>
                    <div style="margin-top:6px;color:#94a3b8;font-size:12px">Puedes responder directamente a este correo</div>
                  </div>

                  <!-- Tipo de consulta -->
                  <div style="margin-top:18px;border:1px solid rgba(148,163,184,.25);border-radius:12px;padding:10px 12px;background:#0b1220">
                    <div style="font-size:12px;color:#94a3b8;margin-bottom:6px;display:flex;align-items:center;gap:8px">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color:#0ea5e9">
                        <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"/>
                      </svg>
                      <span>Tipo de consulta</span>
                    </div>
                    <div style="font-weight:800;color:#c084fc;background:#2e1065;border:1px solid #7c3aed;padding:6px 10px;border-radius:10px;display:inline-block">${tipo.toUpperCase()}</div>
                  </div>

                  <!-- Mensaje -->
                  <div style="margin-top:18px;font-weight:700;color:#cbd5e1;display:flex;align-items:center;gap:8px">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color:#ef4444">
                      <path d="M2 3h20v14H6l-4 4V3zm4 5v2h12V8H6z"/>
                    </svg>
                    <span>Mensaje del Usuario</span>
                  </div>
                  <div style="margin-top:8px;border:1px solid rgba(148,163,184,.25);border-radius:12px;background:#0b1220">
                    <pre style="margin:0;padding:14px 16px;font-family:ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap;color:#e2e8f0">${message}</pre>
                  </div>

                  <!-- Timestamp -->
                  <div style="margin-top:16px;color:#94a3b8;font-size:12px;display:flex;align-items:center;gap:8px">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color:#f59e0b">
                      <path d="M7 2h2v2h6V2h2v2h4v18H3V4h4V2zm14 8H3v10h18V10zM5 12h4v4H5v-4z"/>
                    </svg>
                    Recibido el ${new Date().toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}
                  </div>
                </div>

                <!-- Footer -->
                <div style="padding:18px 20px;border-top:1px solid rgba(148,163,184,.2);background:#0b1220;color:#94a3b8;text-align:center">
                  <div style="font-weight:800;color:#e2e8f0">Horytek ERP</div>
                  <div style="font-size:12px">Sistema de Gestión Empresarial</div>
                  <div style="margin-top:6px;font-size:12px;color:#64748b">
                    Este correo fue enviado automáticamente desde la landing page. Responde directamente para contactar al usuario.
                  </div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `
    });

    if (error) {
      console.error('Error al enviar email al gerente:', error);
      console.error('Detalles del error:', JSON.stringify(error, null, 2));
      return res.status(500).json({
        success: false,
        message: 'Error al enviar la consulta',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    console.log('Email enviado exitosamente al gerente:', data);

    // Enviar email de confirmación al usuario
    const confirmacionUsuario = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: 'Hemos recibido tu consulta - Horytek ERP',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="margin:0;padding:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
            <div style="background:#0b1020;padding:24px 12px">
              <div style="max-width:680px;margin:0 auto;background:#0f172a;border-radius:16px;overflow:hidden;border:1px solid rgba(148,163,184,.2);color:#e2e8f0">
                <!-- Header -->
                <div style="background:linear-gradient(135deg,#16a34a,#22c55e);padding:18px 20px;display:flex;align-items:center;gap:12px">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white" style="opacity:.95">
                    <path d="M5 13L9 17L19 7" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <div style="font-weight:800;font-size:16px;letter-spacing:.2px">¡Gracias por contactarnos!</div>
                  <span style="margin-left:auto;background:rgba(255,255,255,.18);color:#fff;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700">HORYCORE</span>
                </div>

                <!-- Body -->
                <div style="padding:22px">
                  <p style="color:#e2e8f0;font-size:16px;line-height:1.7;margin:0 0 18px 0">
                    <strong style="font-size:18px">Hola,</strong>
                  </p>
                  
                  <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 18px 0">
                    Hemos recibido tu consulta y queremos agradecerte por tu interés en 
                    <strong style="color:#60a5fa">Horytek ERP</strong>.
                  </p>

                  <!-- Highlight box -->
                  <div style="border:1px solid rgba(148,163,184,.25);border-radius:12px;padding:16px 18px;background:#0b1220;margin:18px 0;border-left:4px solid #10b981">
                    <div style="display:flex;align-items:flex-start;gap:12px">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="color:#10b981;flex-shrink:0">
                        <path d="M13 10V3L4 14H11L11 21L20 10L13 10Z"/>
                      </svg>
                      <p style="margin:0;color:#d1fae5;font-size:14px;line-height:1.6">
                        Nuestro equipo revisará tu mensaje y se pondrá en contacto contigo 
                        lo antes posible, generalmente en menos de 24 horas.
                      </p>
                    </div>
                  </div>

                  <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:18px 0">
                    Mientras tanto, te invitamos a explorar más sobre nuestras soluciones 
                    y funcionalidades en nuestro sitio web.
                  </p>

                  <p style="color:#e2e8f0;font-size:15px;line-height:1.7;margin:24px 0 0 0">
                    Saludos cordiales,<br>
                    <strong style="color:#60a5fa">El equipo de Horytek</strong>
                  </p>
                </div>

                <!-- Footer -->
                <div style="padding:18px 20px;border-top:1px solid rgba(148,163,184,.2);background:#0b1220;color:#94a3b8;text-align:center">
                  <div style="font-weight:800;color:#e2e8f0">Horytek ERP</div>
                  <div style="font-size:12px">Solución integral para operaciones clave</div>
                  <div style="margin-top:6px;font-size:12px;color:#64748b">
                    Si no solicitaste esta información, puedes ignorar este correo.
                  </div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `
    });

    console.log('Email de confirmación enviado al usuario');

    res.json({
      success: true,
      message: 'Consulta enviada exitosamente'
    });

  } catch (error) {
    console.error('Error en sendLandingContact:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
