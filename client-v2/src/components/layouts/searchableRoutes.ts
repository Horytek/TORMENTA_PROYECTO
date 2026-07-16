/**
 * Utilidades de búsqueda del CommandDialog de la Navbar (Ctrl/⌘+K).
 * El catálogo de rutas en sí ya no vive acá — se deriva dinámicamente del
 * catálogo real de módulos vía `navigationCatalog.ts` (ver
 * `buildSearchableRoutes`), consumido directamente por `SearchCommandDialog.tsx`.
 */
import type { NavItem } from "@/lib/navigationCatalog";

/** Alias para no romper imports existentes de `SearchableRoute`. */
export type SearchableRoute = NavItem;

const RECENT_KEY = "navbar_recent_searches";
const MAX_RECENT = 5;

/** Recientes persistidos en localStorage (solo URLs). */
export function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function pushRecentSearch(url: string): void {
  try {
    const current = getRecentSearches().filter((u) => u !== url);
    const next = [url, ...current].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    /* ignore */
  }
}

/** Normaliza texto para comparación (sin acentos, minúsculas). */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Score simple: mayor = mejor coincidencia. 0 = sin match. */
function scoreRoute(route: SearchableRoute, q: string): number {
  if (!q) return 1;
  const title = norm(route.title);
  const group = norm(route.group);
  const url = norm(route.url);
  const keywords = (route.keywords ?? []).map(norm);

  if (title === q) return 100;
  if (title.startsWith(q)) return 60;
  if (title.includes(q)) return 40;
  if (group.includes(q)) return 20;
  if (url.includes(q)) return 15;
  if (keywords.some((k) => k.includes(q))) return 25;
  return 0;
}

export function searchRoutes(
  routes: SearchableRoute[],
  query: string
): SearchableRoute[] {
  const q = norm(query.trim());
  if (!q) return routes;
  return routes
    .map((r) => ({ r, s: scoreRoute(r, q) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.r);
}