import 'dotenv/config';
import { peruDateIso } from './utils.js';
import { zipXml } from '../../src/services/sunat/sunatZip.js';
import { sunatSendBill } from '../../src/services/sunat/sunatSoapClient.js';
import { getSunatConfig } from '../../src/services/sunat/sunatConfig.js';
import { getSigningMaterialFromEnv } from '../../src/services/sunat/sunatCertificate.js';
import { signUblXml } from '../../src/services/sunat/sunatXmlSign.js';
import { buildInvoiceXmlFromApiPeruPayload, buildSunatFileNameFromPayload } from '../../src/services/sunat/ublInvoiceBuilder.js';

// Test con serie F600 (la que usa la app)
const payload = {
  ublVersion: '2.1',
  customizationID: '2.0',
  tipoDoc: '01',
  serie: 'F600',  // Serie que usa la app
  correlativo: 99,
  fechaEmision: peruDateIso(),
  tipoMoneda: 'PEN',
  company: {
    ruc: process.env.SUNAT_RUC || '20610588981',
    razonSocial: 'EMPRESA DEMO S.A.C.',
    nombreComercial: 'EMPRESA DEMO',
    address: { 
      ubigueo: '150101', 
      direccion: 'JR DEMO 123', 
      provincia: 'LIMA', 
      departamento: 'LIMA', 
      distrito: 'LIMA' 
    }
  },
  client: { 
    tipoDoc: '6', 
    numDoc: '20123456789', 
    rznSocial: 'CLIENTE DEMO S.A.C.' 
  },
  mtoOperGravadas: 100, 
  mtoIGV: 18, 
  mtoImpVenta: 118,
  legends: [{ code: '1000', value: 'SON CIENTO DIECIOCHO CON 00/100 SOLES' }],
  details: [{
    cantidad: 1, 
    unidad: 'NIU', 
    descripcion: 'PRODUCTO DEMO', 
    codProducto: 'P001',
    mtoValorUnitario: 100, 
    mtoPrecioUnitario: 118, 
    mtoValorVenta: 100,
    mtoBaseIgv: 100, 
    igv: 18, 
    tipAfeIgv: 10
  }]
};

console.log('=== TEST SERIE F600 ===\n');

const cfg = getSunatConfig();
console.log('Config ENV:', cfg.env);
console.log('WSDL:', cfg.billWsdlUrl);
console.log('Username:', cfg.credentials?.username);
console.log('Password length:', cfg.credentials?.password?.length);

const fileNameBase = buildSunatFileNameFromPayload(payload);
console.log('\nFilename:', fileNameBase);

const xmlUnsigned = buildInvoiceXmlFromApiPeruPayload(payload);
const { privateKeyPem, certificatePem } = await getSigningMaterialFromEnv({ allowDevSelfSigned: true });
const xmlSigned = signUblXml({ xml: xmlUnsigned, privateKeyPem, certificatePem });
const zipBuffer = await zipXml({ fileName: fileNameBase, xml: xmlSigned });

console.log('\nEnviando a SUNAT...\n');

try {
  const result = await sunatSendBill({ fileName: `${fileNameBase}.zip`, zipBuffer });
  console.log('\n✅ EXITO!');
  console.log('CDR recibido:', !!result.applicationResponseBase64);
} catch (err) {
  console.log('\n❌ ERROR:', err.message);
  if (err.response) {
    console.log('HTTP Status:', err.response.status);
  }
}
