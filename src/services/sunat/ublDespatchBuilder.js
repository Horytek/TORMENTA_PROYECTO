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

function isoTime(dateTimeIso) {
  const s = String(dateTimeIso || '');
  if (!s.includes('T')) return '';
  const time = s.split('T')[1] || '';
  // HH:mm:ss-05:00
  return time.split('-')[0].split('+')[0];
}

function mapTipoDocGre(tipoDoc) {
  // En payload actual (apisperu) usan "05" para guías. En SUNAT, el código típico para Guía Remisión es "09".
  const t = String(tipoDoc || '').trim();
  if (t === '05') return '09';
  return t || '09';
}

export function buildSunatGreFileNameFromPayload(payload) {
  const ruc = payload?.company?.ruc;
  const tipoDoc = mapTipoDocGre(payload?.tipoDoc);
  const serie = payload?.serie;
  const correlativo = padLeft(payload?.correlativo, 8);
  if (!ruc || !tipoDoc || !serie || !correlativo) {
    throw new Error('Faltan campos para fileName GRE (company.ruc, tipoDoc, serie, correlativo).');
  }
  return `${ruc}-${tipoDoc}-${serie}-${correlativo}`;
}

export function buildDespatchXmlFromApiPeruPayload(payload) {
  // Builder mínimo para DespatchAdvice (GRE). Puede requerir ajuste fino de catálogos/estructura.
  const tipoDoc = mapTipoDocGre(payload?.tipoDoc);
  const serie = String(payload?.serie || '');
  const correlativo = padLeft(payload?.correlativo, 8);
  const id = `${serie}-${correlativo}`;

  const issueDate = isoDate(payload?.fechaEmision);
  const issueTime = isoTime(payload?.fechaEmision);

  const company = payload?.company || {};
  const addr = company?.address || {};

  const destinatario = payload?.destinatario || {};
  const envio = payload?.envio || {};
  const llegada = envio?.llegada || {};
  const partida = envio?.partida || {};
  const transportista = envio?.transportista || {};

  const details = Array.isArray(payload?.details) ? payload.details : [];

  const linesXml = details
    .map((d, idx) => {
      return `
  <cac:DespatchLine>
    <cbc:ID>${idx + 1}</cbc:ID>
    <cbc:DeliveredQuantity unitCode="${esc(d?.unidad || 'NIU')}">${esc(d?.cantidad || 0)}</cbc:DeliveredQuantity>
    <cac:OrderLineReference>
      <cbc:LineID>${idx + 1}</cbc:LineID>
    </cac:OrderLineReference>
    <cac:Item>
      <cbc:Description>${esc(d?.descripcion || '')}</cbc:Description>
      ${d?.codigo ? `<cac:SellersItemIdentification><cbc:ID>${esc(d.codigo)}</cbc:ID></cac:SellersItemIdentification>` : ''}
    </cac:Item>
  </cac:DespatchLine>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<DespatchAdvice
  xmlns="urn:oasis:names:specification:ubl:schema:xsd:DespatchAdvice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
  xmlns:ds="http://www.w3.org/2000/09/xmldsig#">

  <cbc:UBLVersionID>${esc(payload?.ublVersion || '2.1')}</cbc:UBLVersionID>
  <cbc:CustomizationID>${esc(payload?.customizationID || '2.0')}</cbc:CustomizationID>

  <cbc:ID>${esc(id)}</cbc:ID>
  <cbc:IssueDate>${esc(issueDate)}</cbc:IssueDate>
  ${issueTime ? `<cbc:IssueTime>${esc(issueTime)}</cbc:IssueTime>` : ''}
  <cbc:DespatchAdviceTypeCode>${esc(tipoDoc)}</cbc:DespatchAdviceTypeCode>

  <cac:DespatchSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="6">${esc(company?.ruc || '')}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${esc(company?.razonSocial || company?.nombreComercial || '')}</cbc:RegistrationName>
        <cac:RegistrationAddress>
          <cbc:ID schemeAgencyName="PE:INEI" schemeName="Ubigeos">${esc(addr?.ubigueo || '')}</cbc:ID>
          <cbc:AddressTypeCode listAgencyName="PE:SUNAT" listName="Establecimientos anexos">0000</cbc:AddressTypeCode>
          <cbc:StreetName>${esc(addr?.direccion || '')}</cbc:StreetName>
          <cbc:CityName>${esc(addr?.provincia || '')}</cbc:CityName>
          <cbc:CountrySubentity>${esc(addr?.departamento || '')}</cbc:CountrySubentity>
          <cbc:District>${esc(addr?.distrito || '')}</cbc:District>
          <cac:Country><cbc:IdentificationCode listID="ISO 3166-1" listAgencyName="United Nations Economic Commission for Europe" listName="Country">PE</cbc:IdentificationCode></cac:Country>
        </cac:RegistrationAddress>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:DespatchSupplierParty>

  <cac:DeliveryCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID>${esc(destinatario?.numDoc || '')}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${esc(destinatario?.rznSocial || '')}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:DeliveryCustomerParty>

  <cac:Shipment>
    <cbc:ID>1</cbc:ID>
    <cbc:HandlingCode>${esc(payload?.motivoTraslado || '01')}</cbc:HandlingCode>
    <cbc:Information>${esc(payload?.observacion || '')}</cbc:Information>

    <cbc:GrossWeightMeasure unitCode="${esc(envio?.undPesoTotal || 'KGM')}">${esc(envio?.pesoTotal || 0)}</cbc:GrossWeightMeasure>

    <cac:ShipmentStage>
      <cbc:TransportModeCode>${esc(payload?.modoTransporte || '01')}</cbc:TransportModeCode>
      <cac:TransitPeriod>
        <cbc:StartDate>${esc(isoDate(envio?.fecTraslado || payload?.fechaEmision))}</cbc:StartDate>
      </cac:TransitPeriod>
      <cac:CarrierParty>
        <cac:PartyIdentification>
          <cbc:ID>${esc(transportista?.numDoc || '')}</cbc:ID>
        </cac:PartyIdentification>
        <cac:PartyLegalEntity>
          <cbc:RegistrationName>${esc(transportista?.rznSocial || '')}</cbc:RegistrationName>
        </cac:PartyLegalEntity>
      </cac:CarrierParty>
    </cac:ShipmentStage>

    <cac:Delivery>
      <cac:DeliveryLocation>
        <cbc:ID schemeAgencyName="PE:INEI" schemeName="Ubigeos">${esc(llegada?.ubigueo || '')}</cbc:ID>
        <cac:Address>
          <cbc:StreetName>${esc(llegada?.direccion || '')}</cbc:StreetName>
        </cac:Address>
      </cac:DeliveryLocation>
    </cac:Delivery>

    <cac:OriginAddress>
      <cbc:ID schemeAgencyName="PE:INEI" schemeName="Ubigeos">${esc(partida?.ubigueo || '')}</cbc:ID>
      <cbc:StreetName>${esc(partida?.direccion || '')}</cbc:StreetName>
    </cac:OriginAddress>
  </cac:Shipment>

  ${linesXml}
</DespatchAdvice>`;
}
