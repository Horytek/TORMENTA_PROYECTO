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
  // Acepta `YYYY-MM-DD` o `YYYY-MM-DDTHH:mm:ss-05:00`
  const s = String(dateTimeIso || '');
  return s.includes('T') ? s.split('T')[0] : s;
}

export function buildSunatFileNameFromPayload(payload) {
  const ruc = payload?.company?.ruc;
  const tipoDoc = payload?.tipoDoc;
  const serie = payload?.serie;
  const correlativo = padLeft(payload?.correlativo, 8);
  if (!ruc || !tipoDoc || !serie || !correlativo) {
    throw new Error('Faltan campos para fileName (company.ruc, tipoDoc, serie, correlativo).');
  }
  return `${ruc}-${tipoDoc}-${serie}-${correlativo}`;
}

export function buildInvoiceXmlFromApiPeruPayload(payload) {
  // WARNING: Esto es un builder “mínimo” para empezar; puede requerir ajustes según catálogos/reglas SUNAT.
  // Usamos los campos que ya maneja tu frontend (similar a apisperu).

  const tipoDoc = String(payload?.tipoDoc || ''); // 01 factura, 03 boleta  // Tipo de operación (catálogo 51): 0101 = venta interna, 0200 = exportación, etc.
  const tipoOperacion = String(payload?.tipoOperacion || '0101');  const serie = String(payload?.serie || '');
  const correlativo = padLeft(payload?.correlativo, 8);

  const id = `${serie}-${correlativo}`;

  const issueDate = isoDate(payload?.fechaEmision);
  const currency = payload?.tipoMoneda || 'PEN';

  const companyRuc = payload?.company?.ruc;
  const companyName = payload?.company?.razonSocial || payload?.company?.nombreComercial || '';
  const companyAddress = payload?.company?.address || {};
  // Código de establecimiento/local anexo. "0000" es el principal (sede central)
  const addressTypeCode = payload?.company?.address?.codLocal || '0000';

  const clientDocType = payload?.client?.tipoDoc || '';
  const clientDoc = payload?.client?.numDoc || '';
  const clientName = payload?.client?.rznSocial || '';

  const mtoOperGravadas = toMoney(payload?.mtoOperGravadas);
  const mtoIGV = toMoney(payload?.mtoIGV);
  const mtoImpVenta = toMoney(payload?.mtoImpVenta);

  const legends = Array.isArray(payload?.legends) ? payload.legends : [];
  const legend1000 = legends.find((l) => String(l?.code) === '1000')?.value || '';

  const lines = Array.isArray(payload?.details) ? payload.details : [];

  const invoiceLinesXml = lines
    .map((line, idx) => {
      const qty = Number(line?.cantidad || 0);
      const unitCode = line?.unidad || 'NIU';
      const desc = line?.descripcion || line?.nombre || line?.codProducto || 'Producto';
      const code = line?.codProducto || '';

      const lineExtensionAmount = toMoney(line?.mtoValorVenta);
      const priceAmount = toMoney(line?.mtoPrecioUnitario);
      const priceAmountNoIgv = toMoney(line?.mtoValorUnitario);
      const igv = toMoney(line?.igv);
      const baseIgv = toMoney(line?.mtoBaseIgv);
      const tipAfeIgv = String(line?.tipAfeIgv ?? 10);

      return `
    <cac:InvoiceLine>
      <cbc:ID>${idx + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="${esc(unitCode)}">${esc(qty)}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="${esc(currency)}">${esc(lineExtensionAmount)}</cbc:LineExtensionAmount>
      <cac:PricingReference>
        <cac:AlternativeConditionPrice>
          <cbc:PriceAmount currencyID="${esc(currency)}">${esc(priceAmount)}</cbc:PriceAmount>
          <cbc:PriceTypeCode>01</cbc:PriceTypeCode>
        </cac:AlternativeConditionPrice>
      </cac:PricingReference>
      <cac:TaxTotal>
        <cbc:TaxAmount currencyID="${esc(currency)}">${esc(igv)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
          <cbc:TaxableAmount currencyID="${esc(currency)}">${esc(baseIgv)}</cbc:TaxableAmount>
          <cbc:TaxAmount currencyID="${esc(currency)}">${esc(igv)}</cbc:TaxAmount>
          <cac:TaxCategory>
            <cbc:Percent>18</cbc:Percent>
            <cbc:TaxExemptionReasonCode>${esc(tipAfeIgv)}</cbc:TaxExemptionReasonCode>
            <cac:TaxScheme>
              <cbc:ID>1000</cbc:ID>
              <cbc:Name>IGV</cbc:Name>
              <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
            </cac:TaxScheme>
          </cac:TaxCategory>
        </cac:TaxSubtotal>
      </cac:TaxTotal>
      <cac:Item>
        <cbc:Description>${esc(desc)}</cbc:Description>
        ${code ? `<cac:SellersItemIdentification><cbc:ID>${esc(code)}</cbc:ID></cac:SellersItemIdentification>` : ''}
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="${esc(currency)}">${esc(priceAmountNoIgv)}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>`;
    })
    .join('');

  // Namespaces UBL 2.1
  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice
  xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
  xmlns:ds="http://www.w3.org/2000/09/xmldsig#">

  <cbc:UBLVersionID>${esc(payload?.ublVersion || '2.1')}</cbc:UBLVersionID>
  <cbc:CustomizationID>${esc(payload?.customizationID || '2.0')}</cbc:CustomizationID>

  <cbc:ID>${esc(id)}</cbc:ID>
  <cbc:IssueDate>${esc(issueDate)}</cbc:IssueDate>
  <cbc:InvoiceTypeCode listAgencyName="PE:SUNAT" listName="Tipo de Documento" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo01" listID="${esc(tipoOperacion)}" listSchemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo51" name="Tipo de Operacion">${esc(tipoDoc)}</cbc:InvoiceTypeCode>
  ${legend1000 ? `<cbc:Note languageLocaleID="1000">${esc(legend1000)}</cbc:Note>` : ''}
  <cbc:DocumentCurrencyCode>${esc(currency)}</cbc:DocumentCurrencyCode>

  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="6">${esc(companyRuc)}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${esc(companyName)}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:ID>${esc(companyAddress?.ubigueo || '')}</cbc:ID>
        <cbc:StreetName>${esc(companyAddress?.direccion || '')}</cbc:StreetName>
        <cbc:CityName>${esc(companyAddress?.provincia || '')}</cbc:CityName>
        <cbc:CountrySubentity>${esc(companyAddress?.departamento || '')}</cbc:CountrySubentity>
        <cbc:District>${esc(companyAddress?.distrito || '')}</cbc:District>
        <cac:Country><cbc:IdentificationCode>PE</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${esc(companyName)}</cbc:RegistrationName>
        <cac:RegistrationAddress>
          <cbc:AddressTypeCode>${esc(addressTypeCode)}</cbc:AddressTypeCode>
        </cac:RegistrationAddress>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>

  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="${esc(clientDocType)}">${esc(clientDoc)}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${esc(clientName)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>

  <cac:PaymentTerms>
    <cbc:ID>FormaPago</cbc:ID>
    <cbc:PaymentMeansID>Contado</cbc:PaymentMeansID>
  </cac:PaymentTerms>

  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${esc(currency)}">${esc(mtoIGV)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${esc(currency)}">${esc(mtoOperGravadas)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${esc(currency)}">${esc(mtoIGV)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cac:TaxScheme>
          <cbc:ID>1000</cbc:ID>
          <cbc:Name>IGV</cbc:Name>
          <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>

  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${esc(currency)}">${esc(mtoOperGravadas)}</cbc:LineExtensionAmount>
    <cbc:TaxInclusiveAmount currencyID="${esc(currency)}">${esc(mtoImpVenta)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${esc(currency)}">${esc(mtoImpVenta)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>

  ${invoiceLinesXml}
</Invoice>`;
}
