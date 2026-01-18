/**
 * Builder UBL para Comunicación de Baja (VoidedDocuments)
 * Usado para anular Facturas ante SUNAT
 */

function esc(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
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
 * Generar nombre de archivo para Comunicación de Baja
 * Formato: RUC-RA-AAAAMMDD-correlativo
 */
export function buildSunatVoidedFileNameFromPayload(payload) {
    const ruc = payload?.company?.ruc;
    const fecGeneracion = isoDate(payload?.fecGeneracion);
    const correlativo = padLeft(payload?.correlativo, 5);

    if (!ruc || !fecGeneracion) {
        throw new Error('Faltan campos para fileName (company.ruc, fecGeneracion).');
    }

    // Formato: RUC-RA-YYYYMMDD-correlativo
    const datePart = fecGeneracion.replace(/-/g, '');
    return `${ruc}-RA-${datePart}-${correlativo}`;
}

/**
 * Construir XML UBL para Comunicación de Baja según especificación SUNAT
 * @param {Object} payload - Datos del documento similar a formato apisperu
 */
export function buildVoidedXmlFromApiPeruPayload(payload) {
    const ruc = payload?.company?.ruc;
    const companyName = payload?.company?.razonSocial || payload?.company?.nombreComercial || '';

    const fecGeneracion = isoDate(payload?.fecGeneracion);
    const fecComunicacion = isoDate(payload?.fecComunicacion);
    const correlativo = padLeft(payload?.correlativo, 5);

    // ID del documento: RA-YYYYMMDD-correlativo
    const datePart = fecGeneracion.replace(/-/g, '');
    const docId = `RA-${datePart}-${correlativo}`;

    const details = Array.isArray(payload?.details) ? payload.details : [];

    const voidedLinesXml = details
        .map((detail, idx) => {
            const tipoDoc = String(detail?.tipoDoc || '01'); // 01=Factura, 03=Boleta
            const serie = String(detail?.serie || '');
            const correl = padLeft(detail?.correlativo, 8);
            const motivo = detail?.desMotivoBaja || 'ERROR EN DOCUMENTO';

            return `
    <sac:VoidedDocumentsLine>
      <cbc:LineID>${idx + 1}</cbc:LineID>
      <cbc:DocumentTypeCode>${esc(tipoDoc)}</cbc:DocumentTypeCode>
      <sac:DocumentSerialID>${esc(serie)}</sac:DocumentSerialID>
      <sac:DocumentNumberID>${esc(correl)}</sac:DocumentNumberID>
      <sac:VoidReasonDescription>${esc(motivo)}</sac:VoidReasonDescription>
    </sac:VoidedDocumentsLine>`;
        })
        .join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<VoidedDocuments
  xmlns="urn:sunat:names:specification:ubl:peru:schema:xsd:VoidedDocuments-1"
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
  <cbc:CustomizationID>1.0</cbc:CustomizationID>

  <cbc:ID>${esc(docId)}</cbc:ID>
  <cbc:ReferenceDate>${esc(fecGeneracion)}</cbc:ReferenceDate>
  <cbc:IssueDate>${esc(fecComunicacion)}</cbc:IssueDate>

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

  ${voidedLinesXml}
</VoidedDocuments>`;
}
