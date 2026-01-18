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

    const currentYear = new Date().getFullYear();

    // Template de correo elegante y profesional
    const emailHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" style="width:100%;border-collapse:collapse;background-color:#f8fafc;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" style="width:100%;max-width:600px;border-collapse:collapse;">
          
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px;background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);border-radius:16px 16px 0 0;">
              <table role="presentation" style="width:100%;border-collapse:collapse;">
                <tr>
                  <td>
                    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                      HoryCore
                    </h1>
                    <p style="margin:4px 0 0 0;color:#94a3b8;font-size:13px;font-weight:500;">
                      Sistema de Gestión Empresarial
                    </p>
                  </td>
                  <td align="right">
                    <div style="background:linear-gradient(135deg,#10b981,#059669);width:48px;height:48px;border-radius:12px;display:inline-block;">
                      <table role="presentation" style="width:48px;height:48px;">
                        <tr>
                          <td align="center" valign="middle" style="color:#ffffff;font-size:20px;">✓</td>
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:0;background-color:#ffffff;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
              
              <!-- Welcome Section -->
              <table role="presentation" style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:40px 40px 24px 40px;">
                    <h2 style="margin:0 0 8px 0;color:#0f172a;font-size:22px;font-weight:700;">
                      ¡Bienvenido a HoryCore! 🎉
                    </h2>
                    <p style="margin:0;color:#64748b;font-size:15px;line-height:1.6;">
                      Tu cuenta de administrador ha sido creada exitosamente. A continuación encontrarás tus credenciales de acceso.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Credentials Card -->
              <table role="presentation" style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:0 40px 32px 40px;">
                    <table role="presentation" style="width:100%;border-collapse:collapse;background:linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%);border-radius:12px;border:1px solid #e2e8f0;">
                      
                      <!-- Usuario -->
                      <tr>
                        <td style="padding:20px 24px 12px 24px;border-bottom:1px solid #e2e8f0;">
                          <table role="presentation" style="width:100%;border-collapse:collapse;">
                            <tr>
                              <td style="width:40px;vertical-align:top;">
                                <div style="width:36px;height:36px;background:#dbeafe;border-radius:8px;">
                                  <table role="presentation" style="width:36px;height:36px;">
                                    <tr>
                                      <td align="center" valign="middle" style="color:#2563eb;font-size:14px;">👤</td>
                                    </tr>
                                  </table>
                                </div>
                              </td>
                              <td style="vertical-align:middle;padding-left:12px;">
                                <p style="margin:0;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Usuario</p>
                                <p style="margin:4px 0 0 0;color:#0f172a;font-size:18px;font-weight:700;font-family:monospace;">${usuario}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Contraseña -->
                      <tr>
                        <td style="padding:12px 24px 20px 24px;">
                          <table role="presentation" style="width:100%;border-collapse:collapse;">
                            <tr>
                              <td style="width:40px;vertical-align:top;">
                                <div style="width:36px;height:36px;background:#dcfce7;border-radius:8px;">
                                  <table role="presentation" style="width:36px;height:36px;">
                                    <tr>
                                      <td align="center" valign="middle" style="color:#16a34a;font-size:14px;">🔐</td>
                                    </tr>
                                  </table>
                                </div>
                              </td>
                              <td style="vertical-align:middle;padding-left:12px;">
                                <p style="margin:0;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Contraseña</p>
                                <p style="margin:4px 0 0 0;color:#0f172a;font-size:18px;font-weight:700;font-family:monospace;">${contrasena}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Alert -->
              <table role="presentation" style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:0 40px 32px 40px;">
                    <table role="presentation" style="width:100%;border-collapse:collapse;background:#fef3c7;border-radius:12px;border:1px solid #fcd34d;">
                      <tr>
                        <td style="padding:16px 20px;">
                          <table role="presentation" style="width:100%;border-collapse:collapse;">
                            <tr>
                              <td style="width:24px;vertical-align:top;font-size:16px;">⚠️</td>
                              <td style="padding-left:12px;">
                                <p style="margin:0;color:#92400e;font-size:14px;font-weight:600;">Activación pendiente</p>
                                <p style="margin:6px 0 0 0;color:#a16207;font-size:13px;line-height:1.5;">
                                  Una vez confirmado tu pago, recibirás una clave de activación de 4 dígitos para acceder al sistema.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <table role="presentation" style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:0 40px 32px 40px;">
                    <table role="presentation" style="width:100%;border-collapse:collapse;background:#f1f5f9;border-radius:12px;">
                      <tr>
                        <td style="padding:16px 20px;">
                          <p style="margin:0;color:#475569;font-size:13px;line-height:1.6;">
                            🔒 <strong>Seguridad:</strong> Guarda estas credenciales en un lugar seguro. Te recomendamos cambiar tu contraseña después del primer inicio de sesión.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:0 40px 40px 40px;" align="center">
                    <a href="https://horycore.online/login" style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;box-shadow:0 4px 12px rgba(16,185,129,0.3);">
                      Ir al Login →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background:#0f172a;border-radius:0 0 16px 16px;">
              <table role="presentation" style="width:100%;border-collapse:collapse;">
                <tr>
                  <td align="center">
                    <p style="margin:0;color:#94a3b8;font-size:13px;">
                      © ${currentYear} <strong style="color:#e2e8f0;">HoryCore</strong> by Horytek
                    </p>
                    <p style="margin:8px 0 0 0;color:#64748b;font-size:12px;">
                      Este correo fue enviado automáticamente. Responde para contactar soporte.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Enviar correo
    const { data, error } = await resend.emails.send({
      from: 'HoryCore <soporte@send.horycore.online>',
      to,
      subject: '🎉 Tus credenciales de acceso a HoryCore',
      reply_to: 'soporte@horycore.online',
      html: emailHtml
    });

    if (error) {
      return res.status(500).json({ ok: false, message: 'Error enviando correo', error });
    }

    res.json({ ok: true, message: 'Correo enviado', data });
  } catch (err) {
    console.error('Error en sendCredencialesEmail:', err);
    res.status(500).json({ ok: false, message: 'Error interno', error: err.message });
  } finally {
    if (connection) connection.release();
  }
};