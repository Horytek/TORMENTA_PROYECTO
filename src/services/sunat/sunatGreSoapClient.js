import soap from 'soap';
import https from 'https';
import { getSunatGreConfig, assertSunatGreCredentials } from './sunatGreConfig.js';
import { ensureLocalWsdl } from './sunatWsdlLocalCache.js';
import { SunatWSSecurity } from './sunatWsSecurity.js';

// Nota: No usar caché de cliente para evitar 401 por reutilización de conexión
// Creamos un agente HTTPS sin keep-alive para evitar socket reusedSocket: true
const noKeepAliveAgent = new https.Agent({
  keepAlive: false,
  rejectUnauthorized: true,
});

function getWsdlHeaders() {
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    Accept: 'text/xml,application/xml,*/*',
  };
}

function applySunatHttpHeaders(client) {
  const h = getWsdlHeaders();
  client.httpHeaders = { ...(client.httpHeaders || {}), ...h };
  client.addHttpHeader('User-Agent', h['User-Agent']);
  client.addHttpHeader('Accept', h.Accept);
  // Evitar reutilización de conexión que puede causar 401 intermitentes
  client.addHttpHeader('Connection', 'close');
  // Forzar Host sin puerto - nginx de SUNAT puede rechazar Host:xxx:443
  client.addHttpHeader('Host', 'e-beta.sunat.gob.pe');
  
  // Forzar endpoint sin puerto explícito en la URL
  const endpoint = client.endpoint || '';
  if (endpoint.includes(':443')) {
    client.setEndpoint(endpoint.replace(':443', ''));
  }
}

async function getGreClient(cfg) {
  // No usar caché para evitar problemas de conexión reutilizada con SUNAT

  const soapOptions = {
    disableCache: true,
    wsdl_headers: getWsdlHeaders(),
    wsdl_options: { 
      headers: getWsdlHeaders(),
      httpsAgent: noKeepAliveAgent,
    },
  };

  let client;
  try {
    client = await soap.createClientAsync(cfg.greWsdlUrl, soapOptions);
  } catch (err) {
    const msg = String(err?.message || err);
    if (msg.includes('Code: 401') || msg.includes('401 Authorization Required') || msg.includes('Invalid WSDL URL')) {
      const localWsdlPath = await ensureLocalWsdl(cfg.greWsdlUrl);
      client = await soap.createClientAsync(localWsdlPath, soapOptions);
    } else {
      throw err;
    }
  }

  applySunatHttpHeaders(client);
  // IMPORTANTE: Usamos implementación propia porque SUNAT beta rechaza headers con
  // Timestamps, wsu:Id, wsu:Created, Nonce u otros atributos extra.
  client.setSecurity(new SunatWSSecurity(cfg.credentials.username, cfg.credentials.password));

  return client;
}

function pickResult(asyncReturn) {
  if (!Array.isArray(asyncReturn)) return asyncReturn;
  return asyncReturn[0];
}

export async function sunatGreSendBill({ fileName, zipBuffer, config } = {}) {
  const cfg = config || getSunatGreConfig();
  assertSunatGreCredentials(cfg);
  if (!fileName) throw new Error('fileName es requerido');
  if (!zipBuffer) throw new Error('zipBuffer es requerido');

  const client = await getGreClient(cfg);
  const args = {
    fileName,
    contentFile: Buffer.isBuffer(zipBuffer) ? zipBuffer.toString('base64') : zipBuffer,
  };

  const res = pickResult(await client.sendBillAsync(args));
  return {
    raw: res,
    applicationResponseBase64: res?.applicationResponse,
  };
}

export async function sunatGreGetStatus({ ticket, config } = {}) {
  const cfg = config || getSunatGreConfig();
  assertSunatGreCredentials(cfg);
  if (!ticket) throw new Error('ticket es requerido');

  const client = await getGreClient(cfg);
  const res = pickResult(await client.getStatusAsync({ ticket }));

  return {
    raw: res,
    statusCode: res?.status?.statusCode,
    statusMessage: res?.status?.statusMessage,
    contentBase64: res?.status?.content,
  };
}
