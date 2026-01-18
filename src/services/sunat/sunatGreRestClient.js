/**
 * Cliente REST para SUNAT GRE (Guías de Remisión Electrónicas).
 * 
 * Este cliente usa la API REST de SUNAT con autenticación OAuth2.
 * Es el sistema vigente desde 2024 para GRE.
 * 
 * Endpoints oficiales SUNAT (mismos para beta y producción):
 * - API: https://api-cpe.sunat.gob.pe/v1/contribuyente/gem/comprobantes
 * 
 * Documentación: https://cpe.sunat.gob.pe/guias-de-remision-electronica
 */
import https from 'https';
import { getOAuth2TokenFromConfig } from './sunatOAuth2Client.js';
import { getSunatGreConfig, assertSunatGreCredentials } from './sunatGreConfig.js';

// Endpoint API REST oficial de SUNAT para GRE (mismo para beta y producción)
const GRE_API_ENDPOINT = 'https://api-cpe.sunat.gob.pe/v1/contribuyente/gem/comprobantes';

/**
 * Obtiene el endpoint base de API
 * @param {'beta'|'prod'} env 
 */
function getApiBaseUrl(env) {
  // SUNAT usa el mismo endpoint para beta y producción
  return GRE_API_ENDPOINT;
}

/**
 * Realiza una petición HTTPS con soporte multipart
 */
function httpsRequest(url, options, body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'POST',
      headers: {
        ...options.headers,
        'Connection': 'close',
      },
    };

    if (body && !options.headers['Content-Length']) {
      reqOptions.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = https.request(reqOptions, (res) => {
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
    
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

/**
 * Crea un body multipart/form-data para enviar el archivo ZIP
 * @param {string} fileName - Nombre del archivo (ej: 20610588981-09-T001-00000001.zip)
 * @param {Buffer} zipBuffer - Buffer del archivo ZIP
 * @returns {{body: Buffer, boundary: string}}
 */
function createMultipartBody(fileName, zipBuffer) {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  
  const parts = [];
  
  // Parte del archivo
  parts.push(
    `--${boundary}\r\n`,
    `Content-Disposition: form-data; name="archivo"; filename="${fileName}"\r\n`,
    `Content-Type: application/zip\r\n\r\n`
  );
  
  const header = Buffer.from(parts.join(''), 'utf8');
  const footer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
  
  const body = Buffer.concat([header, zipBuffer, footer]);
  
  return { body, boundary };
}

/**
 * Envía una GRE (Guía de Remisión Electrónica) a SUNAT usando API REST.
 * 
 * @param {Object} options
 * @param {string} options.fileName - Nombre del archivo sin extensión (ej: 20610588981-09-T001-00000001)
 * @param {Buffer} options.zipBuffer - Buffer del archivo ZIP firmado
 * @returns {Promise<{numTicket: string, fecRecepcion: string}>}
 */
export async function sunatGreSendBillRest({ fileName, zipBuffer }) {
  const cfg = getSunatGreConfig();
  assertSunatGreCredentials(cfg);

  // Obtener token OAuth2
  console.log('[SUNAT GRE REST] Obteniendo token OAuth2...');
  const tokenData = await getOAuth2TokenFromConfig(cfg.env, cfg.credentials);
  const accessToken = tokenData.access_token;

  // Preparar URL
  const baseUrl = getApiBaseUrl(cfg.env);
  const submitUrl = `${baseUrl}/${fileName}`;

  console.log(`[SUNAT GRE REST] Enviando a: ${submitUrl}`);
  console.log(`[SUNAT GRE REST] Archivo: ${fileName}.zip (${zipBuffer.length} bytes)`);

  // Crear body multipart
  const { body, boundary } = createMultipartBody(`${fileName}.zip`, zipBuffer);

  // Enviar petición
  const response = await httpsRequest(submitUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Accept': 'application/json',
    },
  }, body);

  console.log(`[SUNAT GRE REST] Response status: ${response.statusCode}`);
  console.log(`[SUNAT GRE REST] Response body: ${response.body.substring(0, 500)}`);

  if (response.statusCode === 200 || response.statusCode === 201) {
    try {
      const result = JSON.parse(response.body);
      return {
        numTicket: result.numTicket,
        fecRecepcion: result.fecRecepcion,
        raw: result,
      };
    } catch (e) {
      throw new Error(`Respuesta inválida: ${response.body}`);
    }
  }

  // Manejar errores
  let errorMsg = `HTTP ${response.statusCode}: ${response.statusMessage}`;
  try {
    const errorData = JSON.parse(response.body);
    errorMsg = errorData.msg || errorData.message || errorData.error || JSON.stringify(errorData);
  } catch (e) {
    errorMsg = response.body || errorMsg;
  }

  throw new Error(`[SUNAT GRE] Error al enviar: ${errorMsg}`);
}

/**
 * Consulta el estado de una GRE enviada por su número de ticket.
 * 
 * @param {Object} options
 * @param {string} options.numTicket - Número de ticket devuelto por sendBill
 * @returns {Promise<{codRespuesta: string, arcCdr: string|null, codRespuesta: string, error?: Object}>}
 */
export async function sunatGreGetStatusRest({ numTicket }) {
  const cfg = getSunatGreConfig();
  assertSunatGreCredentials(cfg);

  // Obtener token OAuth2
  const tokenData = await getOAuth2TokenFromConfig(cfg.env, cfg.credentials);
  const accessToken = tokenData.access_token;

  // Preparar URL
  const baseUrl = getApiBaseUrl(cfg.env);
  const statusUrl = `${baseUrl}/envios/${numTicket}`;

  console.log(`[SUNAT GRE REST] Consultando estado: ${statusUrl}`);

  const response = await httpsRequest(statusUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  console.log(`[SUNAT GRE REST] Status response: ${response.statusCode}`);

  if (response.statusCode !== 200) {
    let errorMsg = `HTTP ${response.statusCode}`;
    try {
      const errorData = JSON.parse(response.body);
      errorMsg = errorData.msg || errorData.message || JSON.stringify(errorData);
    } catch (e) {
      errorMsg = response.body || errorMsg;
    }
    throw new Error(`[SUNAT GRE] Error al consultar estado: ${errorMsg}`);
  }

  try {
    const result = JSON.parse(response.body);
    return {
      codRespuesta: result.codRespuesta,
      arcCdr: result.arcCdr || null, // CDR en base64
      indCdrGenerado: result.indCdrGenerado,
      error: result.error || null,
      raw: result,
    };
  } catch (e) {
    throw new Error(`Respuesta inválida: ${response.body}`);
  }
}

/**
 * Parsea el CDR (Constancia de Recepción) desde base64
 * @param {string} arcCdrBase64 - CDR en base64
 * @returns {Promise<{responseCode: string, description: string, notes: string[]}>}
 */
export async function parseCdrFromBase64(arcCdrBase64) {
  if (!arcCdrBase64) {
    return null;
  }

  try {
    // El CDR viene como ZIP en base64, hay que descomprimirlo
    const AdmZip = (await import('adm-zip')).default;
    const zipBuffer = Buffer.from(arcCdrBase64, 'base64');
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();

    // Buscar el XML del CDR
    const cdrEntry = entries.find(e => e.entryName.toLowerCase().endsWith('.xml'));
    if (!cdrEntry) {
      return null;
    }

    const cdrXml = cdrEntry.getData().toString('utf8');

    // Parsear respuesta del CDR
    const responseCodeMatch = cdrXml.match(/<cbc:ResponseCode[^>]*>(\d+)<\/cbc:ResponseCode>/);
    const descriptionMatch = cdrXml.match(/<cbc:Description[^>]*>([^<]+)<\/cbc:Description>/);

    const notes = [];
    const notesRegex = /<cbc:Note[^>]*>([^<]+)<\/cbc:Note>/g;
    let noteMatch;
    while ((noteMatch = notesRegex.exec(cdrXml)) !== null) {
      notes.push(noteMatch[1]);
    }

    return {
      responseCode: responseCodeMatch ? responseCodeMatch[1] : null,
      description: descriptionMatch ? descriptionMatch[1] : null,
      notes,
    };
  } catch (error) {
    console.error('[SUNAT GRE REST] Error parsing CDR:', error.message);
    return null;
  }
}

/**
 * Envía una GRE y espera el resultado (polling del ticket).
 * 
 * @param {Object} options
 * @param {string} options.fileName - Nombre del archivo sin extensión
 * @param {Buffer} options.zipBuffer - Buffer del archivo ZIP firmado
 * @param {number} [options.maxRetries=10] - Número máximo de intentos de polling
 * @param {number} [options.retryDelay=2000] - Delay entre intentos (ms)
 * @returns {Promise<{ticket: string, cdr: Object|null, status: Object}>}
 */
export async function sunatGreSendAndWait({ fileName, zipBuffer, maxRetries = 10, retryDelay = 2000 }) {
  // Enviar documento
  const sendResult = await sunatGreSendBillRest({ fileName, zipBuffer });
  
  console.log(`[SUNAT GRE REST] Ticket recibido: ${sendResult.numTicket}`);

  // Polling hasta obtener respuesta
  for (let i = 0; i < maxRetries; i++) {
    console.log(`[SUNAT GRE REST] Consultando estado (intento ${i + 1}/${maxRetries})...`);
    
    await new Promise(r => setTimeout(r, retryDelay));
    
    try {
      const status = await sunatGreGetStatusRest({ numTicket: sendResult.numTicket });
      
      // codRespuesta: "0" = Proceso correcto, "98" = En proceso, "99" = Error
      if (status.codRespuesta === '0' || status.codRespuesta === '99') {
        const cdr = status.arcCdr ? await parseCdrFromBase64(status.arcCdr) : null;
        return {
          ticket: sendResult.numTicket,
          cdr,
          status,
        };
      }
      
      console.log(`[SUNAT GRE REST] Estado: ${status.codRespuesta} (en proceso)`);
    } catch (e) {
      console.warn(`[SUNAT GRE REST] Error al consultar: ${e.message}`);
    }
  }

  throw new Error(`Timeout esperando respuesta del ticket ${sendResult.numTicket}`);
}

export default {
  sunatGreSendBillRest,
  sunatGreGetStatusRest,
  sunatGreSendAndWait,
  parseCdrFromBase64,
};
