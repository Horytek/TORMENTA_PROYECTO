import dotenv from 'dotenv';

// Cargar variables de entorno (soporta DOTENV_CONFIG_PATH)
const envPath = process.env.DOTENV_CONFIG_PATH || '.env';
dotenv.config({ path: envPath });

import path from 'node:path';

import { zipXml, unzipSingleFile } from '../../src/services/sunat/sunatZip.js';
import { sunatSendBill } from '../../src/services/sunat/sunatSoapClient.js';
import { getSunatConfig } from '../../src/services/sunat/sunatConfig.js';
import { getSigningMaterialFromEnv } from '../../src/services/sunat/sunatCertificate.js';
import { signUblXml } from '../../src/services/sunat/sunatXmlSign.js';
import {
  buildInvoiceXmlFromApiPeruPayload,
  buildSunatFileNameFromPayload,
} from '../../src/services/sunat/ublInvoiceBuilder.js';

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

function buildDefaultInvoicePayload() {
  const ruc = (process.env.SUNAT_RUC || '').trim() || '20123456789';

  const fechaEmision = peruDateIso();
  const correlativo = 1;

  const gravada = 100.0;
  const igv = 18.0;
  const total = 118.0;

  return {
    ublVersion: '2.1',
    customizationID: '2.0',

    tipoDoc: '01',
    serie: 'F001',
    correlativo,
    fechaEmision,
    tipoMoneda: 'PEN',

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

    client: {
      tipoDoc: '6',
      numDoc: '20123456789',
      rznSocial: 'CLIENTE DEMO S.A.C.',
    },

    mtoOperGravadas: gravada,
    mtoIGV: igv,
    mtoImpVenta: total,

    legends: [{ code: '1000', value: 'SON CIENTO DIECIOCHO CON 00/100 SOLES' }],

    details: [
      {
        cantidad: 1,
        unidad: 'NIU',
        descripcion: 'PRODUCTO DEMO',
        codProducto: 'P001',

        mtoValorUnitario: gravada,
        mtoPrecioUnitario: total,
        mtoValorVenta: gravada,

        mtoBaseIgv: gravada,
        igv,
        tipAfeIgv: 10,
      },
    ],
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const payload = args.payload ? await readJson(args.payload) : buildDefaultInvoicePayload();

  const cfg = getSunatConfig();

  const fileNameBase = buildSunatFileNameFromPayload(payload);
  const outDir = path.resolve(args.out || `tmp/sunat-tests/cpe/${fileNameBase}-${nowStamp()}`);

  const xmlUnsigned = buildInvoiceXmlFromApiPeruPayload(payload);
  const { privateKeyPem, certificatePem } = await getSigningMaterialFromEnv({ allowDevSelfSigned: true });
  const xmlSigned = signUblXml({ xml: xmlUnsigned, privateKeyPem, certificatePem });

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

  const result = await sunatSendBill({ fileName: `${fileNameBase}.zip`, zipBuffer });
  await writeJson(path.join(outDir, 'sunat-result.json'), result);

  const cdrZipBase64 = result.applicationResponseBase64 || null;
  if (!cdrZipBase64) {
    // Algunas respuestas de error pueden venir solo como fault/exception.
    console.log('No llegó CDR (applicationResponseBase64).');
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

  console.log('SUNAT ENV:', cfg.env);
  console.log('WSDL:', cfg.billWsdlUrl);
  console.log('Archivo:', fileNameBase);
  console.log('CDR:', summary);
  console.log('Salida:', outDir);
}

main().catch((err) => {
  console.error('Error en test CPE:', err?.message || err);
  process.exitCode = 1;
});
