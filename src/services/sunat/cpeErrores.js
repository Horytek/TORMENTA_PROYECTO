/**
 * Errores del subsistema de comprobantes electrónicos, con CATEGORÍA.
 *
 * La categoría es lo que decide qué hacer después: no es lo mismo un rechazo
 * tributario (nunca reintentar: hay que corregir datos) que una caída de red
 * (reintentar), o un timeout después de haber enviado (jamás reenviar a ciegas:
 * el comprobante puede existir ya en SUNAT y se duplicaría).
 */

export const CATEGORIAS = {
  CONFIG: "CONFIG",             // faltan credenciales, certificado o ubigeo → no reintentable
  VALIDACION: "VALIDACION",     // datos de la venta inválidos → no reintentable
  RECHAZO: "RECHAZO",           // SUNAT rechazó (2000-3999) → no reintentable
  RED: "RED",                   // no se llegó a SUNAT → reintentable
  SUNAT_SISTEMA: "SUNAT_SISTEMA", // SUNAT falló (0100-1999) → reintentable
  INCIERTO: "INCIERTO",         // se envió pero no se sabe el resultado → consultar, NO reenviar
  DESCONOCIDO: "DESCONOCIDO",
};

/** Categorías desde las que es seguro reintentar automáticamente. */
export const CATEGORIAS_REINTENTABLES = new Set([CATEGORIAS.RED, CATEGORIAS.SUNAT_SISTEMA]);

export class ErrorCpe extends Error {
  constructor(codigo, mensaje, { categoria = CATEGORIAS.DESCONOCIDO, detalle = null, causa = null } = {}) {
    super(mensaje);
    this.name = "ErrorCpe";
    this.codigo = codigo;          // p. ej. CPE_CLIENTE_INVALIDO (viaja al frontend)
    this.categoria = categoria;
    this.detalle = detalle;
    this.causa = causa;
  }
}

const ERRORES_RED = /ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|EPIPE|socket hang up|network|timeout/i;

/**
 * Clasifica un error crudo (de red, SOAP o del propio flujo) para decidir el
 * estado a persistir y si se puede reintentar.
 *
 * @param {Error} error
 * @param {{ yaSeEnvio?: boolean }} contexto  `yaSeEnvio` = la petición salió y no
 *        se recibió respuesta legible → el resultado es INCIERTO, no un fallo limpio.
 */
export function categorizarErrorSunat(error, { yaSeEnvio = false } = {}) {
  if (error instanceof ErrorCpe) return error.categoria;

  const mensaje = String(error?.message || error || "");

  // SOAP Fault de negocio: SUNAT contesta con un código de 4 dígitos.
  const codigoSunat = /\b(\d{4})\b/.exec(mensaje)?.[1];
  if (codigoSunat) {
    const codigo = Number(codigoSunat);
    if (codigo >= 100 && codigo <= 1999) return CATEGORIAS.SUNAT_SISTEMA;
    if (codigo >= 2000 && codigo <= 3999) return CATEGORIAS.RECHAZO;
  }

  if (ERRORES_RED.test(mensaje)) {
    // Si la petición ya había salido, un corte de red NO significa "no se envió".
    return yaSeEnvio ? CATEGORIAS.INCIERTO : CATEGORIAS.RED;
  }

  return yaSeEnvio ? CATEGORIAS.INCIERTO : CATEGORIAS.DESCONOCIDO;
}

export default { ErrorCpe, CATEGORIAS, categorizarErrorSunat };
