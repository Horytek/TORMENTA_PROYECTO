import type { MargenProducto } from "../types";

export type CuadranteBcg = "estrella" | "vaca_lechera" | "interrogante" | "perro";

export interface PuntoBcg {
  producto: MargenProducto;
  cuadrante: CuadranteBcg;
}

const mediana = (valores: number[]): number => {
  if (valores.length === 0) return 0;
  const ordenados = [...valores].sort((a, b) => a - b);
  const mitad = Math.floor(ordenados.length / 2);
  return ordenados.length % 2 !== 0
    ? ordenados[mitad]
    : (ordenados[mitad - 1] + ordenados[mitad]) / 2;
};

/**
 * Clasifica productos en los 4 cuadrantes BCG (volumen vendido × margen %),
 * usando la mediana del propio conjunto como corte — un umbral fijo no
 * tendría el mismo sentido para una tienda chica que para una grande.
 * Solo entran productos con margen conocido: uno sin costo fotografiado no
 * se puede ubicar, mezclarlo daría un cuadrante inventado.
 */
export function clasificarBcg(productos: MargenProducto[]): {
  puntos: PuntoBcg[];
  medianaUnidades: number;
  medianaMargen: number;
} {
  const conMargen = productos.filter((p) => p.porcentaje != null);
  const medianaUnidades = mediana(conMargen.map((p) => p.unidades));
  const medianaMargen = mediana(conMargen.map((p) => p.porcentaje as number));

  const puntos = conMargen.map((p) => {
    const altoVolumen = p.unidades >= medianaUnidades;
    const altoMargen = (p.porcentaje as number) >= medianaMargen;
    const cuadrante: CuadranteBcg =
      altoVolumen && altoMargen ? "estrella" :
      altoVolumen && !altoMargen ? "vaca_lechera" :
      !altoVolumen && altoMargen ? "interrogante" :
      "perro";
    return { producto: p, cuadrante };
  });

  return { puntos, medianaUnidades, medianaMargen };
}

export const CUADRANTE_LABEL: Record<CuadranteBcg, string> = {
  estrella: "Estrella",
  vaca_lechera: "Vende mucho, deja poco",
  interrogante: "Deja bien, vende poco",
  perro: "Bajo rendimiento",
};

export const CUADRANTE_DESCRIPCION: Record<CuadranteBcg, string> = {
  estrella: "Vende bien y deja buen margen — el motor del negocio.",
  vaca_lechera: "Se vende mucho pero el margen es delgado — revisar precio o costo.",
  interrogante: "Buen margen con poco volumen — candidato a promocionar más.",
  perro: "Poco volumen y poco margen — candidato a descontinuar.",
};

// Paleta validada (colorblind-safe) contra las superficies claras y oscuras
// de este proyecto — ver skill de dataviz. El par ámbar↔esmeralda queda en la
// banda de advertencia CVD, por eso cada cuadrante también lleva etiqueta
// directa en el gráfico (nunca solo color).
export const CUADRANTE_COLOR: Record<CuadranteBcg, string> = {
  estrella: "#059669",
  vaca_lechera: "#d97706",
  interrogante: "#3b82f6",
  perro: "#e11d48",
};
