// Test que simula EXACTAMENTE lo que envía la app para una factura
import 'dotenv/config';
import { zipXml } from '../../src/services/sunat/sunatZip.js';
import { sunatSendBill } from '../../src/services/sunat/sunatSoapClient.js';
import { getSunatConfigByEmpresa } from '../../src/services/sunat/sunatConfig.js';
import { getSigningMaterialFromConfig } from '../../src/services/sunat/sunatCertificate.js';
import { signUblXml } from '../../src/services/sunat/sunatXmlSign.js';
import { buildInvoiceXmlFromApiPeruPayload, buildSunatFileNameFromPayload } from '../../src/services/sunat/ublInvoiceBuilder.js';

// Este es EXACTAMENTE el payload que muestra el log del controlador
const payload = {
  ublVersion: "2.1",
  tipoOperacion: "0101",
  tipoDoc: "01",  // FACTURA
  serie: "F600",
  correlativo: "00000016",  // siguiente número
  fechaEmision: new Date().toISOString().split('T')[0],  // Fecha de hoy
  formaPago: { moneda: "PEN", tipo: "Contado" },
  tipoMoneda: "PEN",
  client: {
    tipoDoc: "6",  // RUC
    numDoc: "20123456789",
    rznSocial: "CLIENTE DEMO S.A.C.",
    address: { direccion: "", provincia: "", departamento: "", distrito: "", ubigueo: "" }
  },
  company: {
    ruc: "20610588981",
    razonSocial: "TORMENTA S.A.C.",
    nombreComercial: "TORMENTA",
    address: {
      direccion: "AV DEMO 123",
      provincia: "LIMA",
      departamento: "LIMA",
      distrito: "LIMA",
      ubigueo: "150101",
    },
  },
  mtoOperGravadas: "42.37",
  mtoIGV: "7.63",
  valorVenta: "42.37",
  totalImpuestos: "7.63",
  subTotal: "50.00",
  mtoImpVenta: "50.00",
  details: [{
    codProducto: "24",
    unidad: "NIU",
    descripcion: "CASACA JEANS / DASHIR",
    cantidad: 1,
    mtoValorUnitario: "42.37",
    mtoValorVenta: "42.37",
    mtoBaseIgv: "42.37",
    porcentajeIgv: 18,
    igv: "7.63",
    tipAfeIgv: 10,
    totalImpuestos: "7.63",
    mtoPrecioUnitario: "50.00"
  }],
  legends: [{ code: "1000", value: "SON CINCUENTA CON 00/100 SOLES" }]
};

console.log('=== TEST FACTURA SIMULANDO APP (Config de BD) ===\n');

// IMPORTANTE: Usamos la config de BD igual que la app
// id_empresa=2, id_tenant=1, ruc=20610588981
const config = await getSunatConfigByEmpresa(2, 1, '20610588981');
console.log('Config source: DB');
console.log('Config ENV:', config.env);
console.log('WSDL:', config.billWsdlUrl);
console.log('Username:', config.credentials?.username);
console.log('Password length:', config.credentials?.password?.length);

const fileNameBase = buildSunatFileNameFromPayload(payload);
console.log('\nFilename:', fileNameBase);

const xmlUnsigned = buildInvoiceXmlFromApiPeruPayload(payload);
console.log('\nXML Unsigned (first 500 chars):\n', xmlUnsigned.substring(0, 500));

const signingMaterial = getSigningMaterialFromConfig(config);
const xmlSigned = signUblXml({ 
  xml: xmlUnsigned, 
  privateKeyPem: signingMaterial.privateKeyPem, 
  certificatePem: signingMaterial.certificatePem 
});
console.log('\nXML Signed: OK (length:', xmlSigned.length, ')');

const zipBuffer = await zipXml({ fileName: fileNameBase, xml: xmlSigned });
console.log('ZIP created: OK');

console.log('\n--- Enviando a SUNAT con config de BD ---\n');

try {
  const result = await sunatSendBill({ fileName: `${fileNameBase}.zip`, zipBuffer, config });
  console.log('\n✅ EXITO!');
  console.log('CDR recibido:', !!result.applicationResponseBase64);
} catch (err) {
  console.log('\n❌ ERROR:', err.message || 'No message');
  if (err.body) console.log('Body:', String(err.body).substring(0, 200));
  if (err.response) console.log('HTTP Status:', err.response.status);
}
