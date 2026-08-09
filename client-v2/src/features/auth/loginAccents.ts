/**
 * Tonalidades de login alineadas a experienceModules / productThemes.
 */
export const LOGIN_MODE_ACCENT: Record<string, string> = {
  erp: "#1e293b",
  express: "#f59e0b",
  ecommerce: "#0f766e",
  mayorista: "#B45309",
  taxi: "#CA8A04",
  delivery: "#F97316",
  flotas: "#475569",
  academia: "#7C3AED",
  agenda: "#14B8A6",
  recluta: "#BE123C",
  sync: "#0284C7",
  taller: "#EA580C",
  preventa: "#E11D48",
  crm: "#2563EB",
  envios: "#0891B2",
  wms: "#4F46E5",
  despacho: "#16A34A",
  campo: "#65A30D",
  mantenimiento: "#78716C",
  "catalogo-wa": "#0D9488",
  validar: "#334155",
};

export function getLoginAccent(mode: string): string {
  return LOGIN_MODE_ACCENT[mode] ?? "#1e293b";
}

/** Modos con auth propia de producto (JWT en localStorage del producto). */
export const PRODUCT_AUTH_LOGIN_MODES = new Set([
  "taxi",
  "delivery",
  "flotas",
  "academia",
  "agenda",
]);

/** Modos con pestaña portal / ops pública. Taxi/Delivery usan panel multi-rol propio. */
export const PORTAL_SLUG_LOGIN_MODES = new Set([
  "flotas",
  "academia",
  "agenda",
  "recluta",
  "mayorista",
  "preventa",
  "envios",
  "catalogo-wa",
  "taller",
  "campo",
  "despacho",
  "mantenimiento",
  "wms",
]);
