/**
 * Clasificación del estado de una credencial guardada.
 *
 * Existe porque diagnosticar esto a mano cuesta horas: en el subsistema SUNAT
 * nos encontramos con credenciales que descifraban bien pero cuyo contenido era
 * la MÁSCARA de la interfaz (`••••••••••••••••`) — alguien guardó el valor
 * mostrado en vez del real —, y con filas cifradas con el esquema anterior al
 * formato `v1:iv:cipher`, que ya no se pueden leer. Las dos fallan igual de
 * silenciosamente: el sistema "tiene credenciales" y SUNAT contesta 401.
 *
 * Funciones puras: reciben el valor crudo (y un descifrador inyectado) y
 * devuelven un diagnóstico. No tocan BD ni red.
 */

export const ESTADO_CREDENCIAL = {
  OK: "OK",
  FALTA: "FALTA",                     // no existe la fila
  VACIA: "VACIA",                     // existe pero sin contenido
  FORMATO_ANTIGUO: "FORMATO_ANTIGUO", // cifrada con el esquema previo a v1: → hay que reingresarla
  ILEGIBLE: "ILEGIBLE",               // no descifra con la clave actual
  ENMASCARADA: "ENMASCARADA",         // se guardó la máscara de la UI en vez del valor real
};

/** Explicación en español para el usuario, sin jerga ni detalles internos. */
export const EXPLICACION_ESTADO = {
  [ESTADO_CREDENCIAL.OK]: "Configurada correctamente.",
  [ESTADO_CREDENCIAL.FALTA]: "No está configurada todavía.",
  [ESTADO_CREDENCIAL.VACIA]: "Está registrada pero sin contenido. Vuelve a ingresarla.",
  [ESTADO_CREDENCIAL.FORMATO_ANTIGUO]:
    "Se guardó con el esquema de cifrado anterior y ya no puede leerse. Vuelve a ingresarla.",
  [ESTADO_CREDENCIAL.ILEGIBLE]:
    "No se puede descifrar con la clave actual del sistema. Vuelve a ingresarla.",
  [ESTADO_CREDENCIAL.ENMASCARADA]:
    "Se guardó el texto oculto del formulario (••••) en vez del valor real. Vuelve a ingresarla.",
};

/** Estados que impiden operar: cualquiera distinto de OK necesita acción. */
export const ESTADOS_CON_PROBLEMA = new Set(
  Object.values(ESTADO_CREDENCIAL).filter((e) => e !== ESTADO_CREDENCIAL.OK)
);

/** Caracteres que las UIs usan para ocultar un secreto. */
const SOLO_MASCARA = /^[•*·●•·●\s]+$/;

/**
 * Diagnostica una credencial sin exponer nunca su valor.
 *
 * @param {string|null|undefined} valorCifrado  Lo guardado en `clave.valor`.
 * @param {(texto: string) => string} descifrar Función de descifrado inyectada
 *        (se inyecta para poder testear sin depender de la clave de entorno).
 * @returns {{estado: string, mensaje: string, longitud: number|null}}
 *          `longitud` es la del valor descifrado — sirve para distinguir
 *          "parece una contraseña" de "quedó un residuo", sin revelar el valor.
 */
export function diagnosticarCredencial(valorCifrado, descifrar) {
  const crudo = valorCifrado === null || valorCifrado === undefined ? "" : String(valorCifrado);

  if (crudo.trim() === "") {
    return resultado(valorCifrado === null || valorCifrado === undefined
      ? ESTADO_CREDENCIAL.FALTA
      : ESTADO_CREDENCIAL.VACIA);
  }

  // El esquema vigente es `v1:iv:cipher`; lo anterior no se puede recuperar.
  if (!crudo.startsWith("v1:")) return resultado(ESTADO_CREDENCIAL.FORMATO_ANTIGUO);

  let claro;
  try {
    claro = descifrar(crudo);
  } catch {
    // No se propaga el error real: puede describir el esquema de cifrado.
    return resultado(ESTADO_CREDENCIAL.ILEGIBLE);
  }

  const texto = String(claro ?? "");
  if (texto.trim() === "") return resultado(ESTADO_CREDENCIAL.VACIA);
  if (SOLO_MASCARA.test(texto)) return resultado(ESTADO_CREDENCIAL.ENMASCARADA, texto.length);

  return resultado(ESTADO_CREDENCIAL.OK, texto.length);
}

function resultado(estado, longitud = null) {
  return { estado, mensaje: EXPLICACION_ESTADO[estado], longitud };
}

/**
 * Resume varios diagnósticos en el estado de la integración completa.
 * `requeridas` son las claves sin las cuales la integración no funciona; una
 * opcional en mal estado degrada pero no bloquea.
 */
export function resumirIntegracion(diagnosticos, requeridas = []) {
  const entradas = Object.entries(diagnosticos);
  const enProblema = entradas.filter(([, d]) => ESTADOS_CON_PROBLEMA.has(d.estado));

  if (enProblema.length === 0) {
    return { estado: "OPERATIVO", faltantes: [], mensaje: "Todo configurado y legible." };
  }

  const requeridasEnProblema = enProblema.filter(([clave]) => requeridas.includes(clave));
  if (requeridasEnProblema.length > 0) {
    return {
      estado: "NO_CONFIGURADO",
      faltantes: requeridasEnProblema.map(([clave]) => clave),
      mensaje: `Faltan ${requeridasEnProblema.length} dato(s) obligatorio(s) para operar.`,
    };
  }

  return {
    estado: "DEGRADADO",
    faltantes: enProblema.map(([clave]) => clave),
    mensaje: "Funciona, pero hay datos opcionales pendientes.",
  };
}

export default { diagnosticarCredencial, resumirIntegracion, ESTADO_CREDENCIAL, ESTADOS_CON_PROBLEMA };
