/**
 * Costo promedio ponderado por SKU.
 *
 * El sistema no asume de dónde viene el costo: hay tenants que mandan a
 * fabricar, otros que compran prenda terminada y otros que producen. Lo único
 * común a los tres es "entraron N unidades a un costo unitario X". El origen
 * (taller, proveedor, producción) es metadato; el cálculo es el mismo.
 *
 * Fórmula (NIC 2, promedio ponderado):
 *   nuevo = (stock × costoActual + cantidad × costoEntrada) / (stock + cantidad)
 *
 * Funciones puras: no tocan BD. Reciben el estado actual y devuelven el nuevo.
 */

/** Decimales con los que se guarda el costo. Más que los 2 del precio porque
 *  el promedio arrastra fracciones que, redondeadas a céntimos en cada ingreso,
 *  desvían el valor del inventario con el tiempo. */
export const DECIMALES_COSTO = 6;

export const MOTIVO = {
  PRIMER_COSTO: "PRIMER_COSTO",         // el SKU no tenía costo
  PROMEDIO: "PROMEDIO",                 // se ponderó contra el stock existente
  SIN_STOCK: "SIN_STOCK",               // no había stock: el costo entrante manda
  STOCK_SIN_COSTO: "STOCK_SIN_COSTO",   // había stock pero sin costo conocido → estimado
};

const redondear = (valor, decimales = DECIMALES_COSTO) => {
  const factor = 10 ** decimales;
  return Math.round((Number(valor) + Number.EPSILON) * factor) / factor;
};

/**
 * Ojo con `Number()`: convierte null, undefined y "" en 0 — y aquí un 0 no es
 * lo mismo que "no sé". Un costo desconocido tomado como cero da margen del
 * 100% y hace ver rentable todo el catálogo. Se descarta el vacío antes de
 * convertir (mismo tropiezo que hubo en clasificarResponseCode).
 */
const esNumero = (v) =>
  v !== null && v !== undefined && String(v).trim() !== "" && Number.isFinite(Number(v));

/**
 * Recalcula el costo promedio de un SKU tras un ingreso.
 *
 * @param {object} args
 * @param {number} args.stockActual      Unidades en stock ANTES del ingreso.
 * @param {number|null} args.costoActual Costo promedio vigente (null si nunca tuvo).
 * @param {number} args.cantidadIngreso  Unidades que entran (> 0).
 * @param {number} args.costoIngreso     Costo unitario del ingreso (>= 0).
 * @returns {{costoPromedio:number, motivo:string, estimado:boolean, stockResultante:number}}
 *          `estimado: true` avisa que el promedio se apoya en stock cuyo costo
 *          real se desconoce — el número sirve, pero no hay que presentarlo
 *          como exacto.
 */
export function recalcularCostoPromedio({ stockActual, costoActual, cantidadIngreso, costoIngreso }) {
  const cantidad = Number(cantidadIngreso);
  const costoNuevo = Number(costoIngreso);

  if (!esNumero(cantidad) || cantidad <= 0) {
    throw new Error(`recalcularCostoPromedio: cantidad de ingreso inválida (${cantidadIngreso}).`);
  }
  if (!esNumero(costoNuevo) || costoNuevo < 0) {
    throw new Error(`recalcularCostoPromedio: costo de ingreso inválido (${costoIngreso}).`);
  }

  // Un stock negativo (sobreventa) no puede ponderar: se trata como cero.
  const stock = esNumero(stockActual) ? Math.max(0, Number(stockActual)) : 0;
  const costoPrevio = esNumero(costoActual) && Number(costoActual) > 0 ? Number(costoActual) : null;
  const stockResultante = stock + cantidad;

  // Sin stock previo, el costo entrante es el costo. No hay nada que ponderar.
  if (stock === 0) {
    return {
      costoPromedio: redondear(costoNuevo),
      motivo: costoPrevio === null ? MOTIVO.PRIMER_COSTO : MOTIVO.SIN_STOCK,
      estimado: false,
      stockResultante,
    };
  }

  // Había stock pero nunca se le registró costo: no se puede ponderar contra un
  // valor que no existe. Se adopta el costo entrante para todo y se marca como
  // estimado, en vez de inventar un promedio con un cero que hundiría el costo.
  if (costoPrevio === null) {
    return {
      costoPromedio: redondear(costoNuevo),
      motivo: MOTIVO.STOCK_SIN_COSTO,
      estimado: true,
      stockResultante,
    };
  }

  const promedio = (stock * costoPrevio + cantidad * costoNuevo) / stockResultante;
  return {
    costoPromedio: redondear(promedio),
    motivo: MOTIVO.PROMEDIO,
    estimado: false,
    stockResultante,
  };
}

/**
 * Margen de una línea vendida, contra el costo capturado en esa venta.
 *
 * Se calcula sobre el costo GUARDADO en la línea, no sobre el costo actual del
 * SKU: si se usara el actual, el margen histórico cambiaría solo porque el
 * costo subió — y los informes del mes pasado dejarían de cuadrar.
 *
 * @param {{precio:number, descuento?:number, cantidad:number, costoUnitario:number|null}} linea
 * @returns {{ingreso:number, costo:number, margen:number, porcentaje:number|null, sinCosto:boolean}}
 */
export function calcularMargenLinea({ precio, descuento = 0, cantidad, costoUnitario }) {
  const cant = esNumero(cantidad) ? Number(cantidad) : 0;
  const ingreso = redondear(Math.max(0, (Number(precio) || 0) - (Number(descuento) || 0)) * cant, 2);

  // Sin costo conocido no se inventa un margen: se devuelve `sinCosto` para que
  // la UI muestre "—" en vez de un 100% falso que haría ver todo rentable.
  if (!esNumero(costoUnitario) || Number(costoUnitario) < 0) {
    return { ingreso, costo: 0, margen: 0, porcentaje: null, sinCosto: true };
  }

  const costo = redondear(Number(costoUnitario) * cant, 2);
  const margen = redondear(ingreso - costo, 2);
  return {
    ingreso,
    costo,
    margen,
    porcentaje: ingreso > 0 ? redondear((margen / ingreso) * 100, 2) : null,
    sinCosto: false,
  };
}

/** Valor del inventario de un SKU. Sin costo conocido, vale 0 y se marca. */
export function valorizarStock({ stock, costoPromedio }) {
  const unidades = esNumero(stock) ? Math.max(0, Number(stock)) : 0;
  if (!esNumero(costoPromedio) || Number(costoPromedio) <= 0) {
    return { unidades, valor: 0, sinCosto: unidades > 0 };
  }
  return { unidades, valor: redondear(unidades * Number(costoPromedio), 2), sinCosto: false };
}

/**
 * Costo de una línea de venta que se repartió entre varios SKU.
 *
 * El POS vende a nivel producto, así que una línea de 10 unidades puede salir
 * de dos variantes con costos distintos. El costo de la línea es el promedio
 * ponderado por unidades de esas variantes.
 *
 * Devuelve `null` si ALGUNA unidad no tiene costo conocido, en vez de promediar
 * solo las que sí lo tienen. `detalle_venta.costo_unitario` es un único número
 * que después se multiplica por la cantidad completa: guardar el promedio
 * parcial afirmaría saber el costo de unidades cuyo costo se ignora, y la línea
 * entraría al margen con una cifra inventada. Un null la deja fuera, que es
 * justo lo que `obtenerMargenPorPeriodo` sabe informar.
 *
 * @param {{id_sku:number, cantidad:number}[]} movimientos
 * @param {Map<number, number|null>} costoPorSku
 */
export function costoDeLineaRepartida({ movimientos, costoPorSku }) {
  let unidades = 0;
  let acumulado = 0;

  for (const mov of movimientos || []) {
    const cant = Number(mov?.cantidad);
    if (!Number.isFinite(cant) || cant <= 0) continue;

    const costo = costoPorSku?.get?.(Number(mov?.id_sku));
    // Ojo con Number(null) === 0: un costo ausente NO es un costo de cero.
    if (!esNumero(costo) || Number(costo) <= 0) return { costo: null, completo: false };

    acumulado += Number(costo) * cant;
    unidades += cant;
  }

  if (unidades === 0) return { costo: null, completo: false };
  return { costo: redondear(acumulado / unidades), completo: true };
}

export default {
  recalcularCostoPromedio,
  calcularMargenLinea,
  valorizarStock,
  costoDeLineaRepartida,
  MOTIVO,
  DECIMALES_COSTO,
};
