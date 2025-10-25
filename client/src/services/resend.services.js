import api from '@/api/axios';

// Enviar archivos (certificado/logo) a /send-resend (mantén esta función si la usas)
export async function sendResendEmail(formData) {
  return api.post('/send-resend', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

// Nueva función para enviar credenciales al correo del usuario empresa
export async function sendCredencialesEmail(data) {
  // data = { to, usuario, contrasena }
  return api.post('/send-credenciales', data);
}