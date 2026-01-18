import 'dotenv/config';

import path from 'node:path';

import { zipXml, unzipSingleFile } from '../../src/services/sunat/sunatZip.js';
import { getSunatGreConfig } from '../../src/services/sunat/sunatGreConfig.js';
import { sunatGreSendBill } from '../../src/services/sunat/sunatGreSoapClient.js';
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
    customizationID: '2.0',

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

    observacion: 'PRUEBA GRE BETA',
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
  const args = parseArgs(process.argv.slice(2));
  const payload = args.payload ? await readJson(args.payload) : buildDefaultGrePayload();

  const cfg = getSunatGreConfig();

  const fileNameBase = buildSunatGreFileNameFromPayload(payload);
  const outDir = path.resolve(args.out || `tmp/sunat-tests/gre/${fileNameBase}-${nowStamp()}`);

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

  const result = await sunatGreSendBill({ fileName: `${fileNameBase}.zip`, zipBuffer });
  await writeJson(path.join(outDir, 'sunat-result.json'), result);

  const cdrZipBase64 = result.applicationResponseBase64 || null;
  if (!cdrZipBase64) {
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
  console.log('WSDL:', cfg.greWsdlUrl);
  console.log('Archivo:', fileNameBase);
  console.log('CDR:', summary);
  console.log('Salida:', outDir);
}

main().catch((err) => {
  console.error('Error en test GRE:', err?.message || err);
  process.exitCode = 1;
});
