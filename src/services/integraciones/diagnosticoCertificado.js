import forge from "node-forge";

/**
 * Estado del certificado digital `.p12` usado para firmar comprobantes.
 *
 * Vale la pena mirarlo aparte de las credenciales porque falla distinto: un
 * certificado vencido está perfectamente guardado y es legible — simplemente
 * SUNAT rechaza todo lo que firme, sin que nada en el sistema lo advierta antes.
 * Avisar con semanas de anticipación es la diferencia entre renovarlo tranquilo
 * y quedarse sin poder facturar un lunes.
 */

export const ESTADO_CERTIFICADO = {
  VIGENTE: "VIGENTE",
  POR_VENCER: "POR_VENCER",   // vence dentro de la ventana de aviso
  VENCIDO: "VENCIDO",
  AUN_NO_VIGENTE: "AUN_NO_VIGENTE",
  CLAVE_INCORRECTA: "CLAVE_INCORRECTA",
  ILEGIBLE: "ILEGIBLE",
  FALTA: "FALTA",
};

/** Días antes del vencimiento en los que se empieza a avisar. */
export const DIAS_AVISO_VENCIMIENTO = 30;

const soloNombre = (dn) =>
  dn?.attributes?.find((a) => a.shortName === "CN")?.value ||
  dn?.attributes?.find((a) => a.name === "commonName")?.value ||
  null;

/**
 * Inspecciona el certificado sin exponer la clave privada ni la contraseña.
 *
 * @param {string|null} p12Base64  Certificado en base64 (ya descifrado).
 * @param {string|null} password   Contraseña del .p12.
 * @param {Date} [ahora]           Inyectable para poder testear el vencimiento.
 * @returns {{estado: string, mensaje: string, titular: string|null,
 *            vigenteHasta: string|null, diasRestantes: number|null}}
 */
export function diagnosticarCertificado(p12Base64, password, ahora = new Date()) {
  if (!p12Base64 || String(p12Base64).trim() === "") {
    return armar(ESTADO_CERTIFICADO.FALTA, "No hay certificado digital cargado.");
  }

  let cert;
  try {
    const der = forge.util.decode64(String(p12Base64));
    const asn1 = forge.asn1.fromDer(der);
    const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, String(password ?? ""));
    cert = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag]?.[0]?.cert;
  } catch (error) {
    // node-forge no distingue por tipo: la contraseña equivocada llega como
    // fallo de MAC/integridad, que es el caso frecuente y accionable.
    const mensaje = String(error?.message || "");
    if (/mac|password|invalid password|integrity/i.test(mensaje)) {
      return armar(
        ESTADO_CERTIFICADO.CLAVE_INCORRECTA,
        "La contraseña del certificado no coincide. Vuelve a ingresarla."
      );
    }
    return armar(ESTADO_CERTIFICADO.ILEGIBLE, "El archivo del certificado no se puede leer. Vuelve a cargarlo.");
  }

  if (!cert) {
    return armar(ESTADO_CERTIFICADO.ILEGIBLE, "El archivo no contiene un certificado válido.");
  }

  const desde = cert.validity?.notBefore;
  const hasta = cert.validity?.notAfter;
  const titular = soloNombre(cert.subject);

  if (!(hasta instanceof Date) || isNaN(hasta.getTime())) {
    return armar(ESTADO_CERTIFICADO.ILEGIBLE, "El certificado no declara una fecha de vencimiento legible.", { titular });
  }

  const dias = Math.floor((hasta.getTime() - ahora.getTime()) / 86_400_000);
  const base = { titular, vigenteHasta: hasta.toISOString(), diasRestantes: dias };

  if (desde instanceof Date && ahora < desde) {
    return armar(ESTADO_CERTIFICADO.AUN_NO_VIGENTE, `Todavía no entra en vigencia (empieza el ${fecha(desde)}).`, base);
  }
  if (dias < 0) {
    return armar(ESTADO_CERTIFICADO.VENCIDO, `Venció el ${fecha(hasta)}. SUNAT rechazará todo lo que se firme con él.`, base);
  }
  if (dias <= DIAS_AVISO_VENCIMIENTO) {
    return armar(
      ESTADO_CERTIFICADO.POR_VENCER,
      `Vence en ${dias} día(s), el ${fecha(hasta)}. Conviene renovarlo antes.`,
      base
    );
  }

  return armar(ESTADO_CERTIFICADO.VIGENTE, `Vigente hasta el ${fecha(hasta)}.`, base);
}

const fecha = (d) => d.toISOString().slice(0, 10);

function armar(estado, mensaje, extra = {}) {
  return { estado, mensaje, titular: null, vigenteHasta: null, diasRestantes: null, ...extra };
}

export default { diagnosticarCertificado, ESTADO_CERTIFICADO, DIAS_AVISO_VENCIMIENTO };
