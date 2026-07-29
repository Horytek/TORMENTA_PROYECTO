/**
 * Carga inicial de costos: declarar cuánto costó el stock que YA está en el
 * almacén y entró antes de que el sistema llevara costos.
 *
 * Es distinto de `aplicarIngresoAlCosto`: ahí entra mercadería y el promedio se
 * pondera contra lo que había. Acá no entra nada — se está poniendo nombre al
 * costo de unidades que ya estaban. Ponderar no tendría contra qué: el costo
 * previo es justamente el que falta.
 *
 * La regla que protege el dato: una carga inicial NO pisa un costo que ya
 * existe. Los costos que vienen de compras reales valen más que una estimación
 * escrita a mano, y volver a correr la carga no puede destruirlos. Sobrescribir
 * es posible, pero hay que pedirlo explícitamente.
 */

const DECIMALES_COSTO = 4;
const COSTO_MAXIMO = 9_999_999;

export const RESULTADO = {
  APLICA: "APLICA",                 // el SKU no tenía costo: se establece
  YA_TENIA_COSTO: "YA_TENIA_COSTO", // tenía costo y no se pidió sobrescribir
  SOBRESCRIBE: "SOBRESCRIBE",       // tenía costo y se pidió reemplazarlo
};

export class CostoInvalidoError extends Error {
  constructor(valor, detalle) {
    super(`Costo inválido (${valor}): ${detalle}`);
    this.name = "CostoInvalidoError";
    this.codigo = "COSTO_INVALIDO";
  }
}

/**
 * Convierte lo que llegue del cliente en un costo usable, o lanza.
 *
 * Rechaza el cero: "cuesta 0" no es un costo desconocido ni un regalo, es casi
 * siempre un campo vacío que se coló. Dejarlo pasar haría ver el margen como
 * 100% — exactamente la mentira que este módulo existe para evitar.
 */
export const normalizarCosto = (valor) => {
  if (valor === null || valor === undefined || String(valor).trim() === "") {
    throw new CostoInvalidoError(valor, "está vacío");
  }
  const numero = Number(valor);
  if (!Number.isFinite(numero)) {
    throw new CostoInvalidoError(valor, "no es un número");
  }
  if (numero <= 0) {
    throw new CostoInvalidoError(valor, "debe ser mayor que cero");
  }
  if (numero > COSTO_MAXIMO) {
    throw new CostoInvalidoError(valor, `supera el máximo de ${COSTO_MAXIMO}`);
  }
  const factor = 10 ** DECIMALES_COSTO;
  return Math.round((numero + Number.EPSILON) * factor) / factor;
};

/**
 * ¿Corresponde escribir el costo inicial de este SKU?
 *
 * @param {number|null} costoActual  costo_promedio vigente (null = nunca se supo)
 * @param {boolean} forzar           el usuario pidió reemplazar costos existentes
 */
export const decidirCargaInicial = ({ costoActual, forzar = false }) => {
  const tieneCosto = costoActual !== null && costoActual !== undefined && Number(costoActual) > 0;

  if (!tieneCosto) return { aplica: true, resultado: RESULTADO.APLICA };
  if (forzar) return { aplica: true, resultado: RESULTADO.SOBRESCRIBE };
  return { aplica: false, resultado: RESULTADO.YA_TENIA_COSTO };
};

/**
 * Reparte un costo declarado a nivel PRODUCTO entre sus SKU.
 *
 * En ropa las tallas y colores de una misma prenda cuestan lo mismo, así que
 * cargar 147 productos es viable y cargar 1687 SKU no. Cada SKU decide por
 * separado si le toca, para que un producto a medio cargar no pierda lo que ya
 * tenía bien.
 *
 * @param {{id_sku:number, costoActual:number|null}[]} skus
 * @returns {{aplicar:{id_sku:number,costo:number}[], omitidos:number[]}}
 */
export const planificarCargaProducto = ({ skus, costo, forzar = false }) => {
  const costoValido = normalizarCosto(costo);
  const aplicar = [];
  const omitidos = [];

  for (const sku of skus || []) {
    const { aplica } = decidirCargaInicial({ costoActual: sku.costoActual, forzar });
    if (aplica) aplicar.push({ id_sku: sku.id_sku, costo: costoValido });
    else omitidos.push(sku.id_sku);
  }

  return { aplicar, omitidos };
};

export default { normalizarCosto, decidirCargaInicial, planificarCargaProducto, RESULTADO, CostoInvalidoError };
