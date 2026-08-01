/**
 * Agrupa variantes (SKUs) por sus atributos ACTIVOS, sumando el stock de las
 * que quedan idénticas al ignorar los atributos desactivados.
 *
 * Puramente de vista: nunca toca `id_sku` reales ni escribe nada — es la
 * misma lista de SKUs, solo reinterpretada. Si luego se reactiva un
 * atributo, alcanza con volver a llamar esta función con el set de activos
 * actualizado; no hay estado que reconstruir.
 */

export interface CollapsableVariant {
  id_sku: number;
  /** { id_atributo (string) → valor }, tal cual `producto_sku.attributes_json`. */
  attrs: Record<string, string>;
  stock: number;
}

export interface CollapsedVariant {
  /** Estable para usar como key de React: los mismos atributos activos siempre producen la misma key. */
  key: string;
  /** Solo los atributos activos. */
  attrs: Record<string, string>;
  /** Valores activos unidos, ej. "Rojo / M". "Sin variante" si no quedó ningún atributo activo. */
  label: string;
  /** Suma del stock de todos los SKU agrupados. */
  stock: number;
  /** SKUs reales que representa este grupo (1 si no hubo colisión). */
  id_skus: number[];
}

export function collapseVariants(
  variants: CollapsableVariant[],
  activeAttrIds: Iterable<number | string>
): CollapsedVariant[] {
  const active = new Set(Array.from(activeAttrIds, String));
  const groups = new Map<string, CollapsedVariant>();

  for (const v of variants) {
    const entradas = Object.entries(v.attrs || {})
      .filter(([id]) => active.has(id))
      .sort(([a], [b]) => Number(a) - Number(b));

    const key = entradas.map(([id, val]) => `${id}:${val}`).join("|") || "__sin_atributos_activos__";
    const existing = groups.get(key);

    if (existing) {
      existing.stock += v.stock;
      existing.id_skus.push(v.id_sku);
    } else {
      groups.set(key, {
        key,
        attrs: Object.fromEntries(entradas),
        label: entradas.map(([, val]) => val).join(" / ") || "Sin variante",
        stock: v.stock,
        id_skus: [v.id_sku],
      });
    }
  }

  return [...groups.values()];
}
