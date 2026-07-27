/**
 * Reparto de una cantidad entre los SKU disponibles de un producto.
 *
 * El POS vende a nivel PRODUCTO: `POSProduct` no lleva `id_sku`, así que cuando
 * se vende "1 polo" hay que decidir de cuál variante sale. Hoy el código toma
 * una fila arbitraria con `LIMIT 1` (ventas.controller.js), lo que puede
 * descontar de una fila con stock 0 mientras otra tiene existencias. Este módulo
 * reemplaza esa arbitrariedad por una política explícita.
 *
 * Es una solución de transición: cuando el POS mande `id_sku` (PR5) el reparto
 * deja de hacer falta para ventas, pero se sigue usando en salidas y guías.
 *
 * Función pura: no toca BD. El repositorio le pasa las filas ya bloqueadas.
 */

export const POLITICA = {
  /** Agota el SKU con más stock antes de tocar el siguiente. */
  CONCENTRAR: "concentrar",
  /** Reparte a prorrata del stock de cada SKU. */
  PROPORCIONAL: "proporcional",
};

const esEntero = (v) => Number.isInteger(Number(v));

/**
 * Identificador utilizable.
 *
 * `Number(null)` y `Number("")` son 0, y `Number.isInteger(0)` es true — así que
 * una comprobación ingenua acepta un id nulo y lo convierte en "SKU 0". Acá eso
 * no es cosmético: una fila con id nulo y mucho stock ganaría el reparto y la
 * venta descontaría de un SKU inexistente. Se exige entero positivo.
 */
const esIdValido = (v) =>
  v !== null && v !== undefined && String(v).trim() !== "" && Number.isInteger(Number(v)) && Number(v) > 0;

/**
 * Decide de qué SKU sale cada unidad.
 *
 * NO lanza cuando falta stock: devuelve `faltante` para que el llamador arme el
 * 409 con su propio contexto (producto, almacén). Un throw acá obligaría a
 * atrapar y re-lanzar en cada controlador.
 *
 * @param {{disponibles: Array<{id_sku:number, stock:number}>, cantidad:number, politica?:string}} args
 * @returns {{asignaciones: Array<{id_sku:number, cantidad:number}>, faltante:number, disponibleTotal:number}}
 */
export function asignarCantidad({ disponibles, cantidad, politica = POLITICA.CONCENTRAR }) {
  const pedida = Number(cantidad);
  if (!esEntero(pedida) || pedida <= 0) {
    throw new Error(`asignarCantidad: cantidad inválida (${cantidad}).`);
  }

  // Solo cuentan las filas con stock positivo. Un stock negativo (sobreventa
  // previa) no aporta nada y arrastraría el reparto a valores absurdos.
  const filas = (disponibles ?? [])
    .filter((d) => esIdValido(d?.id_sku))
    .map((d) => ({ id_sku: Number(d.id_sku), stock: Math.max(0, Number(d.stock) || 0) }))
    .filter((d) => d.stock > 0);

  const disponibleTotal = filas.reduce((acc, f) => acc + f.stock, 0);

  if (disponibleTotal === 0) {
    return { asignaciones: [], faltante: pedida, disponibleTotal: 0 };
  }

  const asignaciones =
    politica === POLITICA.PROPORCIONAL
      ? repartirProporcional(filas, Math.min(pedida, disponibleTotal))
      : repartirConcentrado(filas, Math.min(pedida, disponibleTotal));

  return {
    asignaciones: asignaciones.filter((a) => a.cantidad > 0),
    faltante: Math.max(0, pedida - disponibleTotal),
    disponibleTotal,
  };
}

/**
 * Agota primero el SKU con más stock. En el caso normal —una sola variante con
 * existencias— toca una única fila, que es lo que uno espera al vender.
 *
 * El desempate por `id_sku` ascendente no es cosmético: hace el reparto
 * determinista, y el repositorio bloquea las filas en ese mismo orden para no
 * generar deadlocks entre ventas simultáneas.
 */
function repartirConcentrado(filas, cantidad) {
  const orden = [...filas].sort((a, b) => b.stock - a.stock || a.id_sku - b.id_sku);
  const asignaciones = [];
  let restante = cantidad;

  for (const fila of orden) {
    if (restante <= 0) break;
    const toma = Math.min(fila.stock, restante);
    asignaciones.push({ id_sku: fila.id_sku, cantidad: toma });
    restante -= toma;
  }
  return asignaciones;
}

/**
 * Reparte a prorrata. Se usa cuando conviene bajar parejo todas las variantes
 * en vez de vaciar una.
 */
function repartirProporcional(filas, cantidad) {
  const orden = [...filas].sort((a, b) => a.id_sku - b.id_sku);
  const total = orden.reduce((acc, f) => acc + f.stock, 0);

  // Primera pasada: parte entera de la proporción, nunca más que su stock.
  const asignaciones = orden.map((f) => ({
    id_sku: f.id_sku,
    cantidad: Math.min(f.stock, Math.floor((f.stock * cantidad) / total)),
    stock: f.stock,
  }));

  // Segunda pasada: las unidades que dejó el redondeo van a quien tenga más
  // stock libre, para no crear un faltante artificial.
  let restante = cantidad - asignaciones.reduce((acc, a) => acc + a.cantidad, 0);
  while (restante > 0) {
    const candidata = asignaciones
      .filter((a) => a.cantidad < a.stock)
      .sort((a, b) => b.stock - a.stock - (a.cantidad - b.cantidad) || a.id_sku - b.id_sku)[0];
    if (!candidata) break; // no debería ocurrir: cantidad <= total
    candidata.cantidad += 1;
    restante -= 1;
  }

  return asignaciones.map(({ id_sku, cantidad: c }) => ({ id_sku, cantidad: c }));
}

/**
 * Invierte un reparto para devolver el stock (anulación de venta o nota).
 * Se guarda en `bitacora_nota.id_sku`, así que una anulación devuelve las
 * unidades exactamente a los SKU de los que salieron.
 */
export function revertirAsignacion(asignaciones) {
  return (asignaciones ?? [])
    .filter((a) => Number(a?.cantidad) > 0 && esIdValido(a?.id_sku))
    .map((a) => ({ id_sku: Number(a.id_sku), cantidad: Number(a.cantidad) }));
}

/** Suma de unidades de un reparto. Sirve para comprobar que cuadra. */
export function totalAsignado(asignaciones) {
  return (asignaciones ?? []).reduce((acc, a) => acc + (Number(a.cantidad) || 0), 0);
}

export default { asignarCantidad, revertirAsignacion, totalAsignado, POLITICA };
