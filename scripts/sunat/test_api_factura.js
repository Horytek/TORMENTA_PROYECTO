/**
 * Test directo a la API de facturas (sin frontend)
 * Simula exactamente lo que hace el frontend pero via HTTP
 * 
 * Ejecutar:
 *   1. Primero iniciar el servidor: npm run dev
 *   2. Luego ejecutar este script: node scripts/sunat/test_api_factura.js
 */

const API_BASE = 'http://localhost:4000/api';

// Credenciales de usuario para login
const LOGIN_CREDENTIALS = {
  usuario: 'vendedor_5',
  password: '790'
};

// Payload de factura (mismo que usa el frontend)
const facturaPayload = {
  ublVersion: "2.1",
  tipoOperacion: "0101",
  tipoDoc: "01",  // FACTURA
  serie: "F600",
  correlativo: "00000100",  // Número nuevo para evitar duplicados
  fechaEmision: new Date().toISOString().split('T')[0],
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

async function makeRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  
  return { status: response.status, ok: response.ok, data };
}

async function main() {
  console.log('=== TEST API FACTURA (Sin Frontend) ===\n');
  console.log('API Base:', API_BASE);
  console.log('Fecha:', new Date().toISOString());
  console.log('');

  // Step 1: Login
  console.log('--- Step 1: Login ---');
  console.log('Usuario:', LOGIN_CREDENTIALS.usuario);
  
  const loginRes = await makeRequest(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify(LOGIN_CREDENTIALS),
  });
  
  if (!loginRes.ok) {
    console.error('❌ Login failed:', loginRes.status, loginRes.data);
    process.exit(1);
  }
  
  const token = loginRes.data.token;
  console.log('✅ Login OK - Token:', token ? token.substring(0, 30) + '...' : 'N/A');
  console.log('   id_empresa:', loginRes.data.id_empresa);
  console.log('   id_tenant:', loginRes.data.id_tenant);
  console.log('');

  // Step 2: Emit Factura
  console.log('--- Step 2: Emitir Factura ---');
  console.log('Serie:', facturaPayload.serie);
  console.log('Correlativo:', facturaPayload.correlativo);
  console.log('Filename esperado:', `${facturaPayload.company.ruc}-01-${facturaPayload.serie}-${facturaPayload.correlativo}`);
  console.log('');
  console.log('Enviando a SUNAT...');
  
  const startTime = Date.now();
  
  const emitRes = await makeRequest(`${API_BASE}/sunat/cpe/invoice/emit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(facturaPayload),
  });
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log('');
  console.log('--- Resultado ---');
  console.log('HTTP Status:', emitRes.status);
  console.log('Tiempo:', elapsed, 'segundos');
  console.log('');
  
  if (emitRes.ok && emitRes.data.ok) {
    console.log('✅ ¡ÉXITO!');
    console.log('   fileName:', emitRes.data.fileName);
    console.log('   CDR recibido:', !!emitRes.data.cdrZipBase64);
    if (emitRes.data.cdrSummary) {
      console.log('   CDR ResponseCode:', emitRes.data.cdrSummary.responseCode);
      console.log('   CDR Description:', emitRes.data.cdrSummary.description);
    }
  } else {
    console.log('❌ ERROR');
    console.log('   ok:', emitRes.data.ok);
    console.log('   message:', emitRes.data.message);
    if (emitRes.data.raw) {
      console.log('   raw:', String(emitRes.data.raw).substring(0, 300));
    }
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
