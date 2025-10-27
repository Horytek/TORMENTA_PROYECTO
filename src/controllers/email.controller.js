import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendResendEmail = async (req, res) => {
  try {
    const { sunat_client_id, sunat_client_secret } = req.body;
    const certificado = req.files?.certificado?.[0];
    const logo = req.files?.logo?.[0];

    if (!certificado || !logo || !sunat_client_id || !sunat_client_secret) {
      return res.status(400).json({ ok: false, message: 'Faltan campos requeridos' });
    }

    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'bustamante777a@gmail.com',
      subject: 'Datos SUNAT recibidos',
      html: `
        <h2>Datos SUNAT</h2>
        <ul>
          <li><b>Certificado:</b> ${certificado.originalname}</li>
          <li><b>Logo:</b> ${logo.originalname}</li>
          <li><b>Client ID:</b> ${sunat_client_id}</li>
          <li><b>Client Secret:</b> ${sunat_client_secret}</li>
        </ul>
      `,
      attachments: [
        {
          filename: certificado.originalname,
          content: certificado.buffer
        },
        {
          filename: logo.originalname,
          content: logo.buffer
        }
      ]
    });

    if (error) {
      console.error('Error detallado de Resend:', error);
      return res.status(500).json({
        ok: false,
        message: 'Error enviando correo',
        error: typeof error === 'object' ? error : { message: String(error) }
      });
    }

    res.json({ ok: true, message: 'Correo enviado', data });
  } catch (err) {
    console.error('Resend error:', err);
    res.status(500).json({
      ok: false,
      message: 'Error interno',
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
        ...(err.response && { response: err.response.data })
      }
    });
  }
};