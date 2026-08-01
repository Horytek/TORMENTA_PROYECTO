import type { ProductAttribute } from "../types";

/** Un valor de atributo posicionado dentro de una combinación. */
export interface ComboValor {
  id_atributo: number;
  id_valor: number;
  valor: string;
}

/** Modo de UI según cuántas dimensiones (atributos con valores elegidos) tiene el producto. */
export type VariantMode = "sin_variantes" | "lista_simple" | "grilla_2d" | "tabla_nd";

export function deriveVariantMode(attrsConValores: ProductAttribute[]): VariantMode {
  if (attrsConValores.length === 0) return "sin_variantes";
  if (attrsConValores.length === 1) return "lista_simple";
  if (attrsConValores.length === 2) return "grilla_2d";
  return "tabla_nd";
}

/** Clave determinística de una combinación: id_valor ordenados por id_atributo, igual criterio que `attrs_key` en el backend. */
export function comboKey(combo: ComboValor[]): string {
  return [...combo].sort((a, b) => a.id_atributo - b.id_atributo).map((c) => c.id_valor).join(":");
}

export function comboLabel(combo: ComboValor[]): string {
  return [...combo].sort((a, b) => a.id_atributo - b.id_atributo).map((c) => c.valor).join(" / ");
}

/**
 * Producto cartesiano de los valores seleccionados en N atributos. Con 3
 * atributos de 4 valores cada uno ya son 64 combinaciones — nadie revisa eso
 * a mano, por eso la tabla de variantes existe (bulk edit + excluir filas).
 */
export function cartesianCombos(
  attrs: ProductAttribute[],
  seleccionados: Record<number, string[]>
): ComboValor[][] {
  const dimensiones = attrs.map((attr) => {
    const ids = seleccionados[attr.id_atributo] || [];
    return (attr.values ?? [])
      .filter((v) => ids.includes(String(v.id_valor)))
      .map((v): ComboValor => ({ id_atributo: attr.id_atributo, id_valor: v.id_valor, valor: v.valor }));
  });

  if (dimensiones.some((d) => d.length === 0)) return [];

  let combos: ComboValor[][] = [[]];
  for (const dimension of dimensiones) {
    const next: ComboValor[][] = [];
    for (const combo of combos) {
      for (const valor of dimension) {
        next.push([...combo, valor]);
      }
    }
    combos = next;
  }
  return combos;
}
