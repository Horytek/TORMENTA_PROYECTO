import soap from 'soap';
import { getSunatConfig, assertSunatCredentials } from './sunatConfig.js';
import { ensureLocalWsdl } from './sunatWsdlLocalCache.js';
import { SunatWSSecurity } from './sunatWsSecurity.js';

// Nota: No usar caché de cliente para evitar 401 por reutilización de conexión

function getWsdlHeaders() {
  // Algunos endpoints SUNAT responden 401 a clientes con headers “raros” al descargar imports (WSDL/XSD).
  // Forzamos un User-Agent y Accept simples para mejorar compatibilidad.
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    Accept: 'text/xml,application/xml,*/*',
  };
}

function applySunatHttpHeaders(client) {
  const h = getWsdlHeaders();
  // node-soap permite setear headers HTTP para el request SOAP.
  client.httpHeaders = { ...(client.httpHeaders || {}), ...h };
  client.addHttpHeader('User-Agent', h['User-Agent']);
  client.addHttpHeader('Accept', h.Accept);
  // Evitar reutilización de conexión que puede causar 401 intermitentes
  client.addHttpHeader('Connection', 'close');

  // Forzar endpoint sin puerto explícito en la URL (evita Host: xxx:443 que nginx puede rechazar con 401)
  const endpoint = client.endpoint || '';
  if (endpoint.includes(':443')) {
    client.setEndpoint(endpoint.replace(':443', ''));
  }
}

async function getBillClient(cfg) {
  // No usar caché para evitar problemas de conexión reutilizada con SUNAT

  const soapOptions = {
    // Algunos WSDL de SUNAT importan otros WSDL; mejor desactivar cache del request.
    disableCache: true,
    wsdl_headers: getWsdlHeaders(),
    wsdl_options: { headers: getWsdlHeaders() },
  };

  // Endpoint de servicio (donde se envían las peticiones SOAP)
  // El WSDL URL es para definición, el endpoint es para las operaciones
  const serviceEndpoint = cfg.billWsdlUrl.replace('?wsdl', '');

  let client;
  let usedLocalWsdl = false;
  try {
    client = await soap.createClientAsync(cfg.billWsdlUrl, soapOptions);
  } catch (err) {
    const msg = String(err?.message || err);
    // En algunos entornos, node-soap descarga imports (WSDL/XSD) con headers que SUNAT rechaza (401).
    // Fallback: descargar WSDL+imports con fetch propio y apuntar a archivos locales reescritos.
    if (msg.includes('Code: 401') || msg.includes('401 Authorization Required') || msg.includes('Invalid WSDL URL')) {
      const localWsdlPath = await ensureLocalWsdl(cfg.billWsdlUrl);
      client = await soap.createClientAsync(localWsdlPath, soapOptions);
      usedLocalWsdl = true;
    } else {
      throw err;
    }
  }

  // Cuando usamos WSDL local, node-soap no conoce el endpoint original
  // Forzar el endpoint correcto siempre
  if (!client.endpoint || usedLocalWsdl) {
    console.log('[SunatSoapClient] Setting endpoint to:', serviceEndpoint);
    client.setEndpoint(serviceEndpoint);
  }

  applySunatHttpHeaders(client);

  // Autenticación WS-Security (usuario/clave SOL)
  // IMPORTANTE: Usamos implementación propia porque SUNAT beta rechaza headers con
  // Timestamps, wsu:Id, wsu:Created, Nonce u otros atributos extra.
  client.setSecurity(new SunatWSSecurity(cfg.credentials.username, cfg.credentials.password));

  console.log('[SunatSoapClient] Client endpoint:', client.endpoint);

  return client;
}

function pickResult(asyncReturn) {
  // soap.createClientAsync().methodAsync() devuelve [result, rawResponse, soapHeader, rawRequest]
  if (!Array.isArray(asyncReturn)) return asyncReturn;
  return asyncReturn[0];
}

// Backend rate limiting for SUNAT Beta
// SUNAT Beta has VERY aggressive rate limiting that returns 401 for too many requests
// After a successful request, Beta blocks the RUC/User for several minutes
let lastSunatSendTime = 0; // Start at 0 so first check always triggers initial delay
let lastSuccessTime = 0; // Track last successful request to enforce longer cooldown

// Different intervals for Beta vs Production
const SUNAT_BETA_MIN_INTERVAL_MS = 120000; // 2 minutes between requests for Beta (after success)
const SUNAT_PROD_MIN_INTERVAL_MS = 5000; // 5 seconds for Production
const SUNAT_INITIAL_DELAY_MS = 3000; // 3 second delay before first attempt

export async function sunatSendBill({ fileName, zipBuffer, config } = {}) {
  console.log('[SunatSoapClient] sunatSendBill called for', fileName);

  const cfg = config || getSunatConfig();
  const isBeta = cfg.env === 'beta';
  const minInterval = isBeta ? SUNAT_BETA_MIN_INTERVAL_MS : SUNAT_PROD_MIN_INTERVAL_MS;

  // For Beta: If we had a recent successful request, enforce longer cooldown
  if (isBeta && lastSuccessTime > 0) {
    const timeSinceSuccess = Date.now() - lastSuccessTime;
    if (timeSinceSuccess < minInterval) {
      const waitTime = minInterval - timeSinceSuccess;
      const waitSecs = Math.ceil(waitTime / 1000);
      console.log(`[SunatSoapClient] SUNAT Beta cooldown: waiting ${waitSecs}s after last success...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  // Always apply initial delay before first attempt to avoid SUNAT rate limiting
  console.log(`[SunatSoapClient] Initial delay: waiting ${SUNAT_INITIAL_DELAY_MS}ms before SUNAT request...`);
  await new Promise(resolve => setTimeout(resolve, SUNAT_INITIAL_DELAY_MS));

  // Additional rate limiting between consecutive requests (even if no success yet)
  const now = Date.now();
  const timeSinceLastSend = now - lastSunatSendTime;
  if (lastSunatSendTime > 0 && timeSinceLastSend < 10000) {
    const waitTime = 10000 - timeSinceLastSend;
    console.log(`[SunatSoapClient] Backend throttle: waiting additional ${waitTime}ms...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  lastSunatSendTime = Date.now();

  console.log('[SunatSoapClient] Config source:', cfg.source || 'DB');
  console.log('[SunatSoapClient] Env:', cfg.env, isBeta ? '(Beta - strict rate limits)' : '(Prod)');
  console.log('[SunatSoapClient] WSDL:', cfg.billWsdlUrl);
  console.log('[SunatSoapClient] Username:', cfg.credentials?.username);
  console.log('[SunatSoapClient] Password length:', cfg.credentials?.password?.length || 0);
  assertSunatCredentials(cfg);
  if (!fileName) throw new Error('fileName es requerido');
  if (!zipBuffer) throw new Error('zipBuffer es requerido');

  console.log('[SunatSoapClient] Creating SOAP client...');
  let client = await getBillClient(cfg);
  console.log('[SunatSoapClient] SOAP client created. Preparing args...');

  // DEBUG: Log the raw SOAP request to verify WS-Security headers
  client.on('request', function (xmlRequest) {
    // Log first 2000 chars to see headers without flooding console
    console.log('[SunatSoapClient] SOAP Request (first 2000 chars):', xmlRequest.substring(0, 2000));
    // Check if WS-Security header is present
    if (xmlRequest.includes('wsse:Security')) {
      console.log('[SunatSoapClient] WS-Security header: PRESENT');
    } else {
      console.error('[SunatSoapClient] WS-Security header: MISSING!');
    }
  });

  const args = {
    fileName,
    contentFile: Buffer.isBuffer(zipBuffer) ? zipBuffer.toString('base64') : zipBuffer,
  };

  console.log('[SunatSoapClient] Sending bill async...');
  let res;
  let lastError;
  const maxRetries = 5; // Increased retries for SUNAT Beta rate limiting

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      res = pickResult(await client.sendBillAsync(args));
      console.log('[SunatSoapClient] Bill sent. Response received.');
      // Mark success time for Beta cooldown
      lastSuccessTime = Date.now();
      break; // Success, exit retry loop
    } catch (err) {
      lastError = err;

      // DEBUG: Log the full error structure to understand what we're getting
      console.error(`[SunatSoapClient] Error type:`, err.constructor?.name);
      console.error(`[SunatSoapClient] Error keys:`, Object.keys(err || {}));
      
      // Check if it's a true HTTP 401 (auth error) vs SUNAT business error
      // node-soap errors can have different structures:
      // - err.response (axios-style)
      // - err.root?.Envelope?.Body?.Fault (SOAP fault)
      // - err.body (raw response body)
      const httpStatus = err.response?.status || err.statusCode;
      const responseData = String(err.response?.data || err.body || err.root || '');
      const errorMessage = String(err.message || '');

      // True 401: HTTP 401 status AND NOT a SOAP response with faultcode
      const isTrueHttp401 = (httpStatus === 401 || errorMessage.includes('401')) && !responseData.includes('soap-env:Fault');
      // Also check for 401 in HTML response (nginx proxy auth)
      const isNginx401 = responseData.includes('401 Authorization Required') || errorMessage.includes('401 Authorization Required');

      // SUNAT business error: SOAP fault (like error 2800) - should NOT retry
      const isSunatBusinessError = responseData.includes('soap-env:Fault') ||
        errorMessage.includes('soap-env:Client');

      console.error(`[SunatSoapClient] Attempt ${attempt}/${maxRetries} failed:`, err.message || 'No message');
      console.error(`[SunatSoapClient] HTTP Status:`, httpStatus, `| is401:`, isTrueHttp401, `| isNginx401:`, isNginx401);
      if (err.response) console.error('[SunatSoapClient] SOAP/HTTP Response:', httpStatus, responseData.substring(0, 500));
      if (err.body) console.error('[SunatSoapClient] Response body:', String(err.body).substring(0, 500));

      // Only retry on true 401 auth errors, NOT on SUNAT business errors
      if ((isTrueHttp401 || isNginx401) && !isSunatBusinessError && attempt < maxRetries) {
        // Exponential backoff: 20s, 40s, 60s, 80s... SUNAT Beta needs long waits
        const delayMs = attempt * 20000;
        console.log(`[SunatSoapClient] HTTP 401 (rate limit), retry ${attempt + 1}/${maxRetries} in ${delayMs/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        // Create a fresh client for retry (getBillClient already applies setSecurity)
        client = await getBillClient(cfg);
        continue;
      }
      throw err;
    }
  }

  if (!res && lastError) {
    throw lastError;
  }

  return {
    raw: res,
    applicationResponseBase64: res?.applicationResponse,
  };
}

export async function sunatSendSummary({ fileName, zipBuffer, config } = {}) {
  const cfg = config || getSunatConfig();
  assertSunatCredentials(cfg);
  if (!fileName) throw new Error('fileName es requerido');
  if (!zipBuffer) throw new Error('zipBuffer es requerido');

  const client = await getBillClient(cfg);
  const args = {
    fileName,
    contentFile: Buffer.isBuffer(zipBuffer) ? zipBuffer.toString('base64') : zipBuffer,
  };

  const res = pickResult(await client.sendSummaryAsync(args));
  return { raw: res, ticket: res?.ticket };
}

export async function sunatSendPack({ fileName, zipBuffer, config } = {}) {
  const cfg = config || getSunatConfig();
  assertSunatCredentials(cfg);
  if (!fileName) throw new Error('fileName es requerido');
  if (!zipBuffer) throw new Error('zipBuffer es requerido');

  const client = await getBillClient(cfg);
  const args = {
    fileName,
    contentFile: Buffer.isBuffer(zipBuffer) ? zipBuffer.toString('base64') : zipBuffer,
  };

  const res = pickResult(await client.sendPackAsync(args));
  return { raw: res, ticket: res?.ticket };
}

export async function sunatGetStatus({ ticket, config } = {}) {
  const cfg = config || getSunatConfig();
  assertSunatCredentials(cfg);
  if (!ticket) throw new Error('ticket es requerido');

  const client = await getBillClient(cfg);
  const res = pickResult(await client.getStatusAsync({ ticket }));

  // Respuesta típica: status { statusCode, content (base64 zip), statusMessage }
  return {
    raw: res,
    statusCode: res?.status?.statusCode,
    statusMessage: res?.status?.statusMessage,
    contentBase64: res?.status?.content,
  };
}
