import type { StoreTheme } from "./theme";
import { resolveTheme } from "./theme";

export type StoreSucursal = {
  id_sucursal: number;
  nombre: string;
  direccion: string;
  lat?: number | null;
  lng?: number | null;
  horario_json?: Record<string, unknown> | null;
  whatsapp?: string | null;
  telefono?: string | null;
  allow_pickup: boolean;
  allow_delivery: boolean;
  es_default?: boolean;
};

export type BranchAvailability = {
  sucursal: StoreSucursal;
  disponible: number;
  variantes?: { id_variante: number; sku?: string | null; talla?: string | null; color?: string | null; disponible: number }[];
};

export type StoreTienda = {
  slug: string;
  nombre: string;
  color_primario?: string | null;
  logo_url?: string | null;
  descripcion?: string | null;
  telefono?: string | null;
  theme_json?: Partial<StoreTheme> | null;
};

export type StoreProducto = {
  id_producto: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  stock: number;
  sku?: string | null;
  categoria?: string | null;
  attrs_json?: Record<string, unknown> | string | null;
  imagen_url?: string | null;
};

export type StoreProductoDetalle = StoreProducto & {
  stock_min?: number;
  activo?: number;
};

export type StoreImagen = {
  id_imagen: number;
  url: string;
  es_principal?: number;
  orden?: number;
};

export function parseAttrs(attrs: StoreProducto["attrs_json"]): Record<string, unknown> {
  if (!attrs) return {};
  if (typeof attrs === "string") {
    try {
      return JSON.parse(attrs) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return attrs;
}

export function getCategoria(p: StoreProducto): string | null {
  if (typeof p.categoria === "string" && p.categoria.trim()) return p.categoria.trim();
  const attrs = parseAttrs(p.attrs_json);
  const cat = attrs.categoria;
  return typeof cat === "string" && cat.trim() ? cat.trim() : null;
}

export function getMarca(p: StoreProducto): string | null {
  const attrs = parseAttrs(p.attrs_json);
  const marca = attrs.marca;
  return typeof marca === "string" && marca.trim() ? marca.trim() : null;
}

export function getTags(p: StoreProducto): string[] {
  const attrs = parseAttrs(p.attrs_json);
  const tags = attrs.tags;
  if (Array.isArray(tags)) {
    return tags
      .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
      .map((t) => t.trim());
  }
  return [];
}

export function isDestacado(p: StoreProducto): boolean {
  return Boolean(parseAttrs(p.attrs_json).destacado);
}

export function isStory(p: StoreProducto): boolean {
  return Boolean(parseAttrs(p.attrs_json).story);
}

/** Atributos informativos de vitrina (no afectan stock). */
export type VitrinaTonalidad = { nombre: string; hex: string };

export type VitrinaAtributos = {
  talla: string[];
  tonalidad: VitrinaTonalidad[];
  /** @deprecated usar tonalidad */
  color: string[];
};

export function getVitrinaAtributos(p: StoreProducto): VitrinaAtributos {
  const attrs = parseAttrs(p.attrs_json);
  const raw =
    attrs.atributos && typeof attrs.atributos === "object"
      ? (attrs.atributos as Record<string, unknown>)
      : attrs;
  const asList = (v: unknown): string[] => {
    if (!Array.isArray(v)) return [];
    return v
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((x) => x.trim());
  };
  const asTonalidad = (v: unknown): VitrinaTonalidad[] => {
    if (!Array.isArray(v)) return [];
    const out: VitrinaTonalidad[] = [];
    for (const item of v) {
      if (typeof item === "string" && item.trim()) {
        out.push({ nombre: item.trim(), hex: "#94a3b8" });
        continue;
      }
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        const nombre = typeof o.nombre === "string" ? o.nombre.trim() : "";
        if (!nombre) continue;
        let hex = typeof o.hex === "string" ? o.hex.trim() : "#94a3b8";
        if (!/^#[0-9a-fA-F]{6}$/.test(hex)) hex = "#94a3b8";
        out.push({ nombre, hex: hex.toLowerCase() });
      }
    }
    return out;
  };
  let tonalidad = asTonalidad(raw.tonalidad);
  if (tonalidad.length === 0) tonalidad = asTonalidad(raw.color);
  return {
    talla: asList(raw.talla),
    tonalidad,
    color: tonalidad.map((t) => t.nombre),
  };
}

export function monograma(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "H";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function formatPen(n: number): string {
  return `S/ ${Number(n).toFixed(2)}`;
}

export function tiendaTheme(tienda: StoreTienda) {
  return resolveTheme(tienda.theme_json);
}

export type { StoreTheme };
