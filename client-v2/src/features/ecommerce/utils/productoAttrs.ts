/** Helpers para attrs_json informativos de vitrina (no afectan stock). */

export type ProductoAttrsJson = Record<string, unknown> | string | null | undefined;

export type TonalidadAttr = {
  nombre: string;
  hex: string;
};

export type VitrinaAtributosAdmin = {
  talla: string[];
  tonalidad: TonalidadAttr[];
};

/** Catálogo textil estándar + tallas numéricas. */
export const TALLAS_CATALOGO = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "3XL",
  "28",
  "30",
  "32",
  "34",
  "36",
  "38",
  "40",
  "42",
] as const;

export const HEX_LEGACY_FALLBACK = "#94a3b8";

export function parseProductoAttrs(a: ProductoAttrsJson): Record<string, unknown> {
  if (!a) return {};
  if (typeof a === "string") {
    try {
      const parsed = JSON.parse(a);
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return a;
}

export function asAttrList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((x) => x.trim());
}

export function normalizeHex(hex: unknown, fallback = HEX_LEGACY_FALLBACK): string {
  if (typeof hex !== "string") return fallback;
  const t = hex.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(t)) return t.toLowerCase();
  if (/^[0-9a-fA-F]{6}$/.test(t)) return `#${t.toLowerCase()}`;
  if (/^#[0-9a-fA-F]{3}$/.test(t)) {
    const r = t[1];
    const g = t[2];
    const b = t[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback;
}

function asTonalidadList(v: unknown): TonalidadAttr[] {
  if (!Array.isArray(v)) return [];
  const out: TonalidadAttr[] = [];
  for (const item of v) {
    if (typeof item === "string" && item.trim()) {
      out.push({ nombre: item.trim(), hex: HEX_LEGACY_FALLBACK });
      continue;
    }
    if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      const nombre =
        typeof o.nombre === "string" && o.nombre.trim()
          ? o.nombre.trim()
          : typeof o.name === "string" && o.name.trim()
            ? o.name.trim()
            : "";
      if (!nombre) continue;
      out.push({ nombre, hex: normalizeHex(o.hex ?? o.color) });
    }
  }
  return out;
}

export function getProductoAtributos(attrs: Record<string, unknown>): VitrinaAtributosAdmin {
  const raw =
    attrs.atributos && typeof attrs.atributos === "object"
      ? (attrs.atributos as Record<string, unknown>)
      : attrs;
  const talla = asAttrList(raw.talla);
  let tonalidad = asTonalidadList(raw.tonalidad);
  if (tonalidad.length === 0) {
    tonalidad = asTonalidadList(raw.color);
  }
  return { talla, tonalidad };
}

export function mergeProductoAtributos(
  attrs: Record<string, unknown>,
  talla: string[],
  tonalidad: TonalidadAttr[]
): Record<string, unknown> {
  const prev =
    attrs.atributos && typeof attrs.atributos === "object"
      ? { ...(attrs.atributos as Record<string, unknown>) }
      : {};
  delete prev.color;
  return {
    ...attrs,
    atributos: {
      ...prev,
      talla,
      tonalidad: tonalidad.map((t) => ({
        nombre: t.nombre.trim(),
        hex: normalizeHex(t.hex),
      })),
    },
  };
}

export function attrsEqual(a: VitrinaAtributosAdmin, b: VitrinaAtributosAdmin): boolean {
  if (a.talla.length !== b.talla.length || a.tonalidad.length !== b.tonalidad.length) return false;
  if (!a.talla.every((v, i) => v === b.talla[i])) return false;
  return a.tonalidad.every(
    (t, i) => t.nombre === b.tonalidad[i].nombre && t.hex === b.tonalidad[i].hex
  );
}
