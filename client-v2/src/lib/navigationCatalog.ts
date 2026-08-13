/**
 * Fuente única de la navegación del sistema (sidebar + búsqueda global).
 *
 * `modulo`/`submodulos` ya guardan su propia metadata visual (icon/group_name/
 * sort_order/frontend_route/is_visible — ver migration_006_catalog_metadata.js),
 * así que agregar un módulo nuevo desde el panel Developer alcanza para que
 * aparezca en sidebar y buscador, sin tocar código. `MODULE_META` se conserva
 * solo como fallback (módulos aún no migrados) y como fuente de `keywords`
 * para el buscador, que la BD no guarda.
 */
import {
  Home,
  Tags,
  Warehouse,
  Package,
  FileSpreadsheet,
  ShoppingCart,
  ClipboardList,
  Truck,
  Building,
  Building2,
  User,
  Users,
  ShieldAlert,
  Wallet,
  RotateCcw,
  HandCoins,
  ArrowLeftRight,
  MessageCircle,
  Store,
  RefreshCw,
  Factory,
  Handshake,
  PackageSearch,
  Route,
  MapPin,
  Wrench,
  UserPlus,
  CalendarClock,
} from "lucide-react";
import type { RouteModule, CatalogMeta } from "@/api/rutas";
import { getIcon, type NavIcon } from "@/lib/iconRegistry";

export type { NavIcon };

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
  "catalogo": { url: "/catalog-express", icon: Store, group: "General", title: "Tienda web", keywords: ["whatsapp", "catalogo", "tienda", "vitrina", "pedidos", "ecommerce"] },
  "stock-sync": { url: "/platform/sync", icon: RefreshCw, group: "Plataforma", title: "Sync Stock", keywords: ["sync", "stock", "canales", "sobrevende"] },
  "mayorista": { url: "/mayorista-admin", icon: Store, group: "Plataforma", title: "Mayorista B2B", keywords: ["b2b", "mayorista", "lista", "volumen"] },
  "taller": { url: "/platform/taller", icon: Factory, group: "Plataforma", title: "Taller", keywords: ["ot", "insumos", "merma", "planta", "fabricación"] },
  "preventa": { url: "/platform/preventa", icon: CalendarClock, group: "Plataforma", title: "Preventa", keywords: ["reserva", "anticipo", "edición limitada", "campaña"] },
  "crm": { url: "/platform/crm", icon: Handshake, group: "Plataforma", title: "CRM", keywords: ["pipeline", "deal", "seguimiento", "ventas"] },
  "envios": { url: "/platform/envios", icon: Truck, group: "Plataforma", title: "Envíos", keywords: ["courier", "guía", "tracking", "paquete"] },
  "wms": { url: "/platform/wms", icon: PackageSearch, group: "Plataforma", title: "WMS", keywords: ["picking", "packing", "ubicación", "almacén"] },
  "despacho": { url: "/platform/despacho", icon: Route, group: "Plataforma", title: "Despacho", keywords: ["ruta", "parada", "chofer", "flota propia"] },
  "campo": { url: "/platform/campo", icon: MapPin, group: "Plataforma", title: "Campo", keywords: ["gps", "checkin", "vendedor", "asistencia"] },
  "mantenimiento": { url: "/platform/mantenimiento", icon: Wrench, group: "Plataforma", title: "Mantenimiento", keywords: ["activo", "preventivo", "correctivo", "máquina"] },
  "recluta": { url: "/platform/recluta", icon: UserPlus, group: "Plataforma", title: "Recluta", keywords: ["vacante", "postulación", "selección", "rrhh"] },
  "ventas": { url: "/sales", icon: ShoppingCart, group: "General", title: "Punto de Venta (POS)", keywords: ["caja", "cobrar", "vender"] },
  "devoluciones": { url: "/sales/returns", icon: RotateCcw, group: "General", title: "Devoluciones", keywords: ["reembolso", "nota de crédito", "cambio", "retorno"] },
  "almacen": { url: "/inventory", icon: Package, group: "Logística", title: "Inventario / Kárdex", keywords: ["stock", "movimientos", "kardex"] },
  "almacen/movimientos": { url: "/inventory/movements", icon: ArrowLeftRight, group: "Logística", title: "Movimientos e Inventarios", keywords: ["transferencia", "conteo", "ciego", "auditoría"] },
  "almaceng": { url: "/logistics/warehouses", icon: Warehouse, group: "Logística", title: "Almacenes" },
  "nota_almacen": { url: "/logistics/warehouse-notes", icon: ClipboardList, group: "Logística", title: "Notas de Almacén", keywords: ["ingreso", "salida", "traslado"] },
  "guia_remision": { url: "/logistics/guides", icon: Truck, group: "Logística", title: "Guías de Remisión", keywords: ["despacho", "transporte", "sunat"] },
  "sucursal": { url: "/logistics/branches", icon: Building, group: "Logística", title: "Sucursales", keywords: ["tienda", "sede"] },
  "compras/ordenes": { url: "/purchases/orders", icon: ClipboardList, group: "Logística", title: "Órdenes de Compra", keywords: ["proveedor", "compra", "recepción"] },
  "compras/facturas": { url: "/purchases/invoices", icon: FileSpreadsheet, group: "Logística", title: "Facturas de Compra", keywords: ["proveedor", "factura"] },
  "compras/cuentas-por-pagar": { url: "/purchases/accounts-payable", icon: Wallet, group: "Logística", title: "Cuentas por Pagar", keywords: ["deuda", "pago", "proveedor"] },
  "compras/anticipos": { url: "/purchases/advances", icon: HandCoins, group: "Logística", title: "Anticipos a Proveedor", keywords: ["adelanto", "pago", "proveedor"] },
  "clientes": { url: "/people/clients", icon: User, group: "Personas", title: "Clientes" },
  "proveedores": { url: "/people/providers", icon: Users, group: "Personas", title: "Proveedores" },
  "empleados": { url: "/people/employees", icon: Users, group: "Personas", title: "Empleados", keywords: ["trabajadores", "rrhh"] },
  "reportes": { url: "/reports/sales", icon: FileSpreadsheet, group: "Reportes", title: "Historial de Ventas" },
  "contabilidad": { url: "/accounting", icon: Wallet, group: "Reportes", title: "Contabilidad", keywords: ["gastos", "egresos", "ganancias", "finanzas"] },
  "comprobantes": { url: "/sales/comprobantes", icon: getIcon("FileCheck2"), group: "Reportes", title: "Comprobantes Electrónicos", keywords: ["sunat", "factura", "boleta", "cdr", "cpe"] },
  "configuracion/usuarios": { url: "/settings/users", icon: Users, group: "Ajustes", title: "Usuarios" },
  "configuracion/roles": { url: "/settings/roles", icon: ShieldAlert, group: "Ajustes", title: "Roles y Permisos" },
  "configuracion/negocio": { url: "/settings/system", icon: Building2, group: "Ajustes", title: "Configuración de la Empresa", keywords: ["empresa", "ruc", "negocio", "razón social", "logo", "datos", "sistema"] },
  "configuracion/empresa": { url: "/settings/system", icon: Building2, group: "Ajustes", title: "Configuración de la Empresa", keywords: ["empresa", "ruc", "negocio", "razón social", "logo", "datos", "sistema"] },
  "empresa": { url: "/settings/system", icon: Building2, group: "Ajustes", title: "Configuración de la Empresa", keywords: ["empresa", "ruc", "negocio", "razón social", "logo", "datos", "sistema"] },
  "negocio": { url: "/settings/system", icon: Building2, group: "Ajustes", title: "Configuración de la Empresa", keywords: ["empresa", "ruc", "negocio", "razón social", "logo", "datos", "sistema"] },
};

export const SECTION_ORDER = ["General", "Logística", "Personas", "Reportes", "Plataforma", "Ajustes"];

/**
 * Productos Horytek con consola propia (PlatformShell / admin aparte).
 * Siguen en MODULE_META para permisos y el panel Developer, pero no se
 * mezclan en el sidebar ni en el buscador del ERP.
 */
export function isStandaloneProductNav(meta: Pick<ModuleMeta, "group" | "url">): boolean {
  if (meta.group === "Plataforma") return true;
  return (
    meta.url.startsWith("/platform/") ||
    meta.url.startsWith("/mayorista-admin")
  );
}

export function normalizeSlug(ruta?: string | null): string {
  if (!ruta) return "";
  return ruta.toString().toLowerCase().replace(/^\/+/, "");
}

type CatalogRow = CatalogMeta & { nombre?: string; nombre_sub?: string };

/** true si ese módulo/submódulo tiene una pantalla real hoy en client-v2 y no está oculto. */
export function isActiveInClientV2(ruta?: string | null, row?: CatalogRow): boolean {
  if (row?.frontend_route) return row.is_visible !== false;
  return normalizeSlug(ruta) in MODULE_META;
}

/**
 * Metadata del sidebar (grupo, título, ícono) para ese módulo/submódulo.
 * Prioriza la metadata dinámica de BD (`row`) sobre `MODULE_META`; conserva
 * `title`/`keywords` curados del mapa estático cuando existen (más confiables
 * que `nombre_modulo`, que tiene inconsistencias reales de datos legado).
 */
export function getModuleMeta(ruta?: string | null, row?: CatalogRow): ModuleMeta | undefined {
  const slug = normalizeSlug(ruta);
  const staticMeta = MODULE_META[slug];

  if (row?.frontend_route && row.is_visible !== false) {
    return {
      url: row.frontend_route,
      icon: row.icon ? getIcon(row.icon) : staticMeta?.icon ?? getIcon(null),
      group: row.group_name || staticMeta?.group || "General",
      title: staticMeta?.title ?? row.nombre_sub ?? row.nombre,
      keywords: staticMeta?.keywords,
    };
  }
  return staticMeta;
}

/** Recorre módulos + submódulos del catálogo buscando metadata (dinámica o del mapa estático). */
function collectMappedItems(catalog: RouteModule[]): { slug: string; nombre: string; meta: ModuleMeta; sortOrder: number }[] {
  const out: { slug: string; nombre: string; meta: ModuleMeta; sortOrder: number }[] = [];
  for (const modulo of catalog) {
    const moduloSlug = normalizeSlug(modulo.ruta);
    const moduloMeta = getModuleMeta(modulo.ruta, modulo);
    if (moduloMeta) {
      out.push({ slug: moduloSlug, nombre: modulo.nombre, meta: moduloMeta, sortOrder: modulo.sort_order ?? 0 });
    }
    for (const sub of modulo.submodulos ?? []) {
      const subSlug = normalizeSlug(sub.ruta);
      const subMeta = getModuleMeta(sub.ruta, { ...sub, nombre_sub: sub.nombre_sub });
      if (subMeta) {
        out.push({ slug: subSlug, nombre: sub.nombre_sub, meta: subMeta, sortOrder: sub.sort_order ?? 0 });
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
  const items = collectMappedItems(catalog).sort((a, b) => a.sortOrder - b.sortOrder);
  for (const { slug, nombre, meta } of items) {
    if (isStandaloneProductNav(meta)) continue;
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
