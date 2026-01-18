import { SignedXml } from 'xml-crypto';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

function ensureUblSignatureContainer({ xml, rootName = 'Invoice' } = {}) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const root = doc.documentElement;
  if (!root || root.nodeName !== rootName) {
    // No bloqueamos por prefijo/namespace; solo validamos que exista raíz.
  }

  // UBL suele usar ext:UBLExtensions al inicio.
  const ublExtTag = 'ext:UBLExtensions';
  let ublExt = Array.from(root.childNodes).find((n) => n.nodeType === 1 && n.nodeName === ublExtTag);

  if (!ublExt) {
    ublExt = doc.createElement(ublExtTag);
    const ublExtension = doc.createElement('ext:UBLExtension');
    const extensionContent = doc.createElement('ext:ExtensionContent');
    ublExtension.appendChild(extensionContent);
    ublExt.appendChild(ublExtension);

    // Insertar al inicio del root
    const firstElementChild = Array.from(root.childNodes).find((n) => n.nodeType === 1);
    if (firstElementChild) root.insertBefore(ublExt, firstElementChild);
    else root.appendChild(ublExt);
  }

  let firstUblExtension = Array.from(ublExt.childNodes).find((n) => n.nodeType === 1 && n.nodeName === 'ext:UBLExtension');
  if (!firstUblExtension) {
    firstUblExtension = doc.createElement('ext:UBLExtension');
    ublExt.appendChild(firstUblExtension);
  }

  let extensionContent = Array.from(firstUblExtension.childNodes).find(
    (n) => n.nodeType === 1 && n.nodeName === 'ext:ExtensionContent'
  );
  if (!extensionContent) {
    extensionContent = doc.createElement('ext:ExtensionContent');
    firstUblExtension.appendChild(extensionContent);
  }

  return { doc, root, extensionContent };
}

export function signUblXml({ xml, privateKeyPem, certificatePem, referenceXPath } = {}) {
  if (!xml) throw new Error('xml es requerido');
  if (!privateKeyPem) throw new Error('privateKeyPem es requerido');
  if (!certificatePem) throw new Error('certificatePem es requerido');

  const { doc } = ensureUblSignatureContainer({ xml });
  const xmlWithExtensions = new XMLSerializer().serializeToString(doc);

  const sig = new SignedXml({
    privateKey: privateKeyPem,
    publicCert: certificatePem,
    canonicalizationAlgorithm: 'http://www.w3.org/2001/10/xml-exc-c14n#',
    signatureAlgorithm: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
  });

  // Referencia al documento completo (URI vacío).
  // Importante: NO usar referencia por XPath aquí, porque xml-crypto suele inyectar un atributo Id
  // en el nodo referenciado y SUNAT rechaza atributos no definidos en el esquema UBL (ej. Invoice@Id).
  // `referenceXPath` se deja por compatibilidad, pero se ignora deliberadamente.
  sig.addReference({
    // xml-crypto (según versión) requiere un XPath; usamos el root.
    xpath: '/*',
    uri: '',
    isEmptyUri: true,
    transforms: [
      'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
      'http://www.w3.org/2001/10/xml-exc-c14n#',
    ],
    digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256',
  });

  // Insertar la firma dentro de ext:ExtensionContent
  sig.computeSignature(xmlWithExtensions, {
    location: {
      reference: "//*[local-name()='ExtensionContent']",
      action: 'append',
    },
    prefix: 'ds',
  });

  return sig.getSignedXml();
}
