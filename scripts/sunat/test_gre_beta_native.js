/**
 * Test GRE Beta usando cliente HTTPS nativo
 * Este test es idéntico a test_gre_beta.js pero usa el cliente nativo
 * que evita los problemas de 401 intermitentes de node-soap.
 */
import dotenv from 'dotenv';

// Cargar variables de entorno (soporta DOTENV_CONFIG_PATH)
const envPath = process.env.DOTENV_CONFIG_PATH || '.env';
dotenv.config({ path: envPath });

import path from 'node:path';

import { zipXml, unzipSingleFile } from '../../src/services/sunat/sunatZip.js';
import { getSunatGreConfig } from '../../src/services/sunat/sunatGreConfig.js';
import { sunatGreSendBillNative } from '../../src/services/sunat/sunatGreNativeClient.js';
import { getSigningMaterialFromEnv } from '../../src/services/sunat/sunatCertificate.js';
import { signUblXml } from '../../src/services/sunat/sunatXmlSign.js';
import {
  buildDespatchXmlFromApiPeruPayload,
  buildSunatGreFileNameFromPayload,
} from '../../src/services/sunat/ublDespatchBuilder.js';

import {
  nowStamp,
  parseArgs,
  parseCdrSummary,
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
    customizationID: '1.0',

    tipoDoc: '09',
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

    observacion: 'PRUEBA GRE BETA NATIVE',
    motivoTraslado: '01',
    modoTransporte: '01',

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
  console.log('=== Test GRE Beta (Cliente HTTPS Nativo) ===\n');
  
  const args = parseArgs(process.argv.slice(2));
  const payload = args.payload ? await readJson(args.payload) : buildDefaultGrePayload();

  const cfg = getSunatGreConfig();
  console.log('Entorno:', cfg.env);
  console.log('Username:', cfg.credentials.username);

  const fileNameBase = buildSunatGreFileNameFromPayload(payload);
  const outDir = path.resolve(args.out || `tmp/sunat-tests/gre-native/${fileNameBase}-${nowStamp()}`);

  const xmlUnsigned = buildDespatchXmlFromApiPeruPayload(payload);
  const { privateKeyPem, certificatePem } = await getSigningMaterialFromEnv({ allowDevSelfSigned: true });
  const xmlSigned = signUblXml({
    xml: xmlUnsigned,
    privateKeyPem,
    certificatePem,
    referenceXPath: "//*[local-name()='DespatchAdvice']",
  });

  const zipBuffer = await zipXml({ fileName: fileNameBase, xml: xmlSigned });

  await writeJson(path.join(outDir, 'payload.json'), payload);
  await writeText(path.join(outDir, 'xml-unsigned.xml'), xmlUnsigned);
  await writeText(path.join(outDir, 'xml-signed.xml'), xmlSigned);
  await writeBuffer(path.join(outDir, `${fileNameBase}.zip`), zipBuffer);
  
  if (args.skipSend) {
    await writeJson(path.join(outDir, 'sunat-result.json'), { ok: true, skipped: true, reason: '--no-send' });
    console.log('Modo no-send: se generó XML+ZIP pero no se envió a SUNAT.');
    console.log('Salida:', outDir);
    return;
  }

  console.log('\nEnviando a SUNAT usando cliente HTTPS nativo...');
  const result = await sunatGreSendBillNative({ fileName: `${fileNameBase}.zip`, zipBuffer });
  await writeJson(path.join(outDir, 'sunat-result.json'), result);

  console.log('\n=== RESULTADO ===');
  console.log('Success:', result.success);
  console.log('HTTP Status:', result.raw?.statusCode, result.raw?.statusMessage);
  
  if (result.error) {
    console.log('Error SUNAT:', result.error);
  }
  
  if (result.ticket) {
    console.log('Ticket (async):', result.ticket);
    console.log('\n✅ GRE enviada. Consultar con getStatus para obtener CDR.');
    console.log('Salida:', outDir);
    return;
  }

  const cdrZipBase64 = result.applicationResponseBase64 || null;
  if (!cdrZipBase64) {
    console.log('No llegó CDR (applicationResponseBase64).');
    console.log('Raw body:', result.raw?.body?.substring(0, 500));
    console.log('Salida:', outDir);
    return;
  }

  const cdrZipBuffer = Buffer.from(cdrZipBase64, 'base64');
  await writeBuffer(path.join(outDir, 'cdr.zip'), cdrZipBuffer);

  const { fileName: cdrFileName, content } = await unzipSingleFile({ zipBuffer: cdrZipBuffer });
  const cdrXml = content.toString('utf8');
  await writeText(path.join(outDir, cdrFileName || 'cdr.xml'), cdrXml);

  const summary = parseCdrSummary(cdrXml);
  await writeJson(path.join(outDir, 'cdr-summary.json'), summary);

  console.log('\n✅ GRE procesada correctamente');
  console.log('CDR:', summary);
  console.log('Salida:', outDir);
}

main().catch((err) => {
  console.error('\nError en test GRE Native:', err?.message || err);
  process.exitCode = 1;
});
