# Integración SUNAT (CPE / GRE)

Este repo actualmente usa un proveedor externo (`facturacion.apisperu.com`) desde el frontend.

Este documento describe el **nuevo módulo backend** para integrar directamente con los **servicios oficiales de SUNAT** (SOAP), empezando por CPE (Factura/Boleta) usando `billService`.

## Alcance actual

- Implementado:
  - Envío a SUNAT por SOAP: `sendBill`, `sendSummary`, `sendPack`, `getStatus`.
  - Empaquetado ZIP de XML.
  - Descompresión del CDR (ZIP → XML) para inspección.

- Pendiente (siguiente etapa):
  - Generación completa de XML UBL (Factura/Boleta/Resumen/Comunicaciones) según catálogos SUNAT.
  - Ajuste fino de validaciones UBL (CPE y GRE) hasta pasar todas las reglas/catálogos.

## Variables de entorno

Puedes partir de: `.env.sunat.example`.

Recomendación: guarda tus secretos en `.env.sunat.local` (ignorarlo en git) y ejecuta scripts apuntando a ese archivo con `DOTENV_CONFIG_PATH`.

Configura en tu `.env` del backend:

- `SUNAT_ENV` = `beta` | `prod` (default: `beta`)
- `SUNAT_BILL_WSDL_URL` (opcional)
  - Si no se define, usa por defecto:
    - beta: `https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService?wsdl`
    - prod: `https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService?wsdl`

- `SUNAT_GRE_WSDL_URL` (opcional)
  - Si no se define, usa por defecto:
    - beta: `https://e-beta.sunat.gob.pe/ol-ti-itemision-guia-gem-beta/billService?wsdl`
    - prod: `https://e-guiaremision.sunat.gob.pe/ol-ti-itemision-guia-gem/billService?wsdl`

Credenciales SOL:

- Opción A (recomendada):
  - `SUNAT_SOL_USERNAME` (username completo)
  - `SUNAT_SOL_PASS`

- Opción B:
  - `SUNAT_RUC`
  - `SUNAT_SOL_USER` (usuario SOL *sin* RUC)
  - `SUNAT_SOL_PASS`

> Nota: el código soporta ambas formas porque el formato exacto del username depende de la modalidad/configuración del contribuyente.

Certificado digital (firma):

- `SUNAT_CERT_P12_PATH` (ruta al archivo `.p12`) **o** `SUNAT_CERT_P12_BASE64`
- `SUNAT_CERT_P12_PASS`

> Nota: un `.pfx` funciona igual (es el mismo contenedor PKCS#12). Puedes apuntar `SUNAT_CERT_P12_PATH` a tu `.pfx`.

Puedes validar que tu `.pfx/.p12` y contraseña están bien con: `npm run sunat:cert:inspect`.

En Windows/PowerShell (usando `.env.sunat.local`):

- `$env:DOTENV_CONFIG_PATH='.env.sunat.local'; npm run sunat:cert:inspect`
- `$env:DOTENV_CONFIG_PATH='.env.sunat.local'; node scripts/sunat/test_cpe_beta.js`
- `$env:DOTENV_CONFIG_PATH='.env.sunat.local'; node scripts/sunat/test_gre_beta.js`

### Convertir `.pfx/.p12` a Base64 (Windows)

Si prefieres no manejar archivos en el servidor, puedes embebir el certificado en Base64 con:

- `powershell -ExecutionPolicy Bypass -File scripts/sunat/convert_pfx_to_base64.ps1 -In "C:\\ruta\\certificado.pfx" -Out "cert.base64.txt"`

Si te aparece un error del tipo `http://_vscodecontentref_/...` es porque se pegó un **link** (por ejemplo `[...] (http://...)`) en vez de la ruta del script. En ese caso, ejecuta el script escribiendo la ruta tal cual, sin corchetes ni links.

Alternativa recomendada (más simple, sin PowerShell):

- `npm run sunat:cert:to-base64 -- "C:\\ruta\\certificado.pfx" "cert.base64.txt"`

Si prefieres flags (ejecutando directo con Node):

- `node scripts/sunat/convert_pfx_to_base64.js --in "C:\\ruta\\certificado.pfx" --out "cert.base64.txt"`

Luego copia el contenido de `cert.base64.txt` a tu `.env` en:

- `SUNAT_CERT_P12_BASE64=...`

## Endpoints del backend

Todas las rutas requieren autenticación (`auth.middleware`).

- `GET /api/sunat/config`

- `POST /api/sunat/cpe/send-bill`
  - Body JSON:
    - `fileName` (sin extensión, ej: `20123456789-01-F001-00000001`)
    - `xml` (string XML) **o** `xmlBase64`
  - Respuesta:
    - `cdrZipBase64` (ZIP con CDR)
    - `cdrXmlBase64` (XML extraído del ZIP)

- `POST /api/sunat/cpe/send-summary`
  - Igual que arriba, devuelve `ticket`.

- `GET /api/sunat/cpe/status/:ticket`
  - Devuelve `statusCode`, `statusMessage` y si SUNAT lo adjunta, el CDR.

### Flujo A (Factura/Boleta completo: UBL + firma + envío)

Estos endpoints aceptan el mismo payload JSON que hoy arma el frontend para apisperu (`invoice/send`).

- `POST /api/sunat/cpe/invoice/build-sign`
  - Devuelve `xmlUnsignedBase64` y `xmlSignedBase64` para depurar.

- `POST /api/sunat/cpe/invoice/emit`
  - Construye XML UBL, firma con tu `.p12`, envía con `sendBill` y devuelve el CDR.

### GRE (Guía de Remisión Electrónica)

Estos endpoints aceptan el payload JSON que hoy arma el frontend para apisperu (`despatch/send`).

- `POST /api/sunat/gre/despatch/build-sign`
  - Devuelve `xmlUnsignedBase64` y `xmlSignedBase64`.

- `POST /api/sunat/gre/despatch/emit`
  - Construye XML UBL DespatchAdvice, firma, envía con `sendBill` del servicio GRE y devuelve el CDR.

## Cómo usarlo hoy

Opción 1 (recomendada para el flujo A):

1) Envía el payload JSON de Factura/Boleta a `POST /api/sunat/cpe/invoice/emit`.
2) Revisa el CDR (`cdrXmlBase64`).

Opción 2 (modo bajo nivel):

1) Genera el **XML válido** de Factura/Boleta/Resumen en tu app.
2) Llama a `send-bill` / `send-summary` / `getStatus`.

Cuando avancemos a la siguiente etapa, el backend podrá construir el XML UBL y firmarlo automáticamente desde los datos de `venta`/`guia_remision`.

## Pruebas rápidas contra beta (capturar CDR)

Se agregaron 2 scripts de prueba para ejecutar **sin frontend**, generar XML (unsigned/signed), enviar a SUNAT y **guardar el CDR** en disco.

Requisitos previos en tu `.env` (backend):

- `SUNAT_ENV=beta`
- `SUNAT_SOL_USERNAME` (o `SUNAT_RUC` + `SUNAT_SOL_USER`) y `SUNAT_SOL_PASS`
- `SUNAT_CERT_P12_PATH` (o `SUNAT_CERT_P12_BASE64`) y `SUNAT_CERT_P12_PASS`

Comandos:

- CPE (Factura/Boleta): `npm run sunat:test:cpe`
- GRE (Guía Remisión): `npm run sunat:test:gre`

Salida de artefactos:

- Se crean carpetas bajo `tmp/sunat-tests/` con:
  - `payload.json`
  - `xml-unsigned.xml`
  - `xml-signed.xml`
  - ZIP enviado (`<RUC>-<tipoDoc>-<serie>-<correlativo>.zip`)
  - `cdr.zip` y el XML extraído + `cdr-summary.json`

Opcional: puedes pasar un payload real (estilo apisperu) con `--payload`:

- `node scripts/sunat/test_cpe_beta.js --payload ruta/al/payload.json`
- `node scripts/sunat/test_gre_beta.js --payload ruta/al/payload.json`

### Modo prueba local (sin credenciales/cert real)

Si todavía no tienes **certificado digital `.p12`** o credenciales SOL, puedes validar que el pipeline **UBL → firma → ZIP** funciona ejecutando los scripts con:

- `SUNAT_DEV_SELF_SIGNED_CERT=1` (genera un certificado **autofirmado** solo para pruebas)
- `--skip-send` (no llama a SUNAT)

Ejemplos:

- `SUNAT_DEV_SELF_SIGNED_CERT=1 node scripts/sunat/test_cpe_beta.js --no-send`
- `SUNAT_DEV_SELF_SIGNED_CERT=1 node scripts/sunat/test_gre_beta.js --no-send`

> Nota: si ejecutas vía `npm run`, prefiere `--skip-send` porque `npm` puede interpretar flags del tipo `--no-*`.

Importante: este modo **no sirve para SUNAT** (SUNAT rechazará un certificado autofirmado). Para pruebas reales en beta/prod necesitas un certificado válido emitido por una entidad certificadora y tu usuario SOL.
