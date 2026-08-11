/** Identidad visual por producto — alineada a loginAccents / landing. */
export type ProductTheme = {
  id: string;
  name: string;
  accent: string;
  accentSoft: string;
  ink: string;
  surface: string;
};

function soft(hex: string, a = 0.12): string {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function theme(
  id: string,
  name: string,
  accent: string,
  surface: string,
  ink = "#1c1917"
): ProductTheme {
  return { id, name, accent, accentSoft: soft(accent), ink, surface };
}

/** Alias de loginMode → productId */
export const PRODUCT_THEME_ALIASES: Record<string, string> = {
  express: "pocket",
  validar: "erp",
};

export function resolveProductThemeId(idOrMode: string): string {
  return PRODUCT_THEME_ALIASES[idOrMode] ?? idOrMode;
}

export const PRODUCT_THEMES: Record<string, ProductTheme> = {
  erp: theme("erp", "ERP", "#1e293b", "#F1F5F9"),
  pocket: theme("pocket", "Pocket", "#f59e0b", "#FFFBEB"),
  ecommerce: theme("ecommerce", "Ecommerce", "#0f766e", "#F0FDFA"),
  "catalogo-wa": theme("catalogo-wa", "Catálogo WA", "#0D9488", "#F0FDFA"),
  sync: theme("sync", "Sync Stock", "#0284C7", "#F0F9FF"),
  mayorista: theme("mayorista", "Mayorista", "#B45309", "#FFFBEB"),
  taller: theme("taller", "Taller", "#EA580C", "#FFF7ED"),
  preventa: theme("preventa", "Preventa", "#E11D48", "#FFF1F2"),
  crm: theme("crm", "CRM", "#2563EB", "#EFF6FF"),
  envios: theme("envios", "Envíos", "#0891B2", "#ECFEFF"),
  wms: theme("wms", "WMS", "#4F46E5", "#EEF2FF"),
  despacho: theme("despacho", "Despacho", "#16A34A", "#F0FDF4"),
  taxi: theme("taxi", "Taxi", "#CA8A04", "#FEFCE8"),
  delivery: theme("delivery", "Delivery", "#F97316", "#FFEDD5"),
  flotas: theme("flotas", "Flotas", "#475569", "#F1F5F9"),
  campo: theme("campo", "Campo", "#65A30D", "#F7FEE7"),
  academia: theme("academia", "Academia", "#7C3AED", "#F5F3FF"),
  agenda: theme("agenda", "Agenda", "#14B8A6", "#CCFBF1"),
  mantenimiento: theme("mantenimiento", "Mantenimiento", "#78716C", "#FAFAF9"),
  recluta: theme("recluta", "Recluta", "#BE123C", "#FFF1F2"),
  atelier: theme("atelier", "Atelier", "#DB2777", "#FDF2F8"),
};

export function getProductTheme(id: string): ProductTheme {
  const resolved = resolveProductThemeId(id);
  return PRODUCT_THEMES[resolved] ?? PRODUCT_THEMES.erp;
}
