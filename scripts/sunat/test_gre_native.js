/**
 * Test GRE usando cliente HTTPS nativo (sin node-soap)
 * Este enfoque evita los problemas de 401 intermitentes de node-soap.
 */
import 'dotenv/config';
import { sunatGreSendBillNative } from '../../src/services/sunat/sunatGreNativeClient.js';
import { buildDespatchAdviceXml } from '../../src/services/sunat/ublDespatchBuilder.js';
import { signXmlWithP12 } from '../../src/services/sunat/sunatXmlSign.js';
import { zipXml } from '../../src/services/sunat/sunatZip.js';
import { getSunatGreConfig } from '../../src/services/sunat/sunatGreConfig.js';

async function testGreNative() {
  console.log('=== Test GRE Beta con Cliente HTTPS Nativo ===\n');

  const cfg = getSunatGreConfig();
  console.log('Entorno:', cfg.env);
  console.log('Username:', cfg.credentials.username);
  console.log('Password:', cfg.credentials.password ? '***' : '(vacío)');

  // Datos de prueba para Guía de Remisión
  const grePayload = {
    tipoDoc: '09', // Guía de Remisión Remitente
    serie: 'T001',
    correlativo: '00000001',
    fechaEmision: new Date().toISOString().split('T')[0],
    horaEmision: new Date().toTimeString().split(' ')[0].substring(0, 5),
    
    remitente: {
      ruc: '20610588981',
      razonSocial: 'TORMENTA ELECTRICA S.A.C.',
      ubigeo: '150101',
      direccion: 'AV. AREQUIPA 123',
      urbanizacion: 'CENTRO',
      departamento: 'LIMA',
      provincia: 'LIMA',
      distrito: 'LIMA',
    },
    
    destinatario: {
      tipoDoc: '6',
      numDoc: '20123456789',
      razonSocial: 'CLIENTE DESTINO S.A.C.',
      ubigeo: '150102',
      direccion: 'JR. LA UNION 456',
      urbanizacion: 'CERCADO',
      departamento: 'LIMA',
      provincia: 'LIMA',
      distrito: 'ANCON',
    },

    envio: {
      modTraslado: '01', // Transporte público
      pesoTotal: 100.00,
      undPeso: 'KGM',
      numBultos: 10,
      
      llegada: {
        ubigeo: '150102',
        direccion: 'JR. LA UNION 456',
      },
      partida: {
        ubigeo: '150101',
        direccion: 'AV. AREQUIPA 123',
      },
      
      transportista: {
        tipoDoc: '6',
        numDoc: '20111111111',
        razonSocial: 'TRANSPORTES RAPIDO S.A.C.',
        mtc: 'ABC123',
      },
    },
    
    items: [
      {
        cantidad: 10,
        unidad: 'NIU',
        descripcion: 'PRODUCTO DE PRUEBA GRE',
        codigo: 'PROD001',
      },
    ],
  };

  try {
    // 1. Construir XML
    console.log('\n1. Construyendo XML UBL 2.1...');
    const xmlUnsigned = buildDespatchAdviceXml(grePayload);
    console.log('   XML generado:', xmlUnsigned.substring(0, 200) + '...');

    // 2. Firmar XML
    console.log('\n2. Firmando XML...');
    const xmlSigned = await signXmlWithP12(xmlUnsigned);
    console.log('   XML firmado correctamente');

    // 3. Crear ZIP
    const ruc = grePayload.remitente.ruc;
    const baseName = `${ruc}-${grePayload.tipoDoc}-${grePayload.serie}-${grePayload.correlativo}`;
    const fileName = `${baseName}.zip`;
    
    console.log('\n3. Creando ZIP...');
    const zipBuffer = await zipXml({ fileName: baseName, xml: xmlSigned });
    console.log('   ZIP creado:', fileName, `(${zipBuffer.length} bytes)`);

    // 4. Enviar a SUNAT usando cliente nativo
    console.log('\n4. Enviando a SUNAT GRE Beta (cliente HTTPS nativo)...');
    const result = await sunatGreSendBillNative({ fileName, zipBuffer });

    console.log('\n=== RESPUESTA SUNAT ===');
    console.log('Success:', result.success);
    
    if (result.ticket) {
      console.log('Ticket (async):', result.ticket);
      console.log('\n✅ GRE enviada correctamente. Use getStatus con el ticket para obtener respuesta.');
    } else if (result.applicationResponseBase64) {
      console.log('Application Response (base64):', result.applicationResponseBase64.substring(0, 50) + '...');
      // Decodificar manualmente
      console.log('(Decodificación pendiente)');
    } else if (result.error) {
      console.log('Error SUNAT:', result.error);
    }

    console.log('\nRaw Status:', result.raw?.statusCode, result.raw?.statusMessage);

  } catch (error) {
    console.error('\nError en test GRE:', error.message);
    if (error.response) {
      console.error('Response body:', error.response.body);
    }
    throw error;
  }
}

testGreNative().catch(console.error);
