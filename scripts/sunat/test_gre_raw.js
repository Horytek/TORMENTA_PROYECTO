/**
 * Test directo de autenticación GRE usando https nativo (sin node-soap)
 * Para verificar que las credenciales funcionan.
 */
import 'dotenv/config';
import https from 'https';

const GRE_ENDPOINT = 'https://e-beta.sunat.gob.pe/ol-ti-itemision-guia-gem-beta/billService';
const USERNAME = `${process.env.SUNAT_RUC}${process.env.SUNAT_SOL_USER}`;
const PASSWORD = process.env.SUNAT_SOL_PASS;

const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.sunat.gob.pe">
  <soap:Header>
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
      <wsse:UsernameToken>
        <wsse:Username>${USERNAME}</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${PASSWORD}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soap:Header>
  <soap:Body>
    <ser:getStatus>
      <ticket>fake-ticket</ticket>
    </ser:getStatus>
  </soap:Body>
</soap:Envelope>`;

console.log('=== Test GRE Raw HTTPS ===');
console.log('Endpoint:', GRE_ENDPOINT);
console.log('Username:', USERNAME);
console.log('Password:', PASSWORD ? '***' : '(vacío)');

const url = new URL(GRE_ENDPOINT);

const options = {
  hostname: url.hostname,
  port: 443,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'text/xml; charset=utf-8',
    'SOAPAction': 'urn:getStatus',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Accept': 'text/xml,application/xml,*/*',
    'Connection': 'close',
  },
};

const req = https.request(options, (res) => {
  console.log('\n=== Respuesta ===');
  console.log('Status:', res.statusCode, res.statusMessage);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('\nBody:', data);
    
    if (res.statusCode === 200) {
      console.log('\n✅ Autenticación GRE funciona correctamente desde Node.js');
    } else if (res.statusCode === 401) {
      console.log('\n❌ Error 401 - Autenticación rechazada');
    }
  });
});

req.on('error', (e) => {
  console.error('Error de conexión:', e.message);
});

req.write(soapBody);
req.end();
