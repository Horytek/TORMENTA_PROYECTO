/**
 * Test GRE Beta usando API REST con OAuth2
 * 
 * Este es el sistema vigente de SUNAT desde 2024 para Guías de Remisión Electrónicas.
 * Requiere configurar SUNAT_CLIENT_SECRET para la autenticación OAuth2.
 * 
 * Variables de entorno requeridas:
 * - SUNAT_ENV=beta
 * - SUNAT_RUC=20610588981
 * - SUNAT_SOL_USER=TORMENTA
 * - SUNAT_SOL_PASS=Uliseskun7890
 * - SUNAT_CLIENT_ID=20610588981 (opcional, default RUC)
 * - SUNAT_CLIENT_SECRET=xxxxx (REQUERIDO - obtener de portal SUNAT)
 * - SUNAT_CERT_P12_BASE64=... o SUNAT_CERT_P12_PATH=...
 * 
 * Uso:
 *   $env:DOTENV_CONFIG_PATH = ".env.sunat.local"; node scripts/sunat/test_gre_rest.js
 *   
 * Opciones:
 *   --skip-send    Generar XML sin enviar a SUNAT
 *   --payload FILE  Usar payload personalizado desde archivo JSON
 *   --out DIR       Directorio de salida
 */
import dotenv from 'dotenv';

// Cargar variables de entorno (soporta DOTENV_CONFIG_PATH)
const envPath = process.env.DOTENV_CONFIG_PATH || '.env';
dotenv.config({ path: envPath });

import path from 'node:path';

import { zipXml, unzipSingleFile } from '../../src/services/sunat/sunatZip.js';
import { getSunatGreConfig, assertSunatGreRestCredentials } from '../../src/services/sunat/sunatGreConfig.js';
import { sunatGreSendAndWait } from '../../src/services/sunat/sunatGreRestClient.js';
import { getSigningMaterialFromEnv } from '../../src/services/sunat/sunatCertificate.js';
import { signUblXml } from '../../src/services/sunat/sunatXmlSign.js';
import {
  buildDespatchXmlFromApiPeruPayload,
  buildSunatGreFileNameFromPayload,
} from '../../src/services/sunat/ublDespatchBuilder.js';

import {
  nowStamp,
  parseArgs,
  peruDateIso,
  readJson,
  writeBuffer,
  writeJson,
  writeText,
} from './utils.js';

function buildDefaultGrePayload() {
  const ruc = (process.env.SUNAT_RUC || '').trim() || '20123456789';
  const fechaEmision = peruDateIso();

  return {
    ublVersion: '2.1',
    customizationID: '1.0', // IMPORTANTE: GRE usa 1.0, no 2.0

    tipoDoc: '09', // 09 = Guía de Remisión
    serie: 'T001',
    correlativo: 1,
    fechaEmision,

    company: {
      ruc,
      razonSocial: 'EMPRESA DEMO S.A.C.',
      nombreComercial: 'EMPRESA DEMO',
      address: {
        ubigueo: '150101',
        direccion: 'JR DEMO 123',
        provincia: 'LIMA',
        departamento: 'LIMA',
        distrito: 'LIMA',
      },
    },

    destinatario: {
      numDoc: '20123456789',
      rznSocial: 'CLIENTE DEMO S.A.C.',
    },

    observacion: 'PRUEBA GRE API REST',
    motivoTraslado: '01', // 01 = Venta
    modoTransporte: '01', // 01 = Transporte público

    envio: {
      fecTraslado: fechaEmision,
      undPesoTotal: 'KGM',
      pesoTotal: 10,
      llegada: {
        ubigueo: '150101',
        direccion: 'AV DESTINO 456',
      },
      partida: {
        ubigueo: '150101',
        direccion: 'JR ORIGEN 123',
      },
      transportista: {
        numDoc: '20123456789',
        rznSocial: 'TRANSPORTES DEMO S.A.C.',
        placa: 'AAA-123',
      },
    },

    details: [
      {
        cantidad: 1,
        unidad: 'NIU',
        descripcion: 'PRODUCTO DEMO',
        codigo: 'P001',
      },
    ],
  };
}

async function main() {
  console.log('=== Test GRE Beta (API REST + OAuth2) ===\n');
  
  const args = parseArgs(process.argv.slice(2));
  const payload = args.payload ? await readJson(args.payload) : buildDefaultGrePayload();

  const cfg = getSunatGreConfig();
  console.log('Entorno:', cfg.env);
  console.log('API URL:', cfg.greApiUrl);
  console.log('OAuth2 URL:', cfg.oauth2BaseUrl);
  console.log('Username:', cfg.credentials.username);
  console.log('Client ID:', cfg.oauth2.clientId);
  console.log('Client Secret configurado:', cfg.oauth2.hasClientSecret ? 'SÍ' : 'NO');

  // Verificar credenciales OAuth2 (requeridas tanto en beta como en producción)
  if (!cfg.oauth2.hasClientSecret) {
    console.log('\n' + '='.repeat(70));
    console.log('⚠️  FALTA SUNAT_CLIENT_SECRET');
    console.log('='.repeat(70));
    console.log(`
SUNAT migró las Guías de Remisión Electrónicas (GRE) a un nuevo sistema
API REST con autenticación OAuth2. El antiguo sistema SOAP ya no acepta
nuevas guías (error 1085).

Para usar la API REST de SUNAT necesitas:

╔══════════════════════════════════════════════════════════════════════╗
║  PASO 1: Ingresar al Portal SOL de SUNAT                             ║
║          https://e-menu.sunat.gob.pe/cl-ti-itmenu/MenuInternet.htm   ║
╠══════════════════════════════════════════════════════════════════════╣
║  PASO 2: Navegar a:                                                  ║
║          Empresas → Comprobantes de Pago →                           ║
║          SEE - SOL → Opciones del Sistema →                          ║
║          "Generar Credenciales API"                                  ║
╠══════════════════════════════════════════════════════════════════════╣
║  PASO 3: Registrar tu aplicación para GRE                            ║
║          - Obtendrás: Client ID (tu RUC) + Client Secret             ║
╠══════════════════════════════════════════════════════════════════════╣
║  PASO 4: Configurar en tu .env.sunat.local:                          ║
║          SUNAT_CLIENT_ID=${cfg.oauth2.clientId}
║          SUNAT_CLIENT_SECRET=tu_client_secret_aqui                   ║
╚══════════════════════════════════════════════════════════════════════╝

IMPORTANTE: 
- El Client Secret es diferente a la clave SOL
- Se genera UNA VEZ por empresa en el portal SUNAT
- El mismo Client Secret sirve para beta y producción
`);
    console.log('='.repeat(70));
    process.exit(1);
  }

  const fileNameBase = buildSunatGreFileNameFromPayload(payload);
  const outDir = path.resolve(args.out || `tmp/sunat-tests/gre-rest/${fileNameBase}-${nowStamp()}`);

  console.log('\nGenerando XML...');
  const xmlUnsigned = buildDespatchXmlFromApiPeruPayload(payload);
  
  console.log('Firmando XML...');
  const { privateKeyPem, certificatePem } = await getSigningMaterialFromEnv({ allowDevSelfSigned: true });
  const xmlSigned = signUblXml({
    xml: xmlUnsigned,
    privateKeyPem,
    certificatePem,
    referenceXPath: "//*[local-name()='DespatchAdvice']",
  });

  console.log('Creando ZIP...');
  const zipBuffer = await zipXml({ fileName: fileNameBase, xml: xmlSigned });

  // Guardar archivos generados
  await writeJson(path.join(outDir, 'payload.json'), payload);
  await writeText(path.join(outDir, 'xml-unsigned.xml'), xmlUnsigned);
  await writeText(path.join(outDir, 'xml-signed.xml'), xmlSigned);
  await writeBuffer(path.join(outDir, `${fileNameBase}.zip`), zipBuffer);
  
  console.log('Archivo:', fileNameBase);
  console.log('Salida:', outDir);

  if (args.skipSend) {
    await writeJson(path.join(outDir, 'sunat-result.json'), { ok: true, skipped: true, reason: '--skip-send' });
    console.log('\n✅ Modo skip-send: se generó XML+ZIP pero no se envió a SUNAT.');
    return;
  }

  console.log('\n' + '-'.repeat(50));
  console.log('Enviando a SUNAT API REST...');
  console.log('-'.repeat(50));

  try {
    const result = await sunatGreSendAndWait({
      fileName: fileNameBase,
      zipBuffer,
      maxRetries: 15,
      retryDelay: 2000,
    });

    await writeJson(path.join(outDir, 'sunat-result.json'), result);

    console.log('\n' + '='.repeat(50));
    console.log('=== RESULTADO ===');
    console.log('='.repeat(50));
    console.log('Ticket:', result.ticket);
    
    if (result.cdr) {
      console.log('CDR:', {
        responseCode: result.cdr.responseCode,
        description: result.cdr.description,
        notes: result.cdr.notes,
      });

      if (result.cdr.responseCode === '0') {
        console.log('\n✅ GRE ACEPTADA por SUNAT');
      } else {
        console.log('\n❌ GRE RECHAZADA:', result.cdr.description);
      }
    } else {
      console.log('Status:', result.status?.codRespuesta);
      if (result.status?.error) {
        console.log('Error:', result.status.error);
      }
    }
    
    console.log('\nSalida completa:', outDir);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await writeJson(path.join(outDir, 'sunat-result.json'), { 
      ok: false, 
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
