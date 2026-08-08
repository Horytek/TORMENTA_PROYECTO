/**
 * Espejo frontend del catálogo canónico Horytek.
 * Mantener alineado con `src/config/horytekProducts.config.js`.
 */

export type Surface = "admin" | "cliente" | "operador" | "publico" | "none";
export type Wave = "existing" | "A" | "B" | "C" | "D" | "E";

export interface HorytekProduct {
  id: string;
  slug: string;
  name: string;
  job: string;
  database: string;
  isolation: string;
  surfaces: Surface[];
  wave: Wave;
  loginMode: string;
  adminPath: string | null;
  clientPath: string | null;
  notIncludes: string[];
  /** Copy corto para landing */
  pitch: string;
}

export interface HorytekBundle {
  id: string;
  name: string;
  productIds: string[];
  buyer: string;
  pitch: string;
}

export const PRODUCT_DEFINITION_OF_DONE = [
  "schema_bd_propia_o_documentada",
  "pool_conexion",
  "api_zod_tenant",
  "admin_ui_completa",
  "cliente_ui_si_aplica",
  "operador_ui_si_aplica",
  "auth_product_picker",
  "entitlement",
  "landing_soluciones",
  "qa_basico",
] as const;

export const HORYTEK_PRODUCTS: HorytekProduct[] = [
  {
    id: "erp",
    slug: "erp",
    name: "ERP",
    job: "Operar negocio (POS, stock, SUNAT, compras)",
    database: "db_tormenta",
    isolation: "id_tenant",
    surfaces: ["admin"],
    wave: "existing",
    loginMode: "erp",
    adminPath: "/dashboard",
    clientPath: null,
    notIncludes: ["tienda online", "app taxis"],
    pitch: "El sistema operativo de tu negocio: ventas, inventario y facturación electrónica.",
  },
  {
    id: "pocket",
    slug: "pocket",
    name: "Pocket",
    job: "Cobrar en feria/móvil con plan corto",
    database: "express_db",
    isolation: "id_tenant",
    surfaces: ["admin"],
    wave: "existing",
    loginMode: "express",
    adminPath: "/express-pos/dashboard",
    clientPath: null,
    notIncludes: ["ERP completo"],
    pitch: "POS ligero para cobrar en feria o en la calle, sin cargar el ERP completo.",
  },
  {
    id: "ecommerce",
    slug: "ecommerce",
    name: "Ecommerce",
    job: "Vender online con checkout Mercado Pago",
    database: "db_ecommerce",
    isolation: "id_tienda",
    surfaces: ["admin", "cliente", "publico"],
    wave: "existing",
    loginMode: "ecommerce",
    adminPath: "/ecommerce-admin",
    clientPath: "/tienda/:slug",
    notIncludes: ["pedido solo por WhatsApp"],
    pitch: "Tienda online propia con checkout Mercado Pago y panel de pedidos.",
  },
  {
    id: "catalogo-wa",
    slug: "catalogo-whatsapp",
    name: "Catálogo WhatsApp",
    job: "Armar pedido y enviar a WhatsApp",
    database: "",
    isolation: "id_tenant",
    surfaces: ["admin", "publico"],
    wave: "existing",
    loginMode: "erp",
    adminPath: "/catalog-express",
    clientPath: "/catalogo/:idTenant",
    notIncludes: ["checkout web", "sync de stock"],
    pitch: "Vitrina pública para que el cliente arme el pedido y lo mande por WhatsApp.",
  },
  {
    id: "sync",
    slug: "sync-stock",
    name: "Sync Stock",
    job: "Unificar stock entre canales para no sobrevender",
    database: "db_sync",
    isolation: "id_tenant",
    surfaces: ["admin"],
    wave: "A",
    loginMode: "erp",
    adminPath: "/platform/sync",
    clientPath: null,
    notIncludes: ["UI de tienda", "pipeline CRM"],
    pitch: "Un solo stock real entre ERP, ecommerce y otros canales — sin sobreventa.",
  },
  {
    id: "mayorista",
    slug: "mayorista",
    name: "Mayorista",
    job: "Pedir B2B con precios por volumen (portal cerrado)",
    database: "db_mayorista",
    isolation: "id_tenant",
    surfaces: ["admin", "cliente"],
    wave: "A",
    loginMode: "mayorista",
    adminPath: "/platform/mayorista",
    clientPath: "/b2b/:slug",
    notIncludes: ["carrito retail ecommerce", "catálogo WA"],
    pitch: "Portal cerrado para distribuidores: listas por volumen y pedidos B2B.",
  },
  {
    id: "taller",
    slug: "taller",
    name: "Taller",
    job: "Fabricar: insumos + OT + mermas",
    database: "db_taller",
    isolation: "id_tenant",
    surfaces: ["admin", "operador"],
    wave: "B",
    loginMode: "erp",
    adminPath: "/platform/taller",
    clientPath: null,
    notIncludes: ["mantenimiento maquinaria", "WMS"],
    pitch: "Órdenes de trabajo, insumos y mermas para plantas de confección o ensamble.",
  },
  {
    id: "preventa",
    slug: "preventa",
    name: "Preventa",
    job: "Reservar y cobrar anticipo de edición limitada",
    database: "db_preventa",
    isolation: "id_tienda",
    surfaces: ["admin", "cliente", "publico"],
    wave: "B",
    loginMode: "ecommerce",
    adminPath: "/platform/preventa",
    clientPath: "/preventa/:slug",
    notIncludes: ["pedido B2B", "delivery on-demand"],
    pitch: "Reservas y anticipos para colecciones o ediciones limitadas.",
  },
  {
    id: "crm",
    slug: "crm",
    name: "CRM",
    job: "Pipeline de ventas + seguimiento + automatización por reglas",
    database: "db_crm",
    isolation: "id_tenant",
    surfaces: ["admin"],
    wave: "B",
    loginMode: "erp",
    adminPath: "/platform/crm",
    clientPath: null,
    notIncludes: ["master de clientes ERP", "marketing IA"],
    pitch: "Pipeline comercial con seguimiento y reglas — sin mezclar el master de clientes del ERP.",
  },
  {
    id: "envios",
    slug: "envios",
    name: "Envíos",
    job: "Generar envío con courier y tracking",
    database: "db_envios",
    isolation: "id_tenant",
    surfaces: ["admin", "publico"],
    wave: "C",
    loginMode: "erp",
    adminPath: "/platform/envios",
    clientPath: "/tracking/:codigo",
    notIncludes: ["app repartidores", "taxis"],
    pitch: "Guías courier y tracking público para el destinatario.",
  },
  {
    id: "wms",
    slug: "wms",
    name: "WMS",
    job: "Operar almacén avanzado (ubicaciones, picking, packing)",
    database: "db_wms",
    isolation: "id_tenant",
    surfaces: ["admin", "operador"],
    wave: "C",
    loginMode: "erp",
    adminPath: "/platform/wms",
    clientPath: null,
    notIncludes: ["inventario kárdex básico", "rutas de calle"],
    pitch: "Ubicaciones, picking y packing cuando el kárdex básico ya no alcanza.",
  },
  {
    id: "despacho",
    slug: "despacho",
    name: "Despacho",
    job: "Optimizar secuencia de paradas del vehículo propio",
    database: "db_despacho",
    isolation: "id_tenant",
    surfaces: ["admin", "operador"],
    wave: "C",
    loginMode: "erp",
    adminPath: "/platform/despacho",
    clientPath: null,
    notIncludes: ["matching conductores terceros", "taxis"],
    pitch: "Rutas del día para tu flota propia — secuencia de paradas, no marketplace.",
  },
  {
    id: "taxi",
    slug: "taxi",
    name: "Taxi",
    job: "Viaje de pasajeros (solicitud ↔ conductor ↔ tracking)",
    database: "db_taxi",
    isolation: "id_operador",
    surfaces: ["admin", "cliente", "operador"],
    wave: "D",
    loginMode: "taxi",
    adminPath: "/taxi-admin",
    clientPath: "/taxi",
    notIncludes: ["encargos de paquetes", "flota corporativa"],
    pitch: "Operación de taxis: pasajero, conductor y sala de control.",
  },
  {
    id: "delivery",
    slug: "delivery",
    name: "Delivery",
    job: "Encargo/reparto on-demand (pedido ↔ repartidor ↔ tracking)",
    database: "db_delivery",
    isolation: "id_operador",
    surfaces: ["admin", "cliente", "operador"],
    wave: "D",
    loginMode: "delivery",
    adminPath: "/delivery-admin",
    clientPath: "/delivery",
    notIncludes: ["envío courier B2B", "viaje de pasajeros"],
    pitch: "Repartos y encargos on-demand con app de cliente y repartidor.",
  },
  {
    id: "flotas",
    slug: "flotas",
    name: "Flotas",
    job: "Administrar vehículos de empresa (seguros, combustible, conductores)",
    database: "db_flotas",
    isolation: "id_empresa_flota",
    surfaces: ["admin", "operador"],
    wave: "D",
    loginMode: "flotas",
    adminPath: "/flotas-admin",
    clientPath: null,
    notIncludes: ["matching marketplace Taxi/Delivery"],
    pitch: "Gestión de vehículos corporativos: documentos, combustible y conductores.",
  },
  {
    id: "campo",
    slug: "campo",
    name: "Campo",
    job: "Marcar asistencia de fuerza de ventas por geolocalización",
    database: "db_campo",
    isolation: "id_tenant",
    surfaces: ["admin", "operador"],
    wave: "E",
    loginMode: "erp",
    adminPath: "/platform/campo",
    clientPath: null,
    notIncludes: ["rutas de despacho", "taxis"],
    pitch: "Asistencias GPS para vendedores en ruta.",
  },
  {
    id: "academia",
    slug: "academia",
    name: "Academia",
    job: "Capacitar en Horytek (cursos, certificaciones)",
    database: "db_academia",
    isolation: "id_org",
    surfaces: ["admin", "cliente"],
    wave: "E",
    loginMode: "academia",
    adminPath: "/academia-admin",
    clientPath: "/academia",
    notIncludes: ["marketplace cursos terceros", "tutorías clínicas"],
    pitch: "Cursos y certificaciones oficiales Horytek para tu equipo.",
  },
  {
    id: "agenda",
    slug: "agenda",
    name: "Agenda",
    job: "Citas 1-a-1 con pago",
    database: "db_agenda",
    isolation: "id_profesional",
    surfaces: ["admin", "cliente"],
    wave: "E",
    loginMode: "agenda",
    adminPath: "/agenda-admin",
    clientPath: "/agenda/:slug",
    notIncludes: ["expediente clínico", "CRM pipeline"],
    pitch: "Reservas 1-a-1 con pago — para profesionales y servicios.",
  },
  {
    id: "mantenimiento",
    slug: "mantenimiento",
    name: "Mantenimiento",
    job: "Mantener maquinaria (preventivo/correctivo + repuestos)",
    database: "db_mantenimiento",
    isolation: "id_tenant",
    surfaces: ["admin", "operador"],
    wave: "E",
    loginMode: "erp",
    adminPath: "/platform/mantenimiento",
    clientPath: null,
    notIncludes: ["producción textil", "flotas vehiculares"],
    pitch: "OT de mantenimiento preventivo y correctivo sobre activos de planta.",
  },
  {
    id: "recluta",
    slug: "recluta",
    name: "Recluta",
    job: "Contratar: vacantes → postulaciones → etapas de selección",
    database: "db_recluta",
    isolation: "id_tenant",
    surfaces: ["admin", "cliente", "publico"],
    wave: "E",
    loginMode: "recluta",
    adminPath: "/platform/recluta",
    clientPath: "/recluta/:slug",
    notIncludes: ["nómina", "asistencia GPS", "cursos Academia", "master empleados ERP"],
    pitch: "Publica vacantes, recibe postulaciones y avanza candidatos por etapas — sin nómina ni RRHH genérico.",
  },
];

export const HORYTEK_BUNDLES: HorytekBundle[] = [
  {
    id: "mostrador",
    name: "Mostrador",
    productIds: ["erp", "catalogo-wa"],
    buyer: "Tienda física",
    pitch: "Cobra en caja y recibe pedidos por WhatsApp desde el mismo stock.",
  },
  {
    id: "omnicanal",
    name: "Omnicanal",
    productIds: ["erp", "ecommerce", "sync", "envios", "preventa"],
    buyer: "Marca con local + web",
    pitch: "Local + tienda online + stock unificado + envíos + preventas.",
  },
  {
    id: "mayorista",
    name: "Mayorista",
    productIds: ["erp", "mayorista"],
    buyer: "Distribuidor / B2B",
    pitch: "ERP operativo más portal B2B con precios por volumen.",
  },
  {
    id: "taller",
    name: "Taller",
    productIds: ["erp", "taller", "mantenimiento"],
    buyer: "Confección / planta",
    pitch: "Producción, mermas y mantenimiento de maquinaria en un paquete.",
  },
  {
    id: "campo",
    name: "Campo",
    productIds: ["pocket", "campo"],
    buyer: "Fuerza de ventas",
    pitch: "Cobro móvil y asistencia GPS para equipos en calle.",
  },
  {
    id: "movilidad-taxi",
    name: "Movilidad Taxi",
    productIds: ["taxi"],
    buyer: "Operador de taxis",
    pitch: "Stack completo de taxis — base propia, sin mezclar con el ERP.",
  },
  {
    id: "movilidad-delivery",
    name: "Movilidad Delivery",
    productIds: ["delivery"],
    buyer: "Repartos / encargos",
    pitch: "Operación de delivery on-demand con apps de cliente y repartidor.",
  },
  {
    id: "academia",
    name: "Academia",
    productIds: ["academia"],
    buyer: "Capacitación Horytek",
    pitch: "Formación certificada para operadores y partners.",
  },
  {
    id: "crm-premium",
    name: "CRM Premium",
    productIds: ["erp", "crm"],
    buyer: "Equipos comerciales",
    pitch: "ERP más pipeline comercial con reglas de seguimiento.",
  },
  {
    id: "talento",
    name: "Talento",
    productIds: ["erp", "recluta"],
    buyer: "PYME que contrata con frecuencia",
    pitch: "ERP operativo más Recluta para vacantes y selección.",
  },
];

export function getProductBySlug(slug: string): HorytekProduct | undefined {
  return HORYTEK_PRODUCTS.find((p) => p.slug === slug || p.id === slug);
}

export function getBundleById(id: string): HorytekBundle | undefined {
  return HORYTEK_BUNDLES.find((b) => b.id === id);
}

export function productsInBundle(bundle: HorytekBundle): HorytekProduct[] {
  return bundle.productIds
    .map((id) => HORYTEK_PRODUCTS.find((p) => p.id === id))
    .filter((p): p is HorytekProduct => Boolean(p));
}

const LOGIN_MODE_META: Record<string, { label: string; description: string; priority: number }> = {
  erp: { label: "ERP", description: "Inventario, POS, SUNAT y operación diaria", priority: 1 },
  express: { label: "Pocket", description: "POS ligero para feria o ruta", priority: 2 },
  ecommerce: { label: "Ecommerce", description: "Panel de tu tienda online", priority: 3 },
  mayorista: { label: "Mayorista", description: "Portal B2B por slug de distribuidor", priority: 4 },
  taxi: { label: "Taxi", description: "Operador, pasajero o conductor", priority: 5 },
  delivery: { label: "Delivery", description: "Encargos, cliente y repartidor", priority: 6 },
  flotas: { label: "Flotas", description: "Vehículos y conductores de empresa", priority: 7 },
  academia: { label: "Academia", description: "Cursos y portal alumno", priority: 8 },
  agenda: { label: "Agenda", description: "Reservas 1-a-1 del profesional", priority: 9 },
  recluta: { label: "Recluta", description: "Vacantes y postulaciones", priority: 10 },
};

/** Una tarjeta por loginMode distinto, derivada del catálogo. */
export function buildLoginProductOptions() {
  const seen = new Map<string, { mode: string; label: string; description: string; href: string; productIds: string[] }>();
  for (const p of HORYTEK_PRODUCTS) {
    const meta = LOGIN_MODE_META[p.loginMode] || {
      label: p.name,
      description: p.job,
      priority: 50,
    };
    if (!seen.has(p.loginMode)) {
      seen.set(p.loginMode, {
        mode: p.loginMode,
        label: meta.label,
        description: meta.description,
        href: `/login?mode=${p.loginMode}`,
        productIds: [p.id],
      });
    } else {
      seen.get(p.loginMode)!.productIds.push(p.id);
    }
  }
  return [...seen.values()].sort(
    (a, b) => (LOGIN_MODE_META[a.mode]?.priority ?? 99) - (LOGIN_MODE_META[b.mode]?.priority ?? 99)
  );
}

export const LOGIN_PRODUCT_OPTIONS = buildLoginProductOptions();

/** @deprecated Todos los productos son in-page vía useLandingProduct + registry. */
export const LANDING_INLINE_MODES = {
  erp: "standard",
  pocket: "pocket",
  ecommerce: "ecommerce",
} as const;
