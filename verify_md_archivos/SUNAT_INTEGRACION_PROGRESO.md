# Progreso Integración SUNAT - Facturación Electrónica

## Resumen Ejecutivo

**Fecha:** 17 de enero de 2026  
**Estado:** ✅ CPE (Factura) ACEPTADA | ⏳ GRE (Guía de Remisión) en pruebas

### Logro Principal
```
SUNAT ENV: beta
Archivo: 20610588981-01-F001-00000001
CDR: {
  responseCode: '0',
  description: 'La Factura numero F001-00000001, ha sido aceptada',
  notes: []
}
```

---

## Problemas Resueltos

### 1. Error 401 Unauthorized - WS-Security

**Problema:** SUNAT beta rechazaba todas las peticiones con HTTP 401 a pesar de credenciales correctas.

**Causa Raíz:** El módulo `node-soap` genera headers WS-Security con elementos adicionales que SUNAT rechaza:
- `wsu:Timestamp`
- `wsu:Created` dentro de UsernameToken
- `wsu:Id` como atributo
- `wsse:Nonce`

**Solución:** Crear implementación propia de WS-Security minimalista en `src/services/sunat/sunatWsSecurity.js`:

```javascript
export class SunatWSSecurity {
  constructor(username, password) {
    this._username = username;
    this._password = password;
  }

  toXML() {
    return `<wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">` +
      `<wsse:UsernameToken>` +
      `<wsse:Username>${this._username}</wsse:Username>` +
      `<wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${this._password}</wsse:Password>` +
      `</wsse:UsernameToken>` +
      `</wsse:Security>`;
  }
}
```

### 2. Error 401 Intermitente - Reutilización de Conexión

**Problema:** Conexiones HTTP reutilizadas causaban 401 intermitentes.

**Solución:** 
- Agregar header `Connection: close`
- Eliminar caché de cliente SOAP

### 3. Error 1008 - Tipo de Documento del Emisor

**Problema:** "El XML no contiene el tag o no existe información en tipo de documento del emisor"

**Solución:** Agregar `schemeID="6"` al RUC del emisor:
```xml
<cac:PartyIdentification>
  <cbc:ID schemeID="6">20610588981</cbc:ID>
</cac:PartyIdentification>
```

### 4. Error 3030 - Código de Local Anexo

**Problema:** "Debe consignar el código de local anexo del emisor"

**Solución:** Agregar `RegistrationAddress` con `AddressTypeCode`:
```xml
<cac:PartyLegalEntity>
  <cbc:RegistrationName>EMPRESA S.A.C.</cbc:RegistrationName>
  <cac:RegistrationAddress>
    <cbc:AddressTypeCode>0000</cbc:AddressTypeCode>
  </cac:RegistrationAddress>
</cac:PartyLegalEntity>
```

### 5. Error 3205 - Tipo de Operación

**Problema:** "Debe consignar el tipo de operación"

**Solución:** Agregar atributo `listID` con tipo de operación (catálogo 51):
```xml
<cbc:InvoiceTypeCode listAgencyName="PE:SUNAT" listName="Tipo de Documento" 
  listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo01" 
  listID="0101" 
  listSchemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo51" 
  name="Tipo de Operacion">01</cbc:InvoiceTypeCode>
```

### 6. Error 3244 - Tipo de Transacción

**Problema:** "Debe consignar la información del tipo de transacción del comprobante"

**Solución:** Agregar `PaymentTerms` para forma de pago:
```xml
<cac:PaymentTerms>
  <cbc:ID>FormaPago</cbc:ID>
  <cbc:PaymentMeansID>Contado</cbc:PaymentMeansID>
</cac:PaymentTerms>
```

---

## Archivos Modificados/Creados

### Nuevos
| Archivo | Descripción |
|---------|-------------|
| `src/services/sunat/sunatWsSecurity.js` | WS-Security minimalista para SUNAT |

### Modificados
| Archivo | Cambios |
|---------|---------|
| `src/services/sunat/sunatSoapClient.js` | Usar SunatWSSecurity, eliminar caché, agregar Connection: close |
| `src/services/sunat/sunatGreSoapClient.js` | Mismos cambios que CPE |
| `src/services/sunat/ublInvoiceBuilder.js` | Corregir estructura XML según errores SUNAT |
| `src/services/sunat/ublDespatchBuilder.js` | Corregir DespatchSupplierParty |

---

## Configuración de Credenciales

Archivo: `.env.sunat.local`

```env
SUNAT_ENV=beta
SUNAT_RUC=20610588981
SUNAT_SOL_USER=TORMENTA
SUNAT_SOL_PASS=Uliseskun7890
SUNAT_CERT_P12_PASS=123
SUNAT_CERT_P12_BASE64=MIIMBgIBAzCCC7wGCSqGSIb3DQEHAaCCC60Egg...
```

**Formato de Usuario SOAP:** `${RUC}${SOL_USER}` = `20610588981TORMENTA`

---

## Comandos de Prueba

```powershell
# Probar CPE (Factura/Boleta)
$env:DOTENV_CONFIG_PATH = ".env.sunat.local"; node scripts/sunat/test_cpe_beta.js

# Probar GRE (Guía de Remisión)
$env:DOTENV_CONFIG_PATH = ".env.sunat.local"; node scripts/sunat/test_gre_beta.js

# Generar XML sin enviar (debug)
$env:DOTENV_CONFIG_PATH = ".env.sunat.local"; node scripts/sunat/test_cpe_beta.js --skip-send
```

---

## Estructura XML Correcta (Factura)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
  xmlns:ds="http://www.w3.org/2000/09/xmldsig#">

  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>

  <cbc:ID>F001-00000001</cbc:ID>
  <cbc:IssueDate>2026-01-17</cbc:IssueDate>
  <cbc:InvoiceTypeCode listAgencyName="PE:SUNAT" listName="Tipo de Documento" 
    listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo01" 
    listID="0101" 
    listSchemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo51" 
    name="Tipo de Operacion">01</cbc:InvoiceTypeCode>
  <cbc:Note languageLocaleID="1000">SON CIENTO DIECIOCHO CON 00/100 SOLES</cbc:Note>
  <cbc:DocumentCurrencyCode>PEN</cbc:DocumentCurrencyCode>

  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="6">20610588981</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>EMPRESA DEMO S.A.C.</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:ID>150101</cbc:ID>
        <cbc:StreetName>JR DEMO 123</cbc:StreetName>
        <cbc:CityName>LIMA</cbc:CityName>
        <cbc:CountrySubentity>LIMA</cbc:CountrySubentity>
        <cbc:District>LIMA</cbc:District>
        <cac:Country><cbc:IdentificationCode>PE</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>EMPRESA DEMO S.A.C.</cbc:RegistrationName>
        <cac:RegistrationAddress>
          <cbc:AddressTypeCode>0000</cbc:AddressTypeCode>
        </cac:RegistrationAddress>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>

  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="6">20123456789</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>CLIENTE DEMO S.A.C.</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>

  <cac:PaymentTerms>
    <cbc:ID>FormaPago</cbc:ID>
    <cbc:PaymentMeansID>Contado</cbc:PaymentMeansID>
  </cac:PaymentTerms>

  <!-- TaxTotal, LegalMonetaryTotal, InvoiceLine... -->
</Invoice>
```

---

## Pendientes

- [ ] **GRE (Guía de Remisión) - REQUIERE API REST** (ver nota importante abajo)
- [ ] Boleta (tipo 03) - Por probar
- [ ] Nota de Crédito - Por implementar
- [ ] Nota de Débito - Por implementar
- [ ] Resumen Diario - Por implementar
- [ ] Comunicación de Baja - Por implementar

---

## ⚠️ IMPORTANTE: GRE ya no usa SOAP

**Error 1085:** `Debe enviar las guías de remisión por el nuevo sistema de recepción de guías electrónicas`

A partir de 2024, SUNAT migró la recepción de Guías de Remisión Electrónicas (GRE) del sistema SOAP al **nuevo sistema API REST** con autenticación **OAuth2**.

### Nuevo Sistema GRE - Endpoints Oficiales

| Servicio | Endpoint |
|----------|----------|
| **OAuth2 Token** | `https://api-seguridad.sunat.gob.pe/v1/clientessol/{client_id}/oauth2/token` |
| **Envío GRE** | `https://api-cpe.sunat.gob.pe/v1/contribuyente/gem/comprobantes/{fileName}` |
| **Consulta Ticket** | `https://api-cpe.sunat.gob.pe/v1/contribuyente/gem/comprobantes/envios/{numTicket}` |

### ¿Cómo obtener el Client Secret?

Para usar la API REST de SUNAT, debes **registrar tu aplicación** en el Portal SOL:

1. **Ingresar al Portal SOL:** https://e-menu.sunat.gob.pe/cl-ti-itmenu/MenuInternet.htm
2. **Navegar a:** Empresas → Comprobantes de Pago → SEE - SOL → Opciones del Sistema
3. **Buscar:** "Generar Credenciales API" o "Configurar API REST"
4. **Registrar tu aplicación** - Obtendrás:
   - `Client ID` (generalmente tu RUC)
   - `Client Secret` (clave única generada por SUNAT)

5. **Configurar en `.env.sunat.local`:**
   ```env
   SUNAT_CLIENT_ID=20610588981
   SUNAT_CLIENT_SECRET=tu_client_secret_aqui
   ```

> **NOTA:** El Client Secret es diferente a la clave SOL. Se genera una única vez por empresa y sirve tanto para ambiente beta como producción.

### Archivos Creados para GRE API REST

| Archivo | Descripción |
|---------|-------------|
| `src/services/sunat/sunatOAuth2Client.js` | Cliente OAuth2 para obtener tokens |
| `src/services/sunat/sunatGreRestClient.js` | Cliente REST para envío de GRE |
| `src/services/sunat/sunatGreNativeClient.js` | Cliente SOAP nativo (legacy, solo consultas) |
| `scripts/sunat/test_gre_rest.js` | Test GRE con API REST + OAuth2 |

### Estado Actual

- ✅ **CPE (Factura)** - Funcionando via SOAP
- ✅ **Cliente OAuth2** - Implementado
- ✅ **Cliente REST GRE** - Implementado
- ⏳ **Credenciales API** - Pendiente obtener Client Secret desde Portal SOL

---

## Notas Técnicas

### SUNAT Beta vs Producción

| Aspecto | Beta | Producción |
|---------|------|------------|
| WSDL CPE | `https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService?wsdl` | `https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService?wsdl` |
| WSDL GRE | `https://e-beta.sunat.gob.pe/ol-ti-itemision-guia-gem-beta/billService?wsdl` | `https://e-guiaremision.sunat.gob.pe/ol-ti-itemision-guia-gem/billService?wsdl` |
| Comportamiento | Puede tener 401 intermitentes | Más estable |

### Catálogos SUNAT Importantes

- **Catálogo 01:** Tipo de Documento (01=Factura, 03=Boleta, 07=NC, 08=ND)
- **Catálogo 06:** Tipo Doc. Identidad (1=DNI, 6=RUC, 0=Sin documento)
- **Catálogo 51:** Tipo de Operación (0101=Venta interna, 0200=Exportación)
