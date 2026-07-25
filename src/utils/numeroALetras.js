/**
 * Conversión de monto a letras para la leyenda 1000 del UBL ("MONTO EN LETRAS"),
 * que SUNAT exige en todo comprobante.
 *
 * Existe porque el flujo legacy arma la leyenda mal: `client/src/services/
 * ventas.services.js` emite `SON 118.00 CON 00/100 SOLES` — el NÚMERO en vez de
 * las palabras — y además fija siempre "00/100" ignorando los céntimos reales.
 */

const UNIDADES = [
  "", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE",
  "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS", "DIECISIETE",
  "DIECIOCHO", "DIECINUEVE", "VEINTE", "VEINTIUNO", "VEINTIDÓS", "VEINTITRÉS",
  "VEINTICUATRO", "VEINTICINCO", "VEINTISÉIS", "VEINTISIETE", "VEINTIOCHO", "VEINTINUEVE",
];

const DECENAS = [
  "", "", "", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA",
];

// Irregulares del español: no son "cincocientos" ni "sietecientos".
const CENTENAS = [
  "", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS",
  "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS",
];

const NOMBRE_MONEDA = {
  PEN: "SOLES",
  USD: "DÓLARES AMERICANOS",
  EUR: "EUROS",
};

/** Convierte 0-999 a palabras. */
function convertirGrupo(n) {
  if (n === 0) return "";
  if (n === 100) return "CIEN";

  const centena = Math.floor(n / 100);
  const resto = n % 100;

  const partes = [];
  if (centena > 0) partes.push(CENTENAS[centena]);

  if (resto > 0) {
    if (resto < 30) {
      partes.push(UNIDADES[resto]);
    } else {
      const decena = Math.floor(resto / 10);
      const unidad = resto % 10;
      partes.push(unidad > 0 ? `${DECENAS[decena]} Y ${UNIDADES[unidad]}` : DECENAS[decena]);
    }
  }

  return partes.join(" ");
}

/**
 * Parte entera a palabras. Apoca "UNO" → "UN" delante de MIL/MILLONES,
 * que es como se dice en español ("VEINTIÚN MIL", no "VEINTIUNO MIL").
 */
function enteroALetras(entero) {
  if (entero === 0) return "CERO";

  const millones = Math.floor(entero / 1_000_000);
  const miles = Math.floor((entero % 1_000_000) / 1000);
  const resto = entero % 1000;

  const partes = [];

  if (millones > 0) {
    const texto = apocopar(convertirGrupo(millones % 1000), millones);
    // Soporta hasta miles de millones reutilizando la misma lógica.
    const millonesAltos = Math.floor(millones / 1000);
    if (millonesAltos > 0) {
      partes.push(`${apocopar(convertirGrupo(millonesAltos), millonesAltos)} MIL`);
    }
    if (millones % 1000 > 0) partes.push(texto);
    partes.push(millones === 1 ? "MILLÓN" : "MILLONES");
  }

  if (miles > 0) {
    // "MIL" solo, nunca "UN MIL".
    if (miles !== 1) partes.push(apocopar(convertirGrupo(miles), miles));
    partes.push("MIL");
  }

  if (resto > 0) partes.push(convertirGrupo(resto));

  return partes.join(" ").replace(/\s+/g, " ").trim();
}

/** "UNO" → "UN", "VEINTIUNO" → "VEINTIÚN" cuando acompaña a MIL/MILLONES. */
function apocopar(texto, valor) {
  if (valor % 10 !== 1) return texto;
  if (texto.endsWith("VEINTIUNO")) return texto.replace(/VEINTIUNO$/, "VEINTIÚN");
  if (texto.endsWith("UNO")) return texto.replace(/UNO$/, "UN");
  return texto;
}

/**
 * Monto a la leyenda que espera SUNAT.
 * @example numeroALetras(118) → "CIENTO DIECIOCHO CON 00/100 SOLES"
 * @example numeroALetras(1234.56) → "MIL DOSCIENTOS TREINTA Y CUATRO CON 56/100 SOLES"
 */
export function numeroALetras(monto, moneda = "PEN") {
  const numero = Number(monto);
  if (!Number.isFinite(numero) || numero < 0) {
    throw new Error(`numeroALetras: monto inválido (${monto}).`);
  }

  // Redondear a céntimos ANTES de partir, si no 0.999 daría "CERO CON 99/100".
  const enCentimos = Math.round(numero * 100);
  const entero = Math.floor(enCentimos / 100);
  const centimos = enCentimos % 100;

  const letras = enteroALetras(entero);
  const centimosTexto = String(centimos).padStart(2, "0");
  const nombreMoneda = NOMBRE_MONEDA[moneda] || moneda;

  return `${letras} CON ${centimosTexto}/100 ${nombreMoneda}`;
}

export default numeroALetras;
