/**
 * Builder UBL para Resumen Diario (SummaryDocuments)
 * Usado para anular Boletas ante SUNAT
 */

function esc(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function toMoney(n) {
    const num = Number(n);
    if (!Number.isFinite(num)) return '0.00';
    return num.toFixed(2);
}

function padLeft(value, width, ch = '0') {
    const s = String(value ?? '');
    if (s.length >= width) return s;
    return ch.repeat(width - s.length) + s;
}

function isoDate(dateTimeIso) {
    const s = String(dateTimeIso || '');
    return s.includes('T') ? s.split('T')[0] : s;
}

/**
 * Generar nombre de archivo para Resumen Diario
 * Formato: RUC-RC-AAAAMMDD-correlativo
 */
export function buildSunatSummaryFileNameFromPayload(payload) {
    const ruc = payload?.company?.ruc;
    const fecResumen = isoDate(payload?.fecResumen || payload?.fecGeneracion);
    const correlativo = padLeft(payload?.correlativo, 5);

    if (!ruc || !fecResumen) {
        throw new Error('Faltan campos para fileName (company.ruc, fecResumen).');
    }

    // Formato: RUC-RC-YYYYMMDD-correlativo
    const datePart = fecResumen.replace(/-/g, '');
    return `${ruc}-RC-${datePart}-${correlativo}`;
}

/**
 * Construir XML UBL para Resumen Diario según especificación SUNAT
 * Usado principalmente para anular Boletas (estado = "3")
 * @param {Object} payload - Datos del documento similar a formato apisperu
 */
export function buildSummaryXmlFromApiPeruPayload(payload) {
    const ruc = payload?.company?.ruc;
    const companyName = payload?.company?.razonSocial || payload?.company?.nombreComercial || '';

    const fecGeneracion = isoDate(payload?.fecGeneracion);
    const fecResumen = isoDate(payload?.fecResumen || payload?.fecGeneracion);
    const correlativo = padLeft(payload?.correlativo, 5);
    const moneda = payload?.moneda || 'PEN';

    // ID del documento: RC-YYYYMMDD-correlativo
    const datePart = fecResumen.replace(/-/g, '');
    const docId = `RC-${datePart}-${correlativo}`;

    const details = Array.isArray(payload?.details) ? payload.details : [];

    const summaryLinesXml = details
        .map((detail, idx) => {
            const tipoDoc = String(detail?.tipoDoc || '03'); // 03=Boleta
            const serieNro = String(detail?.serieNro || ''); // Ej: B001-00000001
            const estado = String(detail?.estado || '1'); // 1=Adicionar, 2=Modificar, 3=Anular

            const clienteTipo = String(detail?.clienteTipo || '1'); // 1=DNI, 6=RUC
            const clienteNro = String(detail?.clienteNro || '');

            const total = toMoney(detail?.total);
            const mtoOperGravadas = toMoney(detail?.mtoOperGravadas);
            const mtoOperInafectas = toMoney(detail?.mtoOperInafectas || 0);
            const mtoOperExoneradas = toMoney(detail?.mtoOperExoneradas || 0);
            const mtoOtrosCargos = toMoney(detail?.mtoOtrosCargos || 0);
            const mtoIGV = toMoney(detail?.mtoIGV);

            // Separar serie y correlativo
            const [serie, correl] = serieNro.includes('-')
                ? serieNro.split('-')
                : [serieNro, '00000001'];

            return `
    <sac:SummaryDocumentsLine>
      <cbc:LineID>${idx + 1}</cbc:LineID>
      <cbc:DocumentTypeCode>${esc(tipoDoc)}</cbc:DocumentTypeCode>
      <cbc:ID>${esc(serieNro)}</cbc:ID>
      <cac:AccountingCustomerParty>
        <cbc:CustomerAssignedAccountID>${esc(clienteNro)}</cbc:CustomerAssignedAccountID>
        <cbc:AdditionalAccountID>${esc(clienteTipo)}</cbc:AdditionalAccountID>
      </cac:AccountingCustomerParty>
      <cac:Status>
        <cbc:ConditionCode>${esc(estado)}</cbc:ConditionCode>
      </cac:Status>
      <sac:TotalAmount currencyID="${esc(moneda)}">${esc(total)}</sac:TotalAmount>
      <sac:BillingPayment>
        <cbc:PaidAmount currencyID="${esc(moneda)}">${esc(mtoOperGravadas)}</cbc:PaidAmount>
        <cbc:InstructionID>01</cbc:InstructionID>
      </sac:BillingPayment>
      <sac:BillingPayment>
        <cbc:PaidAmount currencyID="${esc(moneda)}">${esc(mtoOperInafectas)}</cbc:PaidAmount>
        <cbc:InstructionID>02</cbc:InstructionID>
      </sac:BillingPayment>
      <sac:BillingPayment>
        <cbc:PaidAmount currencyID="${esc(moneda)}">${esc(mtoOperExoneradas)}</cbc:PaidAmount>
        <cbc:InstructionID>03</cbc:InstructionID>
      </sac:BillingPayment>
      <cac:TaxTotal>
        <cbc:TaxAmount currencyID="${esc(moneda)}">${esc(mtoIGV)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
          <cbc:TaxAmount currencyID="${esc(moneda)}">${esc(mtoIGV)}</cbc:TaxAmount>
          <cac:TaxCategory>
            <cac:TaxScheme>
              <cbc:ID>1000</cbc:ID>
              <cbc:Name>IGV</cbc:Name>
              <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
            </cac:TaxScheme>
          </cac:TaxCategory>
        </cac:TaxSubtotal>
      </cac:TaxTotal>
    </sac:SummaryDocumentsLine>`;
        })
        .join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<SummaryDocuments
  xmlns="urn:sunat:names:specification:ubl:peru:schema:xsd:SummaryDocuments-1"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
  xmlns:sac="urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1"
  xmlns:ds="http://www.w3.org/2000/09/xmldsig#">

  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent/>
    </ext:UBLExtension>
  </ext:UBLExtensions>

  <cbc:UBLVersionID>2.0</cbc:UBLVersionID>
  <cbc:CustomizationID>1.1</cbc:CustomizationID>

  <cbc:ID>${esc(docId)}</cbc:ID>
  <cbc:ReferenceDate>${esc(fecGeneracion)}</cbc:ReferenceDate>
  <cbc:IssueDate>${esc(fecResumen)}</cbc:IssueDate>

  <cac:Signature>
    <cbc:ID>IDSignSP</cbc:ID>
    <cac:SignatoryParty>
      <cac:PartyIdentification>
        <cbc:ID>${esc(ruc)}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${esc(companyName)}</cbc:Name>
      </cac:PartyName>
    </cac:SignatoryParty>
    <cac:DigitalSignatureAttachment>
      <cac:ExternalReference>
        <cbc:URI>#SignatureSP</cbc:URI>
      </cac:ExternalReference>
    </cac:DigitalSignatureAttachment>
  </cac:Signature>

  <cac:AccountingSupplierParty>
    <cbc:CustomerAssignedAccountID>${esc(ruc)}</cbc:CustomerAssignedAccountID>
    <cbc:AdditionalAccountID>6</cbc:AdditionalAccountID>
    <cac:Party>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${esc(companyName)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>

  ${summaryLinesXml}
</SummaryDocuments>`;
}
