/**
 * De dónde viene la mercadería de un negocio.
 *
 * El ERP se vende a rubros distintos y cada uno tiene su procedimiento: una
 * marca que manda a fabricar a un taller, una tienda que compra prenda
 * terminada, un productor que confecciona. La configuración de la empresa fija
 * el caso DOMINANTE — no el único: el origen viaja por línea de ingreso
 * (`detalle_nota.origen_costo`), así que una marca propia puede registrar sin
 * fricción los accesorios que sí compra a un proveedor.
 *
 * Regla de alcance de esta versión: el origen cambia el VOCABULARIO de las
 * pantallas, no el cálculo. Venga de un taller o de un proveedor, lo que entra
 * es un costo unitario y el promedio ponderado se calcula igual. Cuando un
 * cliente pida costeo por componentes (tela + avíos + mano de obra), `PROPIOS`
 * es donde se engancha — pero no se construye antes de que alguien lo pida.
 */

export const ORIGEN = {
  ADQUIRIDOS: "ADQUIRIDOS", // se compra terminado a un proveedor
  PROPIOS: "PROPIOS",       // se manda a fabricar o se produce
  MIXTO: "MIXTO",           // ambos conviven
};

/** Origen por defecto de un tenant nuevo: comprar terminado es el caso más común. */
export const ORIGEN_POR_DEFECTO = ORIGEN.ADQUIRIDOS;

/**
 * Orígenes que puede tener una LÍNEA de ingreso — un conjunto más chico que el
 * de modos de empresa. `MIXTO` describe a un negocio que hace las dos cosas;
 * una línea concreta nunca es mixta: esa mercadería o se compró o se fabricó.
 */
export const ORIGENES_DE_LINEA = new Set([ORIGEN.ADQUIRIDOS, ORIGEN.PROPIOS]);

/**
 * Vocabulario por origen. Lo consume la UI para no preguntar "precio de compra"
 * a quien fabrica ni "costo de producción" a quien compra.
 */
const VOCABULARIO = {
  [ORIGEN.ADQUIRIDOS]: {
    etiqueta: "Compramos productos terminados",
    descripcion: "El costo es lo que pagas a tu proveedor por cada artículo.",
    campoCosto: "Costo de compra",
    ayudaCosto: "Cuánto te costó cada unidad, sin IGV.",
    tituloIngreso: "Ingreso por compra",
    nombreContraparte: "Proveedor",
  },
  [ORIGEN.PROPIOS]: {
    etiqueta: "Fabricamos nuestros productos",
    descripcion: "El costo es lo que te cuesta producir o mandar a fabricar cada artículo.",
    campoCosto: "Costo de producción",
    ayudaCosto: "Cuánto te costó producir cada unidad: taller, materiales y acabados.",
    tituloIngreso: "Ingreso por producción",
    nombreContraparte: "Taller",
  },
  [ORIGEN.MIXTO]: {
    etiqueta: "Ambos: fabricamos y compramos",
    descripcion: "Podrás elegir el origen en cada ingreso de mercadería.",
    campoCosto: "Costo unitario",
    ayudaCosto: "Cuánto te costó cada unidad, sin IGV.",
    tituloIngreso: "Ingreso de mercadería",
    nombreContraparte: "Proveedor o taller",
  },
};

/** Normaliza lo que venga de BD o del cliente a un origen válido. */
export function normalizarOrigen(valor) {
  const texto = String(valor ?? "").trim().toUpperCase();
  return Object.hasOwn(ORIGEN, texto) ? ORIGEN[texto] : ORIGEN_POR_DEFECTO;
}

/** true si el valor es uno de los orígenes admitidos (para validar entradas). */
export function esOrigenValido(valor) {
  return Object.hasOwn(ORIGEN, String(valor ?? "").trim().toUpperCase());
}

/** Vocabulario de pantalla para un origen. Nunca devuelve undefined. */
export function vocabularioDe(origen) {
  return VOCABULARIO[normalizarOrigen(origen)];
}

/**
 * Orígenes que el usuario puede elegir en una línea de ingreso.
 *
 * Si la empresa declaró un caso único, no se le pregunta: se asume el suyo.
 * Preguntar en cada línea algo que nunca cambia es fricción pura, y el
 * time-to-value es prioridad del negocio.
 */
export function opcionesDeIngreso(origenEmpresa) {
  const origen = normalizarOrigen(origenEmpresa);
  if (origen === ORIGEN.MIXTO) {
    return [
      { valor: ORIGEN.ADQUIRIDOS, etiqueta: VOCABULARIO[ORIGEN.ADQUIRIDOS].nombreContraparte },
      { valor: ORIGEN.PROPIOS, etiqueta: VOCABULARIO[ORIGEN.PROPIOS].nombreContraparte },
    ];
  }
  return [{ valor: origen, etiqueta: VOCABULARIO[origen].nombreContraparte }];
}

/** true si hay que mostrar el selector de origen en la pantalla de ingreso. */
export function requiereElegirOrigen(origenEmpresa) {
  return normalizarOrigen(origenEmpresa) === ORIGEN.MIXTO;
}

/**
 * Origen que se guarda en una línea de ingreso.
 * Con empresa de caso único se ignora lo que mande el cliente: no tiene sentido
 * registrar "PROPIOS" en un negocio que declaró que solo compra.
 */
export function resolverOrigenDeLinea(origenEmpresa, origenSolicitado) {
  const empresa = normalizarOrigen(origenEmpresa);
  if (empresa !== ORIGEN.MIXTO) return empresa;

  // Se valida contra ORIGENES_DE_LINEA y no con `esOrigenValido`: este último
  // acepta MIXTO por ser parte del enum, y guardar "MIXTO" en una línea no
  // significa nada.
  const solicitado = String(origenSolicitado ?? "").trim().toUpperCase();
  return ORIGENES_DE_LINEA.has(solicitado) ? solicitado : ORIGEN.ADQUIRIDOS;
}

export default {
  ORIGEN,
  ORIGEN_POR_DEFECTO,
  ORIGENES_DE_LINEA,
  normalizarOrigen,
  esOrigenValido,
  vocabularioDe,
  opcionesDeIngreso,
  requiereElegirOrigen,
  resolverOrigenDeLinea,
};
