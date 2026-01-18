import { getConnection } from '../../database/database.js';
import { decrypt } from '../../utils/cryptoUtil.js';

const SUNAT_ENV_VALUES = new Set(['beta', 'prod']);

// Tipos de clave SUNAT en la tabla `clave`
const SUNAT_CLAVE_TIPOS = {
  SOL_USER: 'sunat_sol_user',
  SOL_PASS: 'sunat_sol_pass',
  CERT_P12: 'sunat_cert_p12',
  CERT_PASS: 'sunat_cert_pass',
  ENV: 'sunat_env',
  CLIENT_ID: 'sunat_client_id',
  CLIENT_SECRET: 'sunat_client_secret',
};

/**
 * Obtener WSDL URL según entorno
 */
function getWsdlUrl(env) {
  return env === 'prod'
    ? 'https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService?wsdl'
    : 'https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService?wsdl';
}

/**
 * Leer claves SUNAT de la BD para una empresa específica
 * Nota: Buscamos solo por id_empresa ya que las credenciales SUNAT son por empresa,
 * no por tenant. Una empresa tiene un único RUC y un único set de credenciales SUNAT.
 */
async function getClavesSunatFromDB(id_empresa, id_tenant) {
  let connection;
  try {
    connection = await getConnection();

    // Buscar solo por id_empresa (las credenciales SUNAT son únicas por empresa/RUC)
    console.log(`[SunatConfig] Fetching keys for id_empresa=${id_empresa}`);
    const [rows] = await connection.query(
      `SELECT tipo, valor FROM clave 
       WHERE id_empresa = ? 
       AND tipo LIKE 'sunat_%'`,
      [id_empresa]
    );
    console.log(`[SunatConfig] Found ${rows.length} keys for id_empresa=${id_empresa}`);

    const claves = {};
    for (const row of rows) {
      // Desencriptar cada valor
      try {
        claves[row.tipo] = decrypt(row.valor);
      } catch (err) {
        console.error(`[SunatConfig] Error decrypting ${row.tipo}:`, err.message);
        claves[row.tipo] = null;
      }
    }

    return claves;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Obtener configuración SUNAT desde la BD para una empresa
 * @param {number} id_empresa - ID de la empresa
 * @param {number} id_tenant - ID del tenant
 * @param {string} ruc - RUC de la empresa (se obtiene de la tabla empresa)
 * @returns {Object} Configuración SUNAT
 */
export async function getSunatConfigByEmpresa(id_empresa, id_tenant, ruc) {
  const claves = await getClavesSunatFromDB(id_empresa, id_tenant);

  const solUser = claves[SUNAT_CLAVE_TIPOS.SOL_USER] || '';
  const solPass = claves[SUNAT_CLAVE_TIPOS.SOL_PASS] || '';
  const certP12Base64 = claves[SUNAT_CLAVE_TIPOS.CERT_P12] || '';
  const certPass = claves[SUNAT_CLAVE_TIPOS.CERT_PASS] || '';
  // Use environment from DB, default to 'beta' for testing
  const env = claves[SUNAT_CLAVE_TIPOS.ENV] || 'beta';
  const clientId = claves[SUNAT_CLAVE_TIPOS.CLIENT_ID] || '';
  const clientSecret = claves[SUNAT_CLAVE_TIPOS.CLIENT_SECRET] || '';

  // Validar entorno
  const validEnv = SUNAT_ENV_VALUES.has(env) ? env : 'beta';
  console.log(`[SunatConfig] Environment resolved: ${validEnv} (Raw from DB: ${claves[SUNAT_CLAVE_TIPOS.ENV] || 'undefined'})`);

  // Usuario SUNAT: RUC + usuario SOL
  const username = ruc && solUser ? `${ruc}${solUser}` : solUser;

  return {
    env: validEnv,
    billWsdlUrl: getWsdlUrl(validEnv),
    credentials: {
      ruc: ruc || '',
      username,
      password: solPass,
    },
    certificate: {
      p12Base64: certP12Base64,
      p12Buffer: certP12Base64 ? Buffer.from(certP12Base64, 'base64') : null,
      password: certPass,
    },
    gre: {
      clientId,
      clientSecret,
    },
  };
}

/**
 * Verificar si hay credenciales SUNAT configuradas para la empresa
 */
export async function hasSunatConfig(id_empresa, id_tenant) {
  const claves = await getClavesSunatFromDB(id_empresa, id_tenant);
  return !!(claves[SUNAT_CLAVE_TIPOS.SOL_USER] && claves[SUNAT_CLAVE_TIPOS.SOL_PASS]);
}

/**
 * Obtener configuración SUNAT desde variables de entorno (fallback/desarrollo)
 */
export function getSunatConfig() {
  const env = (process.env.SUNAT_ENV || 'beta').toLowerCase();
  if (!SUNAT_ENV_VALUES.has(env)) {
    throw new Error(`SUNAT_ENV inválido: ${process.env.SUNAT_ENV}. Usa beta|prod.`);
  }

  const billWsdlUrl = process.env.SUNAT_BILL_WSDL_URL || getWsdlUrl(env);
  const ruc = (process.env.SUNAT_RUC || '').trim();
  const solUsernameExplicit = (process.env.SUNAT_SOL_USERNAME || '').trim();
  const solUser = (process.env.SUNAT_SOL_USER || '').trim();
  const username = solUsernameExplicit || (ruc && solUser ? `${ruc}${solUser}` : solUser);
  const password = (process.env.SUNAT_SOL_PASS || process.env.SUNAT_SOL_PASSWORD || '').trim();

  return {
    env,
    billWsdlUrl,
    credentials: {
      ruc,
      username,
      password,
    },
    certificate: {
      p12Base64: process.env.SUNAT_CERT_P12_BASE64 || '',
      p12Buffer: null,
      password: process.env.SUNAT_CERT_P12_PASS || '',
    },
    gre: {
      clientId: process.env.SUNAT_CLIENT_ID || '',
      clientSecret: process.env.SUNAT_CLIENT_SECRET || '',
    },
    source: 'ENV',
  };
}

export function assertSunatCredentials(cfg) {
  const { username, password } = cfg.credentials || {};
  if (!username || !password) {
    throw new Error(
      `Faltan credenciales SUNAT (assert). Source=${cfg.source || 'UNKNOWN'} User=${username ? 'OK' : 'MISSING'} Pass=${password ? 'OK' : 'MISSING'}. Configure las credenciales SOL en la configuración de la empresa.`
    );
  }
}

export { SUNAT_CLAVE_TIPOS };
