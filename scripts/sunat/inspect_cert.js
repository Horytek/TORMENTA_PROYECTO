import 'dotenv/config';

import forge from 'node-forge';

import { loadP12FromEnv } from '../../src/services/sunat/sunatCertificate.js';

function dnToString(dn) {
  if (!dn) return '';
  return dn.attributes
    .map((a) => `${a.shortName || a.name}=${a.value}`)
    .filter(Boolean)
    .join(', ');
}

async function main() {
  const { p12DerBuffer, p12Password } = await loadP12FromEnv();

  const p12Asn1 = forge.asn1.fromDer(p12DerBuffer.toString('binary'));
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, p12Password);

  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];

  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const certBag = certBags[forge.pki.oids.certBag]?.[0];

  if (!keyBag?.key) throw new Error('No se encontró private key en el .pfx/.p12.');
  if (!certBag?.cert) throw new Error('No se encontró certificado en el .pfx/.p12.');

  const cert = certBag.cert;

  console.log('OK: Se pudo leer el .pfx/.p12');
  console.log('Subject:', dnToString(cert.subject));
  console.log('Issuer :', dnToString(cert.issuer));
  console.log('Válido desde:', cert.validity.notBefore.toISOString());
  console.log('Válido hasta:', cert.validity.notAfter.toISOString());
  console.log('Serial:', cert.serialNumber);
}

main().catch((err) => {
  console.error('Error inspeccionando certificado:', err?.message || err);
  process.exitCode = 1;
});
