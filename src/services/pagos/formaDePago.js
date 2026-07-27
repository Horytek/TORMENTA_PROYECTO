/**
 * Lectura del campo libre `formadepago` / `metodo_pago`.
 *
 * Ese `varchar` acumuló tres formatos distintos a lo largo del tiempo, y en los
 * datos reales conviven los tres:
 *
 *   "EFECTIVO"                       → un solo método, sin monto
 *   "EFECTIVO, PLIN"                 → varios métodos, montos desconocidos
 *   "EFECTIVO:80.00"                 → un método con su monto
 *   "EFECTIVO:100.00|YAPE:20.00"     → varios métodos, cada uno con su monto
 *
 * O sea: una venta puede tener VARIOS pagos, cada uno con método e importe.
 * Eso es una relación uno-a-muchos metida en un campo de texto, y es la razón
 * por la que hoy no se puede cuadrar una caja: para saber cuánto efectivo
 * debería haber en el cajón hay que separar el efectivo del resto, y con este
 * formato no se puede hacer en SQL de forma confiable.
 *
 * Función pura: no toca BD. Se usa para migrar lo viejo y para validar lo nuevo.
 */

/** Códigos del catálogo. `efectivo: true` es lo único que se cuenta a mano al cerrar caja. */
export const METODOS = {
  EFECTIVO: { codigo: "EFECTIVO", nombre: "Efectivo", efectivo: true },
  YAPE: { codigo: "YAPE", nombre: "Yape", efectivo: false },
  PLIN: { codigo: "PLIN", nombre: "Plin", efectivo: false },
  TARJETA: { codigo: "TARJETA", nombre: "Tarjeta", efectivo: false },
  TRANSFERENCIA: { codigo: "TRANSFERENCIA", nombre: "Transferencia", efectivo: false },
  OTRO: { codigo: "OTRO", nombre: "Otro", efectivo: false },
};

/** Variantes encontradas en los datos → código del catálogo. */
const SINONIMOS = {
  EFECTIVO: "EFECTIVO", CASH: "EFECTIVO", CONTADO: "EFECTIVO",
  YAPE: "YAPE", PLIN: "PLIN",
  VISA: "TARJETA", MASTERCARD: "TARJETA", MASTER: "TARJETA", TARJETA: "TARJETA",
  POS: "TARJETA", CREDITO: "TARJETA", DEBITO: "TARJETA", AMEX: "TARJETA",
  TRANSFERENCIA: "TRANSFERENCIA", DEPOSITO: "TRANSFERENCIA", BCP: "TRANSFERENCIA",
  INTERBANK: "TRANSFERENCIA", BBVA: "TRANSFERENCIA",
};

/** Normaliza un nombre suelto al código del catálogo. Lo no reconocido es OTRO. */
export function normalizarMetodo(texto) {
  const limpio = String(texto ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, ""); // quita tildes: "CRÉDITO" → "CREDITO"
  if (!limpio) return null;
  return SINONIMOS[limpio] ?? METODOS.OTRO.codigo;
}

const aNumero = (v) => {
  // Sin `replace(",", ".")` a propósito: en estos datos la coma SEPARA pagos
  // ("EFECTIVO, PLIN") y los decimales van con punto ("EFECTIVO:80.00").
  // Aceptar la coma como decimal volvería ambiguo el texto y podría partir un
  // importe en dos pagos falsos.
  const n = Number(String(v).trim());
  return Number.isFinite(n) && n >= 0 ? n : null;
};

/**
 * Descompone el texto libre en pagos individuales.
 *
 * @param {string} texto  Valor crudo de `formadepago` / `metodo_pago`.
 * @param {number|null} totalVenta  Total de la venta, para repartir cuando el
 *        texto no trae montos. Sin él, los montos quedan en null.
 * @returns {{pagos: Array<{metodo:string, monto:number|null}>, montosInferidos:boolean, textoOriginal:string}}
 *          `montosInferidos: true` avisa que los importes no venían en el dato
 *          y se repartieron — sirven para cuadrar, pero no son un hecho.
 */
export function parsearFormaDePago(texto, totalVenta = null) {
  const original = String(texto ?? "").trim();
  if (!original) return { pagos: [], montosInferidos: false, textoOriginal: original };

  // Separadores usados en los datos: "|" entre pagos con monto, "," entre
  // métodos sueltos. Se aceptan los dos a la vez.
  const partes = original.split(/[|,;]+/).map((p) => p.trim()).filter(Boolean);

  const pagos = [];
  for (const parte of partes) {
    const [nombre, montoTexto] = parte.split(":");
    const metodo = normalizarMetodo(nombre);
    if (!metodo) continue;
    pagos.push({ metodo, monto: montoTexto === undefined ? null : aNumero(montoTexto) });
  }

  if (pagos.length === 0) return { pagos: [], montosInferidos: false, textoOriginal: original };

  // Si ningún pago trae monto pero se conoce el total, se reparte. Con un solo
  // método el reparto es exacto; con varios es un supuesto y se marca.
  const sinMonto = pagos.filter((p) => p.monto === null);
  const total = aNumero(totalVenta);
  let montosInferidos = false;

  if (sinMonto.length > 0 && total !== null) {
    const asignado = pagos.reduce((acc, p) => acc + (p.monto ?? 0), 0);
    const resto = Math.max(0, total - asignado);
    const cuota = Math.round((resto / sinMonto.length) * 100) / 100;
    sinMonto.forEach((p, i) => {
      // El último absorbe la diferencia del redondeo para que la suma cuadre.
      p.monto = i === sinMonto.length - 1
        ? Math.round((resto - cuota * (sinMonto.length - 1)) * 100) / 100
        : cuota;
    });
    montosInferidos = true;
  }

  return { pagos, montosInferidos, textoOriginal: original };
}

/** Suma de los pagos en efectivo. Es lo que debería estar físicamente en el cajón. */
export function totalEfectivo(pagos) {
  return Math.round(
    (pagos ?? [])
      .filter((p) => METODOS[p.metodo]?.efectivo)
      .reduce((acc, p) => acc + (Number(p.monto) || 0), 0) * 100
  ) / 100;
}

/** true si el desglose cuadra con el total de la venta, con tolerancia de un céntimo. */
export function cuadra(pagos, totalVenta, tolerancia = 0.01) {
  const total = aNumero(totalVenta);
  if (total === null) return false;
  const suma = (pagos ?? []).reduce((acc, p) => acc + (Number(p.monto) || 0), 0);
  // Se compara en céntimos enteros: en coma flotante |99.99 - 100| da
  // 0.010000000000005, que superaría una tolerancia de 0.01 por nada.
  const diferencia = Math.abs(Math.round(suma * 100) - Math.round(total * 100));
  return diferencia <= Math.round(tolerancia * 100);
}

export default { METODOS, normalizarMetodo, parsearFormaDePago, totalEfectivo, cuadra };
