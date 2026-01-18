/**
 * Cliente OAuth2 para SUNAT API REST.
 * SUNAT requiere autenticación OAuth2 para el nuevo sistema de GRE (Guías de Remisión Electrónicas).
 * 
 * Endpoints OAuth2 oficiales SUNAT:
 * - https://api-seguridad.sunat.gob.pe/v1/clientessol/{client_id}/oauth2/token
 * 
 * NOTA: SUNAT usa el mismo endpoint OAuth2 para beta y producción.
 * La diferencia está en las credenciales (RUC de prueba vs real).
 * 
 * Documentación SUNAT:
 * https://cpe.sunat.gob.pe/guias-de-remision-electronica
 */
import https from 'https';

// Endpoint OAuth2 oficial de SUNAT (mismo para beta y producción)
const OAUTH2_ENDPOINT = 'https://api-seguridad.sunat.gob.pe/v1/clientessol';

// Cache de tokens para evitar solicitar tokens innecesariamente
const tokenCache = new Map();

/**
 * Obtiene el endpoint base de OAuth2
 * @param {'beta'|'prod'} env 
 */
function getOAuth2BaseUrl(env) {
  // SUNAT usa el mismo endpoint para beta y producción
  return OAUTH2_ENDPOINT;
}

/**
 * Realiza una petición HTTPS
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

    if (body) {
      reqOptions.headers['Content-Length'] = Buffer.byteLength(body, 'utf8');
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
 * Obtiene un token OAuth2 de SUNAT.
 * 
 * @param {Object} options
 * @param {'beta'|'prod'} options.env - Ambiente (beta o prod)
 * @param {string} options.clientId - Client ID (generalmente el RUC)
 * @param {string} [options.clientSecret] - Client Secret (opcional en beta, requerido en prod)
 * @param {string} options.username - Usuario SOL (formato: RUC + USUARIO_SOL, ej: 20610588981TORMENTA)
 * @param {string} options.password - Clave SOL
 * @param {string} [options.scope] - Scope opcional (ej: 'https://api-cpe.sunat.gob.pe')
 * @returns {Promise<{access_token: string, token_type: string, expires_in: number}>}
 */
export async function getOAuth2Token({ 
  env = 'beta', 
  clientId, 
  clientSecret = '', 
  username, 
  password,
  scope = 'https://api-cpe.sunat.gob.pe'
}) {
  if (!clientId || !username || !password) {
    throw new Error('Faltan credenciales OAuth2: clientId, username, password son requeridos.');
  }

  // En producción, client_secret es obligatorio
  if (env === 'prod' && !clientSecret) {
    throw new Error('En producción, SUNAT_CLIENT_SECRET es obligatorio. Registra tu aplicación en el portal SOL.');
  }

  // Verificar cache
  const cacheKey = `${env}:${clientId}:${username}`;
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + 60000) { // 1 minuto de margen
    return cached.token;
  }

  const baseUrl = getOAuth2BaseUrl(env);
  const tokenUrl = `${baseUrl}/${clientId}/oauth2/token`;

  // Preparar body como x-www-form-urlencoded
  const formParams = {
    grant_type: 'password',
    scope: scope,
    client_id: clientId,
    username: username,
    password: password,
  };

  // Solo incluir client_secret si está configurado
  if (clientSecret) {
    formParams.client_secret = clientSecret;
  }

  const formData = new URLSearchParams(formParams).toString();

  console.log(`[SUNAT OAuth2] Solicitando token a: ${tokenUrl}`);
  console.log(`[SUNAT OAuth2] Client ID: ${clientId}, Username: ${username}`);
  console.log(`[SUNAT OAuth2] Client Secret: ${clientSecret ? 'SÍ' : 'NO (modo beta)'}`);

  const response = await httpsRequest(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
  }, formData);

  console.log(`[SUNAT OAuth2] Response status: ${response.statusCode}`);
  console.log(`[SUNAT OAuth2] Response body: ${response.body.substring(0, 500)}`);

  if (response.statusCode !== 200) {
    let errorDetail = response.body;
    try {
      const errorJson = JSON.parse(response.body);
      errorDetail = errorJson.error_description || errorJson.error || response.body;
    } catch (e) {
      // No es JSON
    }
    throw new Error(`OAuth2 Error ${response.statusCode}: ${errorDetail}`);
  }

  let tokenData;
  try {
    tokenData = JSON.parse(response.body);
  } catch (e) {
    throw new Error(`OAuth2 respuesta inválida: ${response.body}`);
  }

  // Guardar en cache
  tokenCache.set(cacheKey, {
    token: tokenData,
    expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
  });

  console.log(`[SUNAT OAuth2] Token obtenido, expira en ${tokenData.expires_in}s`);

  return tokenData;
}

/**
 * Limpia el cache de tokens
 */
export function clearOAuth2Cache() {
  tokenCache.clear();
}

/**
 * Obtiene un token usando la configuración de credenciales SUNAT
 * Wrapper conveniente que usa las variables de entorno estándar.
 * 
 * Para OAuth2:
 * - SUNAT_CLIENT_ID (generalmente el RUC)
 * - SUNAT_CLIENT_SECRET (opcional en beta, requerido en producción)
 * 
 * @param {'beta'|'prod'} env 
 * @param {Object} credentials - Credenciales SUNAT { ruc, username, password }
 */
export async function getOAuth2TokenFromConfig(env, credentials) {
  const clientId = process.env.SUNAT_CLIENT_ID || credentials.ruc;
  const clientSecret = process.env.SUNAT_CLIENT_SECRET || '';

  return getOAuth2Token({
    env,
    clientId,
    clientSecret,
    username: credentials.username,
    password: credentials.password,
  });
}

export default {
  getOAuth2Token,
  getOAuth2TokenFromConfig,
  clearOAuth2Cache,
};
