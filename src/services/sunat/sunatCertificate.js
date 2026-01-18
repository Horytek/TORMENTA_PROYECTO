import fs from 'fs/promises';
import forge from 'node-forge';

function normalizePem(pem) {
  if (!pem) return '';
  return pem.trim().replace(/\r\n/g, '\n');
}

export async function loadP12FromEnv() {
  const p12Path = (process.env.SUNAT_CERT_P12_PATH || '').trim();
  const p12Base64 = (process.env.SUNAT_CERT_P12_BASE64 || '').trim();
  const p12Password = process.env.SUNAT_CERT_P12_PASS || process.env.SUNAT_CERT_P12_PASSWORD || '';

  if (!p12Password) {
    throw new Error('Falta SUNAT_CERT_P12_PASS (password del .p12).');
  }

  let p12DerBuffer;
  if (p12Base64) {
    p12DerBuffer = Buffer.from(p12Base64, 'base64');
  } else if (p12Path) {
    p12DerBuffer = await fs.readFile(p12Path);
  } else {
    throw new Error('Falta SUNAT_CERT_P12_PATH o SUNAT_CERT_P12_BASE64.');
  }

  return { p12DerBuffer, p12Password };
}

export async function getSigningMaterialFromP12Env() {
  const { p12DerBuffer, p12Password } = await loadP12FromEnv();

  const p12Asn1 = forge.asn1.fromDer(p12DerBuffer.toString('binary'));
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, p12Password);

  // Private key
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
  if (!keyBag?.key) {
    throw new Error('No se encontró private key en el .p12.');
  }
  const privateKeyPem = normalizePem(forge.pki.privateKeyToPem(keyBag.key));

  // Certificate
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const certBag = certBags[forge.pki.oids.certBag]?.[0];
  if (!certBag?.cert) {
    throw new Error('No se encontró certificado en el .p12.');
  }
  const certificatePem = normalizePem(forge.pki.certificateToPem(certBag.cert));

  return { privateKeyPem, certificatePem };
}

function generateSelfSignedSigningMaterial() {
  // SOLO para desarrollo/pruebas locales: SUNAT no aceptará certificados autofirmados.
  const keys = forge.pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001 });
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = String(Date.now());
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  const attrs = [
    { name: 'commonName', value: 'SUNAT-DEV-SELF-SIGNED' },
    { name: 'countryName', value: 'PE' },
    { shortName: 'ST', value: 'LIMA' },
    { name: 'localityName', value: 'LIMA' },
    { name: 'organizationName', value: 'DEV' },
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.setExtensions([
    { name: 'basicConstraints', cA: false },
    { name: 'keyUsage', digitalSignature: true, nonRepudiation: true, keyEncipherment: false },
    { name: 'extKeyUsage', clientAuth: true },
    { name: 'subjectKeyIdentifier' },
  ]);

  cert.sign(keys.privateKey, forge.md.sha256.create());

  return {
    privateKeyPem: normalizePem(forge.pki.privateKeyToPem(keys.privateKey)),
    certificatePem: normalizePem(forge.pki.certificateToPem(cert)),
  };
}

export async function getSigningMaterialFromEnv({ allowDevSelfSigned = false } = {}) {
  try {
    return await getSigningMaterialFromP12Env();
  } catch (e) {
    const enabled = String(process.env.SUNAT_DEV_SELF_SIGNED_CERT || '').trim() === '1';
    if (allowDevSelfSigned && enabled) {
      return generateSelfSignedSigningMaterial();
    }
    throw e;
  }
}

/**
 * Extraer material de firma desde config obtenida de BD
 * @param {Object} config - Configuración SUNAT con certificate.p12Buffer y certificate.password
 * @returns {{ privateKeyPem: string, certificatePem: string }}
 */
export function getSigningMaterialFromConfig(config) {
  const { certificate } = config || {};

  if (!certificate?.p12Buffer) {
    throw new Error('Certificado no configurado para esta empresa.');
  }
  if (!certificate?.password) {
    throw new Error('Password del certificado no configurado.');
  }

  const p12DerBuffer = certificate.p12Buffer;
  const p12Password = certificate.password;

  const p12Asn1 = forge.asn1.fromDer(p12DerBuffer.toString('binary'));
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, p12Password);

  // Private key
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
  if (!keyBag?.key) {
    throw new Error('No se encontró private key en el certificado.');
  }
  const privateKeyPem = normalizePem(forge.pki.privateKeyToPem(keyBag.key));

  // Certificate
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const certBag = certBags[forge.pki.oids.certBag]?.[0];
  if (!certBag?.cert) {
    throw new Error('No se encontró certificado público en el .p12.');
  }
  const certificatePem = normalizePem(forge.pki.certificateToPem(certBag.cert));

  return { privateKeyPem, certificatePem };
}

