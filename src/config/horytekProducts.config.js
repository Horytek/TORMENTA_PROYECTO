/**
 * Catálogo canónico de productos Horytek.
 * Un producto = un job. Bundles solo componen. Sin IA.
 * Fuente de verdad compartida backend (y espejo en client-v2).
 */

/** @typedef {"erp"|"pocket"|"ecommerce"|"producto"} ProductKind */
/** @typedef {"admin"|"cliente"|"operador"|"publico"|"none"} Surface */

/**
 * @typedef {object} HorytekProduct
 * @property {string} id
 * @property {string} slug
 * @property {string} name
 * @property {string} job
 * @property {string} database  DATABASE MySQL (vacío si reusa ERP)
 * @property {string} envKey    process.env key for DB name
 * @property {string} isolation tenant key
 * @property {Surface[]} surfaces
 * @property {string} wave      A|B|C|D|E|existing
 * @property {string} loginMode ProductPicker mode key
 * @property {string|null} adminPath
 * @property {string|null} clientPath
 * @property {string[]} notIncludes
 */

/** @type {HorytekProduct[]} */
export const HORYTEK_PRODUCTS = [
  {
    id: "erp",
    slug: "erp",
    name: "ERP",
    job: "Operar negocio (POS, stock, SUNAT, compras)",
    database: "db_tormenta",
    envKey: "DB_DATABASE",
    isolation: "id_tenant",
    surfaces: ["admin"],
    wave: "existing",
    loginMode: "erp",
    adminPath: "/dashboard",
    clientPath: null,
    notIncludes: ["tienda online", "app taxis"],
  },
  {
    id: "pocket",
    slug: "pocket",
    name: "Pocket",
    job: "Cobrar en feria/móvil con plan corto",
    database: "express_db",
    envKey: "EXPRESS_DB_DATABASE",
    isolation: "id_tenant",
    surfaces: ["admin"],
    wave: "existing",
    loginMode: "express",
    adminPath: "/express-pos/dashboard",
    clientPath: null,
    notIncludes: ["ERP completo"],
  },
  {
    id: "ecommerce",
    slug: "ecommerce",
    name: "Ecommerce",
    job: "Vender online con checkout Mercado Pago",
    database: "db_ecommerce",
    envKey: "ECOMMERCE_DB_DATABASE",
    isolation: "id_tienda",
    surfaces: ["admin", "cliente", "publico"],
    wave: "existing",
    loginMode: "ecommerce",
    adminPath: "/ecommerce-admin",
    clientPath: "/tienda/:slug",
    notIncludes: ["pedido solo por WhatsApp"],
  },
  {
    id: "catalogo-wa",
    slug: "catalogo-whatsapp",
    name: "Catálogo WhatsApp",
    job: "Vitrina pública con checkout web, WhatsApp y ventas ERP",
    database: "",
    envKey: "",
    isolation: "id_tenant",
    surfaces: ["admin", "publico", "cliente"],
    wave: "existing",
    loginMode: "catalogo-wa",
    adminPath: "/catalog-express",
    clientPath: "/c/:slug",
    notIncludes: ["SaaS multi-tienda independiente"],
  },
  {
    id: "sync",
    slug: "sync-stock",
    name: "Sync Stock",
    job: "Unificar stock entre canales para no sobrevender",
    database: "db_sync",
    envKey: "SYNC_DB_DATABASE",
    isolation: "id_tenant",
    surfaces: ["admin"],
    wave: "A",
    loginMode: "sync",
    adminPath: "/platform/sync",
    clientPath: null,
    notIncludes: ["UI de tienda", "pipeline CRM"],
  },
  {
    id: "mayorista",
    slug: "mayorista",
    name: "Mayorista",
    job: "Pedir B2B con precios por volumen (portal cerrado)",
    database: "db_mayorista",
    envKey: "MAYORISTA_DB_DATABASE",
    isolation: "id_tenant",
    surfaces: ["admin", "cliente"],
    wave: "A",
    loginMode: "mayorista",
    adminPath: "/mayorista-admin",
    clientPath: "/b2b/:slug",
    notIncludes: ["carrito retail ecommerce", "catálogo WA"],
  },
  {
    id: "taller",
    slug: "taller",
    name: "Taller",
    job: "Fabricar: insumos + OT + mermas",
    database: "db_taller",
    envKey: "TALLER_DB_DATABASE",
    isolation: "id_tenant",
    surfaces: ["admin", "operador"],
    wave: "B",
    loginMode: "taller",
    adminPath: "/platform/taller",
    clientPath: null,
    notIncludes: ["mantenimiento maquinaria", "WMS"],
  },
  {
    id: "preventa",
    slug: "preventa",
    name: "Preventa",
    job: "Reservar y cobrar anticipo de edición limitada",
    database: "db_preventa",
    envKey: "PREVENTA_DB_DATABASE",
    isolation: "id_tienda",
    surfaces: ["admin", "cliente", "publico"],
    wave: "B",
    loginMode: "preventa",
    adminPath: "/platform/preventa",
    clientPath: "/preventa/:slug",
    notIncludes: ["pedido B2B", "delivery on-demand"],
  },
  {
    id: "crm",
    slug: "crm",
    name: "CRM",
    job: "Pipeline de ventas + seguimiento + automatización por reglas",
    database: "db_crm",
    envKey: "CRM_DB_DATABASE",
    isolation: "id_tenant",
    surfaces: ["admin"],
    wave: "B",
    loginMode: "crm",
    adminPath: "/platform/crm",
    clientPath: null,
    notIncludes: ["master de clientes ERP", "marketing IA"],
  },
  {
    id: "envios",
    slug: "envios",
    name: "Envíos",
    job: "Generar envío con courier y tracking",
    database: "db_envios",
    envKey: "ENVIOS_DB_DATABASE",
    isolation: "id_tenant",
    surfaces: ["admin", "publico"],
    wave: "C",
    loginMode: "envios",
    adminPath: "/platform/envios",
    clientPath: "/tracking/:codigo",
    notIncludes: ["app repartidores", "taxis"],
  },
  {
    id: "wms",
    slug: "wms",
    name: "WMS",
    job: "Operar almacén avanzado (ubicaciones, picking, packing)",
    database: "db_wms",
    envKey: "WMS_DB_DATABASE",
    isolation: "id_tenant",
    surfaces: ["admin", "operador"],
    wave: "C",
    loginMode: "wms",
    adminPath: "/platform/wms",
    clientPath: null,
    notIncludes: ["inventario kárdex básico", "rutas de calle"],
  },
  {
    id: "despacho",
    slug: "despacho",
    name: "Despacho",
    job: "Optimizar secuencia de paradas del vehículo propio",
    database: "db_despacho",
    envKey: "DESPACHO_DB_DATABASE",
    isolation: "id_tenant",
    surfaces: ["admin", "operador"],
    wave: "C",
    loginMode: "despacho",
    adminPath: "/platform/despacho",
    clientPath: null,
    notIncludes: ["matching conductores terceros", "taxis"],
  },
  {
    id: "taxi",
    slug: "taxi",
    name: "Taxi",
    job: "Viaje de pasajeros (solicitud ↔ conductor ↔ tracking)",
    database: "db_taxi",
    envKey: "TAXI_DB_DATABASE",
    isolation: "id_operador",
    surfaces: ["admin", "cliente", "operador"],
    wave: "D",
    loginMode: "taxi",
    adminPath: "/taxi-admin",
    clientPath: "/taxi",
    notIncludes: ["encargos de paquetes", "flota corporativa"],
  },
  {
    id: "delivery",
    slug: "delivery",
    name: "Delivery",
    job: "Encargo/reparto on-demand (pedido ↔ repartidor ↔ tracking)",
    database: "db_delivery",
    envKey: "DELIVERY_DB_DATABASE",
    isolation: "id_operador",
    surfaces: ["admin", "cliente", "operador"],
    wave: "D",
    loginMode: "delivery",
    adminPath: "/delivery-admin",
    clientPath: "/delivery",
    notIncludes: ["envío courier B2B", "viaje de pasajeros"],
  },
  {
    id: "flotas",
    slug: "flotas",
    name: "Flotas",
    job: "Administrar vehículos de empresa (seguros, combustible, conductores)",
    database: "db_flotas",
    envKey: "FLOTAS_DB_DATABASE",
    isolation: "id_empresa_flota",
    surfaces: ["admin", "operador"],
    wave: "D",
    loginMode: "flotas",
    adminPath: "/flotas-admin",
    clientPath: null,
    notIncludes: ["matching marketplace Taxi/Delivery"],
  },
  {
    id: "campo",
    slug: "campo",
    name: "Campo",
    job: "Marcar asistencia de fuerza de ventas por geolocalización",
    database: "db_campo",
    envKey: "CAMPO_DB_DATABASE",
    isolation: "id_tenant",
    surfaces: ["admin", "operador"],
    wave: "E",
    loginMode: "campo",
    adminPath: "/platform/campo",
    clientPath: null,
    notIncludes: ["rutas de despacho", "taxis"],
  },
  {
    id: "academia",
    slug: "academia",
    name: "Academia",
    job: "Capacitar en Horytek (cursos, certificaciones)",
    database: "db_academia",
    envKey: "ACADEMIA_DB_DATABASE",
    isolation: "id_org",
    surfaces: ["admin", "cliente"],
    wave: "E",
    loginMode: "academia",
    adminPath: "/academia-admin",
    clientPath: "/academia",
    notIncludes: ["marketplace cursos terceros", "tutorías clínicas"],
  },
  {
    id: "agenda",
    slug: "agenda",
    name: "Agenda",
    job: "Citas 1-a-1 con pago",
    database: "db_agenda",
    envKey: "AGENDA_DB_DATABASE",
    isolation: "id_profesional",
    surfaces: ["admin", "cliente"],
    wave: "E",
    loginMode: "agenda",
    adminPath: "/agenda-admin",
    clientPath: "/agenda/:slug",
    notIncludes: ["expediente clínico", "CRM pipeline"],
  },
  {
    id: "mantenimiento",
    slug: "mantenimiento",
    name: "Mantenimiento",
    job: "Mantener maquinaria (preventivo/correctivo + repuestos)",
    database: "db_mantenimiento",
    envKey: "MANTENIMIENTO_DB_DATABASE",
    isolation: "id_tenant",
    surfaces: ["admin", "operador"],
    wave: "E",
    loginMode: "mantenimiento",
    adminPath: "/platform/mantenimiento",
    clientPath: null,
    notIncludes: ["producción textil", "flotas vehiculares"],
  },
  {
    id: "recluta",
    slug: "recluta",
    name: "Recluta",
    job: "Contratar: vacantes → postulaciones → etapas de selección",
    database: "db_recluta",
    envKey: "RECLUTA_DB_DATABASE",
    isolation: "id_tenant",
    surfaces: ["admin", "cliente", "publico"],
    wave: "E",
    loginMode: "recluta",
    adminPath: "/platform/recluta",
    clientPath: "/recluta/:slug",
    notIncludes: ["nómina", "asistencia GPS", "cursos Academia", "master empleados ERP"],
  },
  {
    id: "atelier",
    slug: "atelier",
    name: "Atelier",
    job: "Marketplace de dibujos e ilustraciones por encargo",
    database: "db_atelier",
    envKey: "ATELIER_DB_DATABASE",
    isolation: "id_user",
    surfaces: ["admin", "cliente", "operador", "publico"],
    wave: "E",
    loginMode: "atelier",
    adminPath: "/atelier-admin",
    clientPath: "/atelier",
    notIncludes: ["stock físico", "facturación SUNAT", "ERP inventario"],
  },
];

/** @type {{ id: string, name: string, productIds: string[], buyer: string }[]} */
export const HORYTEK_BUNDLES = [
  { id: "mostrador", name: "Mostrador", productIds: ["erp", "catalogo-wa"], buyer: "Tienda física" },
  {
    id: "omnicanal",
    name: "Omnicanal",
    productIds: ["erp", "ecommerce", "sync", "envios", "preventa"],
    buyer: "Marca con local + web",
  },
  { id: "mayorista", name: "Mayorista", productIds: ["erp", "mayorista"], buyer: "Distribuidor / B2B" },
  { id: "taller", name: "Taller", productIds: ["erp", "taller", "mantenimiento"], buyer: "Confección / planta" },
  { id: "campo", name: "Campo", productIds: ["pocket", "campo"], buyer: "Fuerza de ventas" },
  { id: "movilidad-taxi", name: "Movilidad Taxi", productIds: ["taxi"], buyer: "Operador de taxis" },
  { id: "movilidad-delivery", name: "Movilidad Delivery", productIds: ["delivery"], buyer: "Repartos / encargos" },
  { id: "academia", name: "Academia", productIds: ["academia"], buyer: "Capacitación Horytek" },
  { id: "crm-premium", name: "CRM Premium", productIds: ["erp", "crm"], buyer: "Equipos comerciales" },
  { id: "talento", name: "Talento", productIds: ["erp", "recluta"], buyer: "PYME que contrata con frecuencia" },
];

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
];

export function getProductBySlug(slug) {
  return HORYTEK_PRODUCTS.find((p) => p.slug === slug || p.id === slug) || null;
}

export function getBundleById(id) {
  return HORYTEK_BUNDLES.find((b) => b.id === id) || null;
}

export function productsNeedingOwnDatabase() {
  return HORYTEK_PRODUCTS.filter((p) => p.database && p.wave !== "existing");
}

export function loginSurfaces() {
  const modes = new Map();
  for (const p of HORYTEK_PRODUCTS) {
    if (!modes.has(p.loginMode)) {
      modes.set(p.loginMode, {
        mode: p.loginMode,
        label: p.loginMode === "express" ? "Pocket" : p.loginMode === "erp" ? "ERP" : p.name,
        productIds: [],
      });
    }
    modes.get(p.loginMode).productIds.push(p.id);
  }
  // Validar es acción, no producto
  return [
    ...[...modes.values()],
    { mode: "validar", label: "Validar", productIds: [] },
  ];
}
