/**
 * Lectura y clasificación del CDR (Constancia de Recepción) de SUNAT.
 *
 * El CDR es la respuesta OFICIAL: es lo único que determina si un comprobante
 * fue aceptado o rechazado. El flujo legacy no lo mira — considera éxito
 * cualquier HTTP 200 —, así que un rechazo terminaba marcado como aceptado.
 *
 * `parseCdrSummary` se movió acá desde `sunat.controller.js` (que lo re-exporta)
 * para poder reusarlo desde el servicio de emisión.
 */

/** Estados posibles de un comprobante electrónico (tabla `comprobante_electronico`). */
export const ESTADOS_CPE = {
  PENDIENTE: "PENDIENTE",
  ENVIANDO: "ENVIANDO",
  ACEPTADO: "ACEPTADO",
  ACEPTADO_CON_OBS: "ACEPTADO_CON_OBS",
  RECHAZADO: "RECHAZADO",
  INCIERTO: "INCIERTO",
  ERROR_ENVIO: "ERROR_ENVIO",
  ERROR_CONFIG: "ERROR_CONFIG",
  ACEPTADO_SIN_RESPALDO: "ACEPTADO_SIN_RESPALDO",
  ANULADO: "ANULADO",
};

/** Estados terminales: un reintento sobre ellos es un no-op, nunca se reenvía. */
export const ESTADOS_ACEPTADOS = new Set([
  ESTADOS_CPE.ACEPTADO,
  ESTADOS_CPE.ACEPTADO_CON_OBS,
  ESTADOS_CPE.ACEPTADO_SIN_RESPALDO,
]);

/** Estados desde los que sí se puede reintentar el envío. */
export const ESTADOS_REINTENTABLES = new Set([
  ESTADOS_CPE.PENDIENTE,
  ESTADOS_CPE.ERROR_ENVIO,
  ESTADOS_CPE.ERROR_CONFIG,
]);

/**
 * Extrae los datos relevantes del XML del CDR.
 * Se mantiene con regex (no parser XML) para no agregar dependencias y porque
 * la estructura del CDR es estable y plana en los campos que interesan.
 */
export function parseCdrSummary(cdrXml) {
  if (!cdrXml) return null;
  const responseCode = /<cbc:ResponseCode>([^<]+)<\/cbc:ResponseCode>/i.exec(cdrXml)?.[1] ?? null;
  const description = /<cbc:Description>([\s\S]*?)<\/cbc:Description>/i.exec(cdrXml)?.[1]?.trim() ?? null;
  const notes = Array.from(cdrXml.matchAll(/<cbc:Note>([\s\S]*?)<\/cbc:Note>/gi)).map((m) => m[1].trim());
  return { responseCode, description, notes };
}

/**
 * Traduce el ResponseCode del CDR al estado del comprobante.
 *
 * Rangos oficiales de SUNAT:
 *   0          → aceptado (si trae <cbc:Note>, es aceptado CON OBSERVACIONES)
 *   0100-1999  → error de SUNAT (su sistema): el comprobante NO se procesó → reintentable
 *   2000-3999  → error del contribuyente: rechazo definitivo, no reintentar
 *   4000+      → observaciones (llegan como Note, no como ResponseCode)
 */
export function clasificarResponseCode(responseCode, notas = []) {
  const codigo = Number(responseCode);

  if (!Number.isFinite(codigo)) {
    // Sin código legible no se puede afirmar nada: se trata como incierto.
    return {
      estado: ESTADOS_CPE.INCIERTO,
      categoria: "INCIERTO",
      reintentable: false,
      motivo: "El CDR no trae un ResponseCode legible.",
    };
  }

  if (codigo === 0) {
    const conObservaciones = Array.isArray(notas) && notas.length > 0;
    return {
      estado: conObservaciones ? ESTADOS_CPE.ACEPTADO_CON_OBS : ESTADOS_CPE.ACEPTADO,
      categoria: null,
      reintentable: false,
      motivo: conObservaciones ? "Aceptado con observaciones." : "Aceptado por SUNAT.",
    };
  }

  if (codigo >= 100 && codigo <= 1999) {
    return {
      estado: ESTADOS_CPE.INCIERTO,
      categoria: "SUNAT_SISTEMA",
      reintentable: true,
      motivo: "Error del sistema de SUNAT: el comprobante puede no haberse procesado.",
    };
  }

  if (codigo >= 2000 && codigo <= 3999) {
    return {
      estado: ESTADOS_CPE.RECHAZADO,
      categoria: "RECHAZO",
      reintentable: false,
      motivo: "Rechazado por SUNAT: hay que corregir los datos y emitir con otro correlativo.",
    };
  }

  // 4000+ no debería llegar como ResponseCode, pero si llega es una observación.
  return {
    estado: ESTADOS_CPE.ACEPTADO_CON_OBS,
    categoria: null,
    reintentable: false,
    motivo: "Aceptado con observaciones.",
  };
}

export default { parseCdrSummary, clasificarResponseCode, ESTADOS_CPE };
