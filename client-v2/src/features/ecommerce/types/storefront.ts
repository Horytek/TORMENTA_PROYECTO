import type { StoreTheme } from "./theme";
import { resolveTheme } from "./theme";

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
  const attrs = parseAttrs(p.attrs_json);
  const cat = attrs.categoria;
  return typeof cat === "string" && cat.trim() ? cat.trim() : null;
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
