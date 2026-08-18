/**
 * Deep links a demos seedables (npm run seed:platform-demo).
 * Usado en Soluciones y Experience CTAs.
 */
export const DEMO_LINKS: Record<
  string,
  { label: string; href: string; kind: "portal" | "admin" | "ops" }[]
> = {
  taxi: [
    { label: "Portal pasajero", href: "/taxi/demo", kind: "portal" },
    { label: "App conductor", href: "/taxi/demo/conductor", kind: "ops" },
    { label: "Sala de control", href: "/login?mode=taxi", kind: "admin" },
  ],
  delivery: [
    { label: "Portal cliente", href: "/delivery/demo", kind: "portal" },
    { label: "App repartidor", href: "/delivery/demo/repartidor", kind: "ops" },
    { label: "Admin delivery", href: "/login?mode=delivery", kind: "admin" },
  ],
  flotas: [{ label: "Admin flotas", href: "/login?mode=flotas", kind: "admin" }],
  academia: [
    { label: "Portal alumno", href: "/academia/demo", kind: "portal" },
    { label: "Admin academia", href: "/login?mode=academia", kind: "admin" },
  ],
  agenda: [
    { label: "Reservar cita", href: "/agenda/demo", kind: "portal" },
    { label: "Admin agenda", href: "/login?mode=agenda", kind: "admin" },
  ],
  mayorista: [
    { label: "Portal B2B", href: "/b2b/demo", kind: "portal" },
    { label: "Admin mayorista", href: "/mayorista-admin", kind: "admin" },
  ],
  preventa: [
    { label: "Campaña pública", href: "/preventa/demo", kind: "portal" },
    { label: "Admin preventa", href: "/platform/preventa", kind: "admin" },
  ],
  envios: [
    { label: "Tracking DEMO01", href: "/tracking/DEMO01", kind: "portal" },
    { label: "Admin envíos", href: "/platform/envios", kind: "admin" },
  ],
  recluta: [
    { label: "Portal vacantes", href: "/recluta/demo", kind: "portal" },
    { label: "Admin recluta", href: "/platform/recluta", kind: "admin" },
  ],
  sync: [{ label: "Admin sync", href: "/platform/sync", kind: "admin" }],
  crm: [{ label: "Admin CRM", href: "/platform/crm", kind: "admin" }],
  taller: [
    { label: "Planta", href: "/taller/planta", kind: "ops" },
    { label: "Admin taller", href: "/platform/taller", kind: "admin" },
  ],
  wms: [
    { label: "Operario", href: "/wms/operario", kind: "ops" },
    { label: "Admin WMS", href: "/platform/wms", kind: "admin" },
  ],
  despacho: [
    { label: "App chofer", href: "/despacho/chofer", kind: "ops" },
    { label: "Admin despacho", href: "/platform/despacho", kind: "admin" },
  ],
  campo: [
    { label: "App vendedor", href: "/campo/vendedor", kind: "ops" },
    { label: "Admin campo", href: "/platform/campo", kind: "admin" },
  ],
  mantenimiento: [
    { label: "App técnico", href: "/mantenimiento/tecnico", kind: "ops" },
    { label: "Admin mantto", href: "/platform/mantenimiento", kind: "admin" },
  ],
  erp: [{ label: "Ingresar ERP", href: "/login?mode=erp", kind: "admin" }],
  "catalogo-wa": [{ label: "Catálogo demo", href: "/catalogo/1", kind: "portal" }],
  atelier: [
    { label: "Login Atelier", href: "/login?mode=atelier", kind: "portal" },
    { label: "Descubrir", href: "/atelier", kind: "portal" },
    { label: "Estudio creador", href: "/atelier/creador", kind: "ops" },
    { label: "Admin Atelier", href: "/atelier-admin", kind: "admin" },
  ],
};

export function demoLinksForProduct(productId: string) {
  return DEMO_LINKS[productId] ?? [];
}
