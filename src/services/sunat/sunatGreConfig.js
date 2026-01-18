import { getSunatConfig, assertSunatCredentials } from './sunatConfig.js';

/**
 * Configuración para GRE (Guías de Remisión Electrónicas).
 * 
 * Desde 2024, SUNAT usa API REST con OAuth2 para GRE.
 * El sistema SOAP antiguo ya no acepta nuevas guías (error 1085).
 * 
 * Variables de entorno adicionales para API REST:
 * - SUNAT_CLIENT_ID: Client ID para OAuth2 (generalmente el RUC)
 * - SUNAT_CLIENT_SECRET: Client Secret (obtenido al registrar app en Portal SOL)
 * 
 * NOTA: SUNAT usa los mismos endpoints para beta y producción.
 * La diferencia está en las credenciales (RUC de prueba vs real).
 * 
 * Endpoints oficiales:
 * - API GRE: https://api-cpe.sunat.gob.pe/v1/contribuyente/gem/comprobantes
 * - OAuth2: https://api-seguridad.sunat.gob.pe/v1/clientessol/{clientId}/oauth2/token
 */

// Endpoints SOAP (solo para consultas de guías antiguas)
const GRE_WSDL_BETA = 'https://e-beta.sunat.gob.pe/ol-ti-itemision-guia-gem-beta/billService?wsdl';
const GRE_WSDL_PROD = 'https://e-guiaremision.sunat.gob.pe/ol-ti-itemision-guia-gem/billService?wsdl';

// Endpoint API REST (sistema actual para nuevas guías) - mismo para beta y prod
const GRE_API = 'https://api-cpe.sunat.gob.pe/v1/contribuyente/gem/comprobantes';

// Endpoint OAuth2 - mismo para beta y prod
const OAUTH2_URL = 'https://api-seguridad.sunat.gob.pe/v1/clientessol';

export function getSunatGreConfig() {
  const base = getSunatConfig();

  // SOAP (legacy, solo para guías antiguas)
  const greWsdlUrl = process.env.SUNAT_GRE_WSDL_URL ||
    (base.env === 'prod' ? GRE_WSDL_PROD : GRE_WSDL_BETA);

  // API REST (sistema actual) - mismo endpoint para beta/prod
  const greApiUrl = process.env.SUNAT_GRE_API_URL || GRE_API;

  // OAuth2 - mismo endpoint para beta/prod
  const oauth2BaseUrl = process.env.SUNAT_OAUTH2_URL || OAUTH2_URL;

  // Credenciales OAuth2
  const clientId = process.env.SUNAT_CLIENT_ID || base.credentials.ruc;
  const clientSecret = process.env.SUNAT_CLIENT_SECRET || '';

  return {
    env: base.env,
    greWsdlUrl, // SOAP legacy
    greApiUrl,  // REST API
    oauth2BaseUrl,
    credentials: base.credentials,
    oauth2: {
      clientId,
      clientSecret,
      hasClientSecret: !!clientSecret,
    },
  };
}

export function assertSunatGreCredentials(cfg) {
  assertSunatCredentials(cfg);
}

/**
 * Valida que estén configuradas las credenciales para API REST (OAuth2)
 */
export function assertSunatGreRestCredentials(cfg) {
  assertSunatCredentials(cfg);
  
  if (!cfg.oauth2?.clientSecret) {
    throw new Error(
      'Falta SUNAT_CLIENT_SECRET para API REST GRE.\n' +
      'Debes registrar tu aplicación en SUNAT y obtener el Client Secret.\n' +
      'Ver: https://cpe.sunat.gob.pe/guias-de-remision-electronica\n\n' +
      'Pasos:\n' +
      '1. Ingresa a tu portal SOL en SUNAT\n' +
      '2. Busca "API SUNAT" o "Servicios Web"\n' +
      '3. Registra una nueva aplicación\n' +
      '4. Obtén el Client ID y Client Secret\n' +
      '5. Configura: SUNAT_CLIENT_ID y SUNAT_CLIENT_SECRET en tu .env'
    );
  }
}
