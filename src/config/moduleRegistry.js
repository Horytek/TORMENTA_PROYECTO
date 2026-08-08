/**
 * Registro central de módulos (Sección 2-5 del roadmap de autorización).
 *
 * Objetivo: una única fuente de verdad, en código, de qué módulos existen, qué
 * dominio de negocio ocupan, qué ruta backend/frontend usan, qué capacidades
 * exponen y qué tan riesgosas son — sin inventar una tabla nueva ni tocar
 * `permisos`/`modulo`/`submodulos` (esas siguen siendo la fuente de verdad de
 * QUIÉN tiene acceso; esto es la fuente de verdad de QUÉ existe).
 *
 * No reemplaza el catálogo de permisos en BD. Lo complementa: `slug` acá debe
 * coincidir con la `ruta` real guardada en `modulo`/`submodulos` para que
 * `requireCapability(slug, accion)` (src/middlewares/authorize.middleware.js)
 * siga funcionando exactamente igual que hoy.
 *
 * `verified: true` = el slug está confirmado contra código real que ya lo usa
 * en producción (navigationCatalog.ts del frontend, o migraciones propias).
 * `verified: false` = inferido por convención de nombres; hay que confirmarlo
 * contra la tabla `modulo`/`submodulos` real antes de usarlo para gatear una
 * ruta nueva, porque un slug equivocado bloquea la función para todo el mundo
 * (requireCapability deniega por defecto si no encuentra el permiso).
 *
 * Todo módulo NUEVO debe registrarse acá — ver scripts/validate-authz.js, que
 * falla si detecta una ruta backend mutante sin capacidad asociada.
 */

/** @typedef {"informativo"|"operativo"|"sensible"|"critico"|"destructivo"} RiskLevel */

/**
 * @param {{
 *   id: string,
 *   domain: string,
 *   name: string,
 *   description?: string,
 *   slug: string,
 *   verified: boolean,
 *   backendRoutes: string[],
 *   frontendRoute?: string,
 *   capabilities?: string[],
 *   riskLevel: RiskLevel,
 *   dependencies?: string[],
 * }} def
 */
export function defineModule(def) {
    if (!def.id || !def.domain || !def.slug) {
        throw new Error(`defineModule: falta id/domain/slug en ${JSON.stringify(def)}`);
    }
    return {
        capabilities: ["ver", "crear", "editar", "eliminar", "desactivar", "generar"],
        dependencies: [],
        description: "",
        ...def,
    };
}

export const MODULE_REGISTRY = [
    defineModule({
        id: "productos", domain: "catalogo", name: "Productos",
        slug: "productos", verified: true,
        backendRoutes: ["/api/productos", "/api/categoria", "/api/marcas", "/api/subcategoria", "/api/attributes"],
        frontendRoute: "/products", riskLevel: "operativo",
    }),
    defineModule({
        id: "ventas", domain: "comercial", name: "Ventas / POS",
        slug: "ventas", verified: true,
        // `/api/cpe` (comprobantes electrónicos) reusa la capacidad `ventas`:
        // ver = consultar comprobantes, generar = emitir a SUNAT.
        backendRoutes: ["/api/ventas", "/api/cpe"], frontendRoute: "/sales", riskLevel: "sensible",
    }),
    defineModule({
        id: "inventario", domain: "logistica", name: "Inventario / Kárdex",
        slug: "almacen", verified: true,
        backendRoutes: ["/api/almacen", "/api/kardex", "/api/kardexInventario", "/api/lote", "/api/verificationConfig"],
        frontendRoute: "/inventory", riskLevel: "operativo",
    }),
    defineModule({
        id: "almacenes", domain: "logistica", name: "Almacenes",
        slug: "almaceng", verified: true,
        backendRoutes: ["/api/almacen"], frontendRoute: "/logistics/warehouses", riskLevel: "operativo",
        description: "Nombre de slug 'almaceng' heredado de datos existentes en producción — no es un typo nuevo, ver navigationCatalog.ts.",
    }),
    defineModule({
        id: "notas-almacen", domain: "logistica", name: "Notas de Almacén",
        slug: "nota_almacen", verified: true,
        backendRoutes: ["/api/notaingreso", "/api/notasalida"], frontendRoute: "/logistics/warehouse-notes",
        riskLevel: "sensible",
    }),
    defineModule({
        id: "guias-remision", domain: "logistica", name: "Guías de Remisión",
        slug: "guia_remision", verified: true,
        backendRoutes: ["/api/guiaremision", "/api/destinatario"], frontendRoute: "/logistics/guides",
        riskLevel: "sensible", description: "Vinculado a SUNAT — cambios de negocio requieren cuidado extra.",
    }),
    defineModule({
        id: "sucursales", domain: "logistica", name: "Sucursales",
        slug: "sucursal", verified: true,
        backendRoutes: ["/api/sucursal"], frontendRoute: "/logistics/branches", riskLevel: "operativo",
    }),
    defineModule({
        id: "clientes", domain: "personas", name: "Clientes",
        slug: "clientes", verified: true,
        backendRoutes: ["/api/clientes"], frontendRoute: "/people/clients", riskLevel: "operativo",
    }),
    defineModule({
        id: "proveedores", domain: "personas", name: "Proveedores",
        slug: "proveedores", verified: true,
        backendRoutes: ["/api/destinatario"], frontendRoute: "/people/providers", riskLevel: "operativo",
    }),
    defineModule({
        id: "empleados", domain: "personas", name: "Empleados",
        slug: "empleados", verified: true,
        backendRoutes: ["/api/vendedores"], frontendRoute: "/people/employees", riskLevel: "sensible",
    }),
    defineModule({
        id: "reportes", domain: "reportes", name: "Historial de Ventas",
        slug: "reportes", verified: true,
        backendRoutes: ["/api/reporte", "/api/dashboard"], frontendRoute: "/reports/sales", riskLevel: "informativo",
    }),
    defineModule({
        id: "contabilidad", domain: "finanzas", name: "Contabilidad",
        slug: "contabilidad", verified: true,
        backendRoutes: [
            "/api/gastos", "/api/contabilidad/cuentas", "/api/contabilidad/centros-costo",
            "/api/contabilidad/periodos", "/api/contabilidad/asientos", "/api/contabilidad/configuracion",
            "/api/contabilidad/tesoreria", "/api/contabilidad/presupuestos",
            "/api/contabilidad/estados-financieros", "/api/contabilidad/auditoria", "/api/contabilidad/resumen",
        ],
        frontendRoute: "/accounting", riskLevel: "critico",
        capabilities: ["ver", "crear", "editar", "eliminar", "desactivar", "generar"],
        description: "Submódulos con slugs propios: /contabilidad/cuentas, /asientos, /periodos, /centros-costo, /configuracion, /tesoreria, /presupuestos, /estados-financieros, /auditoria (todos verified=true, creados por las migraciones de este proyecto).",
    }),
    defineModule({
        id: "usuarios", domain: "configuracion", name: "Usuarios",
        slug: "configuracion/usuarios", verified: true,
        backendRoutes: ["/api/usuario"], frontendRoute: "/settings/users", riskLevel: "critico",
    }),
    defineModule({
        id: "roles", domain: "configuracion", name: "Roles y Permisos",
        slug: "configuracion/roles", verified: true,
        backendRoutes: ["/api/rol", "/api/permisos", "/api/permisosGlobales", "/api/modulos", "/api/submodulos"],
        frontendRoute: "/settings/roles", riskLevel: "critico",
    }),
    defineModule({
        id: "negocio", domain: "configuracion", name: "Configuración de Negocio",
        slug: "configuracion/negocio", verified: true,
        backendRoutes: ["/api/negocio", "/api/empresa"], frontendRoute: "/settings/system", riskLevel: "critico",
    }),

    // ── Módulos SIN slug confirmado en navigationCatalog.ts (no aparecen en el
    // menú actual, o su ruta no se pudo verificar). Marcados verified:false a
    // propósito — antes de usarlos para gatear un endpoint nuevo, confirmar
    // contra `SELECT ruta FROM modulo/submodulos` en una copia real de la BD.
    defineModule({
        id: "funciones", domain: "configuracion", name: "Funciones (catálogo interno)",
        slug: "funciones", verified: false,
        backendRoutes: ["/api/funciones"], riskLevel: "sensible",
        description: "Sin módulo visible en el menú actual; requiere confirmar si de verdad debe ser navegable o es un catálogo interno de otro módulo.",
    }),
    defineModule({
        id: "pagos-suscripcion", domain: "facturacion", name: "Pagos y Suscripción",
        slug: "configuracion/negocio", verified: false,
        backendRoutes: ["/api/empresa/pagos", "/api/payment", "/api/plan_pago"], riskLevel: "critico",
        description: "Zona 'sagrada' (Regla de Oro Nº3 de CLAUDE.md) — cambios de negocio aquí requieren confirmación explícita aparte, no solo mapeo de permisos.",
    }),
    defineModule({
        id: "sunat", domain: "facturacion", name: "SUNAT / Facturación electrónica",
        slug: "guia_remision", verified: false,
        backendRoutes: ["/api/sunat", "/api/clave"], riskLevel: "critico",
        description: "Zona 'sagrada' (Regla de Oro Nº3). Comparte slug con guías de remisión por ahora; podría merecer su propio módulo si crece.",
    }),
    defineModule({
        id: "chat-ia", domain: "soporte", name: "Chat / Asistente IA",
        slug: "chat-ia", verified: false,
        backendRoutes: ["/api/chat", "/api/help", "/api/functionShortcuts"], riskLevel: "operativo",
    }),
    defineModule({
        id: "developer", domain: "plataforma", name: "Vista Developer",
        slug: "__developer__", verified: true,
        backendRoutes: ["/api/developer", "/api/sync"], frontendRoute: "/developer", riskLevel: "destructivo",
        description: "No usa `permisos` — gateado por isDeveloperReq/requireDeveloper (rol id 10). Ver sección 20 del roadmap para volverlo capability-based.",
    }),
    defineModule({
        id: "stock-sync", domain: "plataforma", name: "Sync Stock",
        slug: "stock-sync", verified: true,
        backendRoutes: ["/api/stock-sync"], frontendRoute: "/platform/sync",
        riskLevel: "operativo",
        description: "Producto Sync Stock — BD db_sync. Admin ERP; sin superficie cliente.",
    }),
    defineModule({
        id: "mayorista", domain: "plataforma", name: "Mayorista B2B",
        slug: "mayorista", verified: true,
        backendRoutes: ["/api/mayorista"], frontendRoute: "/platform/mayorista",
        riskLevel: "sensible",
        description: "Producto Mayorista — BD db_mayorista. Admin ERP + portal /b2b/:slug.",
    }),
    defineModule({
        id: "taller", domain: "plataforma", name: "Taller / Producción",
        slug: "taller", verified: true,
        backendRoutes: ["/api/taller"], frontendRoute: "/platform/taller",
        riskLevel: "operativo",
        description: "Producto Taller — BD db_taller. OT, insumos y operadores.",
    }),
    defineModule({
        id: "preventa", domain: "plataforma", name: "Preventa",
        slug: "preventa", verified: true,
        backendRoutes: ["/api/preventa"], frontendRoute: "/platform/preventa",
        riskLevel: "sensible",
        description: "Producto Preventa — BD db_preventa. Campañas y reservas públicas.",
    }),
    defineModule({
        id: "crm", domain: "plataforma", name: "CRM",
        slug: "crm", verified: true,
        backendRoutes: ["/api/crm"], frontendRoute: "/platform/crm",
        riskLevel: "operativo",
        description: "Producto CRM — BD db_crm. Pipeline, deals y actividades.",
    }),
    defineModule({
        id: "envios", domain: "plataforma", name: "Envíos / Tracking",
        slug: "envios", verified: true,
        backendRoutes: ["/api/envios"], frontendRoute: "/platform/envios",
        riskLevel: "operativo",
        description: "Producto Envíos — BD db_envios. Guías + tracking público.",
    }),
    defineModule({
        id: "wms", domain: "plataforma", name: "WMS",
        slug: "wms", verified: true,
        backendRoutes: ["/api/wms"], frontendRoute: "/platform/wms",
        riskLevel: "operativo",
        description: "Producto WMS — BD db_wms. Ubicaciones y tareas de almacén.",
    }),
    defineModule({
        id: "despacho", domain: "plataforma", name: "Despacho / Rutas",
        slug: "despacho", verified: true,
        backendRoutes: ["/api/despacho"], frontendRoute: "/platform/despacho",
        riskLevel: "operativo",
        description: "Producto Despacho — BD db_despacho. Rutas, paradas y choferes.",
    }),
    defineModule({
        id: "taxi", domain: "plataforma", name: "Taxi",
        slug: "taxi", verified: true,
        backendRoutes: ["/api/taxi"], frontendRoute: "/platform/taxi",
        riskLevel: "sensible",
        description: "Producto Taxi — BD db_taxi. Operador + JWT aud horytek-taxi.",
    }),
    defineModule({
        id: "delivery", domain: "plataforma", name: "Delivery",
        slug: "delivery", verified: true,
        backendRoutes: ["/api/delivery"], frontendRoute: "/platform/delivery",
        riskLevel: "sensible",
        description: "Producto Delivery — BD db_delivery. Operador + JWT aud horytek-delivery.",
    }),
    defineModule({
        id: "flotas", domain: "plataforma", name: "Flotas",
        slug: "flotas", verified: true,
        backendRoutes: ["/api/flotas"], frontendRoute: "/platform/flotas",
        riskLevel: "operativo",
        description: "Producto Flotas — BD db_flotas. Vehículos, combustible y conductores.",
    }),
    defineModule({
        id: "campo", domain: "plataforma", name: "Fuerza de Campo",
        slug: "campo", verified: true,
        backendRoutes: ["/api/campo"], frontendRoute: "/platform/campo",
        riskLevel: "operativo",
        description: "Producto Campo — BD db_campo. Vendedores y check-ins GPS.",
    }),
    defineModule({
        id: "academia", domain: "plataforma", name: "Academia",
        slug: "academia", verified: true,
        backendRoutes: ["/api/academia"], frontendRoute: "/platform/academia",
        riskLevel: "operativo",
        description: "Producto Academia — BD db_academia. Cursos, alumnos e inscripciones.",
    }),
    defineModule({
        id: "agenda", domain: "plataforma", name: "Agenda",
        slug: "agenda", verified: true,
        backendRoutes: ["/api/agenda"], frontendRoute: "/platform/agenda",
        riskLevel: "sensible",
        description: "Producto Agenda — BD db_agenda. Slots y reservas públicas.",
    }),
    defineModule({
        id: "mantenimiento", domain: "plataforma", name: "Mantenimiento",
        slug: "mantenimiento", verified: true,
        backendRoutes: ["/api/mantenimiento"], frontendRoute: "/platform/mantenimiento",
        riskLevel: "operativo",
        description: "Producto Mantenimiento — BD db_mantenimiento. Activos, OT y técnicos.",
    }),
    defineModule({
        id: "recluta", domain: "plataforma", name: "Recluta ATS",
        slug: "recluta", verified: true,
        backendRoutes: ["/api/recluta"], frontendRoute: "/platform/recluta",
        riskLevel: "sensible",
        description: "Producto Recluta — BD db_recluta. Vacantes y portal de postulaciones.",
    }),
];

export function getModuleBySlug(slug) {
    return MODULE_REGISTRY.find((m) => m.slug === slug);
}

export function getModuleByBackendRoute(routePrefix) {
    return MODULE_REGISTRY.find((m) => m.backendRoutes.some((r) => routePrefix.startsWith(r)));
}
