/**
 * Fuente única de la navegación del sistema (sidebar + búsqueda global).
 *
 * Antes, `AppSidebar.tsx` y `searchableRoutes.ts` tenían cada uno su propio
 * array hardcodeado con {título, url, ícono, capability} — había que
 * sincronizarlos a mano cada vez que se agregaba un módulo (y de hecho ya
 * estaban desincronizados: "Usuarios"/"Roles" tenían capabilities distintas
 * en cada archivo). Acá se arma la navegación a partir del catálogo real de
 * módulos (`GET /rutas/modulos`, ya usado para calcular `capabilities`) — la
 * única pieza que sigue siendo estática es `MODULE_META`, porque la tabla
 * `modulo` no guarda ícono/URL/agrupación visual, solo `nombre` y `ruta`.
 *
 * Agregar un módulo nuevo en BD (ej. Contabilidad) + una entrada acá alcanza
 * para que aparezca en sidebar y buscador — ya no hay que tocar dos archivos.
 */
import type { ComponentType } from "react";
import {
  Home,
  Tags,
  Warehouse,
  Package,
  FileSpreadsheet,
  Settings,
  ShoppingCart,
  ClipboardList,
  Truck,
  Building,
  User,
  Users,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import type { RouteModule } from "@/api/rutas";

export type NavIcon = ComponentType<{ className?: string }>;

export interface NavItem {
  title: string;
  url: string;
  group: string;
  icon: NavIcon;
  /** slug base para chequear `${capability}.view` en `useUserStore.capabilities`. */
  capability?: string;
  keywords?: string[];
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export interface ModuleMeta {
  url: string;
  icon: NavIcon;
  group: string;
  title?: string;
  keywords?: string[];
}

/**
 * slug normalizado (minúsculas, sin "/" inicial) → metadata visual/routing.
 * `title` es SIEMPRE explícito acá — no se usa `nombre`/`nombre_sub` de BD
 * como fallback porque esos campos tienen inconsistencias reales de datos
 * (ej. el módulo con ruta "/proveedores" está guardado con
 * nombre_modulo="Config. Negocio" en producción). Confiar en el nombre de
 * BD para el label visual heredaría ese tipo de errores de datos.
 */
const MODULE_META: Record<string, ModuleMeta> = {
  "productos": { url: "/products", icon: Tags, group: "General", title: "Productos", keywords: ["sku", "catálogo", "stock"] },
  "ventas": { url: "/sales", icon: ShoppingCart, group: "General", title: "Punto de Venta (POS)", keywords: ["caja", "cobrar", "vender"] },
  "almacen": { url: "/inventory", icon: Package, group: "Logística", title: "Inventario / Kárdex", keywords: ["stock", "movimientos", "kardex"] },
  "almaceng": { url: "/logistics/warehouses", icon: Warehouse, group: "Logística", title: "Almacenes" },
  "nota_almacen": { url: "/logistics/warehouse-notes", icon: ClipboardList, group: "Logística", title: "Notas de Almacén", keywords: ["ingreso", "salida", "traslado"] },
  "guia_remision": { url: "/logistics/guides", icon: Truck, group: "Logística", title: "Guías de Remisión", keywords: ["despacho", "transporte", "sunat"] },
  "sucursal": { url: "/logistics/branches", icon: Building, group: "Logística", title: "Sucursales", keywords: ["tienda", "sede"] },
  "clientes": { url: "/people/clients", icon: User, group: "Personas", title: "Clientes" },
  "proveedores": { url: "/people/providers", icon: Users, group: "Personas", title: "Proveedores" },
  "empleados": { url: "/people/employees", icon: Users, group: "Personas", title: "Empleados", keywords: ["trabajadores", "rrhh"] },
  "reportes": { url: "/reports/sales", icon: FileSpreadsheet, group: "Reportes", title: "Historial de Ventas" },
  "contabilidad": { url: "/accounting", icon: Wallet, group: "Reportes", title: "Contabilidad", keywords: ["gastos", "egresos", "ganancias", "finanzas"] },
  "configuracion/usuarios": { url: "/settings/users", icon: Users, group: "Ajustes", title: "Usuarios" },
  "configuracion/roles": { url: "/settings/roles", icon: ShieldAlert, group: "Ajustes", title: "Roles y Permisos" },
  "configuracion/negocio": { url: "/settings/system", icon: Settings, group: "Ajustes", title: "Configuración" },
};

export const SECTION_ORDER = ["General", "Logística", "Personas", "Reportes", "Ajustes"];

export function normalizeSlug(ruta?: string | null): string {
  if (!ruta) return "";
  return ruta.toString().toLowerCase().replace(/^\/+/, "");
}

/** true si ese módulo/submódulo (por su `ruta` en BD) tiene una pantalla real hoy en client-v2. */
export function isActiveInClientV2(ruta?: string | null): boolean {
  return normalizeSlug(ruta) in MODULE_META;
}

/** Metadata del sidebar (grupo, título, ícono) para ese módulo/submódulo, si tiene pantalla en client-v2. */
export function getModuleMeta(ruta?: string | null): ModuleMeta | undefined {
  return MODULE_META[normalizeSlug(ruta)];
}

/** Recorre módulos + submódulos del catálogo buscando metadata mapeada. */
function collectMappedItems(catalog: RouteModule[]): { slug: string; nombre: string; meta: ModuleMeta }[] {
  const out: { slug: string; nombre: string; meta: ModuleMeta }[] = [];
  for (const modulo of catalog) {
    const moduloSlug = normalizeSlug(modulo.ruta);
    if (MODULE_META[moduloSlug]) {
      out.push({ slug: moduloSlug, nombre: modulo.nombre, meta: MODULE_META[moduloSlug] });
    }
    for (const sub of modulo.submodulos ?? []) {
      const subSlug = normalizeSlug(sub.ruta);
      if (MODULE_META[subSlug]) {
        out.push({ slug: subSlug, nombre: sub.nombre_sub, meta: MODULE_META[subSlug] });
      }
    }
  }
  return out;
}

/** Arma las secciones del sidebar a partir del catálogo real de módulos. */
export function buildNavSections(catalog: RouteModule[]): NavSection[] {
  const groups = new Map<string, NavItem[]>();
  groups.set("General", [{ title: "Inicio", url: "/dashboard", icon: Home, group: "General" }]);

  const seenUrls = new Set<string>(["/dashboard"]);
  for (const { slug, nombre, meta } of collectMappedItems(catalog)) {
    if (seenUrls.has(meta.url)) continue; // un módulo puede tener 2 submódulos con la misma pantalla
    seenUrls.add(meta.url);
    const list = groups.get(meta.group) ?? [];
    list.push({
      title: meta.title ?? nombre ?? slug,
      url: meta.url,
      icon: meta.icon,
      group: meta.group,
      capability: slug,
      keywords: meta.keywords,
    });
    groups.set(meta.group, list);
  }

  return SECTION_ORDER
    .map((label) => ({ label, items: groups.get(label) ?? [] }))
    .filter((section) => section.items.length > 0);
}

/** Arma la lista plana para el buscador global (Ctrl/⌘+K). */
export function buildSearchableRoutes(catalog: RouteModule[]): NavItem[] {
  return buildNavSections(catalog).flatMap((section) => section.items);
}
