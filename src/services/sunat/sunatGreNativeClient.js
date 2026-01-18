/**
 * Cliente GRE alternativo usando https nativo en vez de node-soap.
 * SUNAT Beta tiene comportamientos extraños con node-soap que causan 401 intermitentes.
 * Esta implementación usa https directamente, lo cual ha demostrado funcionar.
 */
import https from 'https';
import { getSunatGreConfig, assertSunatGreCredentials } from './sunatGreConfig.js';

const GRE_ENDPOINT_BETA = 'https://e-beta.sunat.gob.pe/ol-ti-itemision-guia-gem-beta/billService';
const GRE_ENDPOINT_PROD = 'https://e-guiaremision.sunat.gob.pe/ol-ti-itemision-guia-gem/billService';

function buildSendBillSoapEnvelope({ username, password, fileName, contentFileBase64 }) {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.sunat.gob.pe">
  <soap:Header>
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
      <wsse:UsernameToken>
        <wsse:Username>${username}</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${password}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soap:Header>
  <soap:Body>
    <ser:sendBill>
      <fileName>${fileName}</fileName>
      <contentFile>${contentFileBase64}</contentFile>
    </ser:sendBill>
  </soap:Body>
</soap:Envelope>`;
}

function buildGetStatusSoapEnvelope({ username, password, ticket }) {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.sunat.gob.pe">
  <soap:Header>
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
      <wsse:UsernameToken>
        <wsse:Username>${username}</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${password}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soap:Header>
  <soap:Body>
    <ser:getStatus>
      <ticket>${ticket}</ticket>
    </ser:getStatus>
  </soap:Body>
</soap:Envelope>`;
}

function makeHttpsRequest(endpoint, soapAction, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': soapAction,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/xml,application/xml,*/*',
        'Connection': 'close',
        'Content-Length': Buffer.byteLength(body, 'utf8'),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function parseXmlValue(xml, tagName) {
  // Simple parser para extraer valor de un tag XML
  const regex = new RegExp(`<[^>]*${tagName}[^>]*>([^<]*)<`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : null;
}

function parseApplicationResponse(xml) {
  // Buscar applicationResponse en el XML de respuesta
  const match = xml.match(/<applicationResponse[^>]*>([^<]*)<\/applicationResponse>/i) ||
                xml.match(/<[^:]*:applicationResponse[^>]*>([^<]*)<\/[^:]*:applicationResponse>/i);
  return match ? match[1] : null;
}

function parseFault(xml) {
  const faultcode = parseXmlValue(xml, 'faultcode');
  const faultstring = parseXmlValue(xml, 'faultstring');
  const message = parseXmlValue(xml, 'message');
  if (faultcode || faultstring) {
    return { faultcode, faultstring, message };
  }
  return null;
}

function parseTicket(xml) {
  return parseXmlValue(xml, 'ticket');
}

function parseStatusCode(xml) {
  return parseXmlValue(xml, 'statusCode');
}

function parseContent(xml) {
  const match = xml.match(/<content[^>]*>([^<]*)<\/content>/i) ||
                xml.match(/<[^:]*:content[^>]*>([^<]*)<\/[^:]*:content>/i);
  return match ? match[1] : null;
}

export async function sunatGreSendBillNative({ fileName, zipBuffer, config } = {}) {
  const cfg = config || getSunatGreConfig();
  assertSunatGreCredentials(cfg);
  if (!fileName) throw new Error('fileName es requerido');
  if (!zipBuffer) throw new Error('zipBuffer es requerido');

  const endpoint = cfg.env === 'prod' ? GRE_ENDPOINT_PROD : GRE_ENDPOINT_BETA;
  const contentFileBase64 = Buffer.isBuffer(zipBuffer) ? zipBuffer.toString('base64') : zipBuffer;
  
  const soapBody = buildSendBillSoapEnvelope({
    username: cfg.credentials.username,
    password: cfg.credentials.password,
    fileName,
    contentFileBase64,
  });

  const response = await makeHttpsRequest(endpoint, 'urn:sendBill', soapBody);
  
  if (response.statusCode !== 200) {
    const fault = parseFault(response.body);
    throw new Error(`SUNAT GRE Error HTTP ${response.statusCode}: ${fault?.faultstring || response.statusMessage}`);
  }

  const fault = parseFault(response.body);
  if (fault) {
    return {
      success: false,
      error: fault,
      raw: response,
    };
  }

  // Para GRE, SUNAT puede devolver:
  // 1. applicationResponse directamente (sincrónico)
  // 2. ticket para consultar después (asincrónico)
  const applicationResponse = parseApplicationResponse(response.body);
  const ticket = parseTicket(response.body);

  return {
    success: true,
    applicationResponseBase64: applicationResponse,
    ticket,
    raw: response,
  };
}

export async function sunatGreGetStatusNative({ ticket, config } = {}) {
  const cfg = config || getSunatGreConfig();
  assertSunatGreCredentials(cfg);
  if (!ticket) throw new Error('ticket es requerido');

  const endpoint = cfg.env === 'prod' ? GRE_ENDPOINT_PROD : GRE_ENDPOINT_BETA;
  
  const soapBody = buildGetStatusSoapEnvelope({
    username: cfg.credentials.username,
    password: cfg.credentials.password,
    ticket,
  });

  const response = await makeHttpsRequest(endpoint, 'urn:getStatus', soapBody);
  
  if (response.statusCode !== 200) {
    const fault = parseFault(response.body);
    throw new Error(`SUNAT GRE Error HTTP ${response.statusCode}: ${fault?.faultstring || response.statusMessage}`);
  }

  const fault = parseFault(response.body);
  const statusCode = parseStatusCode(response.body);
  const content = parseContent(response.body);

  return {
    success: !fault,
    statusCode,
    contentBase64: content,
    error: fault,
    raw: response,
  };
}
