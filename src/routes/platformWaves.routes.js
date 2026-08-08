/**
 * Rutas oleadas B–E + Recluta. Cada producto exporta su propio Router.
 */
import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validator.middleware.js";
import * as schema from "../schemas/platformWaves.schema.js";
import * as ctrl from "../controllers/platformWaves.controller.js";

/** Auth ERP opcional: si hay Bearer, setea req.id_tenant (para bootstrap con tenant). */
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return next();
  return auth(req, res, next);
}

/* ——— Taller ——— */
export const tallerRouter = Router();
tallerRouter.use(auth);
tallerRouter.get("/status", ctrl.tallerStatus);
tallerRouter.get("/ots", ctrl.tallerListOt);
tallerRouter.post("/ots", validateSchema(schema.tallerOtSchema), ctrl.tallerCreateOt);
tallerRouter.get("/ots/:id_ot/insumos", ctrl.tallerListInsumos);
tallerRouter.get("/insumos", ctrl.tallerListInsumos);
tallerRouter.post("/insumos", validateSchema(schema.tallerInsumoSchema), ctrl.tallerAddInsumo);
tallerRouter.get("/operadores", ctrl.tallerListOperadores);
tallerRouter.post(
  "/operadores",
  validateSchema(schema.tallerOperadorSchema),
  ctrl.tallerCreateOperador
);

/* ——— CRM ——— */
export const crmRouter = Router();
crmRouter.use(auth);
crmRouter.get("/status", ctrl.crmStatus);
crmRouter.get("/deals", ctrl.crmListDeals);
crmRouter.post("/deals", validateSchema(schema.crmDealSchema), ctrl.crmCreateDeal);
crmRouter.patch(
  "/deals/:id_deal/etapa",
  validateSchema(schema.crmMoveDealSchema),
  ctrl.crmMoveDeal
);
crmRouter.post(
  "/actividades",
  validateSchema(schema.crmActividadSchema),
  ctrl.crmAddActividad
);

/* ——— Envíos ——— */
export const enviosRouter = Router();
enviosRouter.get("/tracking/:codigo", ctrl.enviosGetPublicTracking);
enviosRouter.get("/status", auth, ctrl.enviosStatus);
enviosRouter.get("/guias", auth, ctrl.enviosListGuias);
enviosRouter.post(
  "/guias",
  auth,
  validateSchema(schema.enviosGuiaSchema),
  ctrl.enviosCreateGuia
);
enviosRouter.post(
  "/eventos",
  auth,
  validateSchema(schema.enviosEventoSchema),
  ctrl.enviosAddEvento
);

/* ——— WMS ——— */
export const wmsRouter = Router();
wmsRouter.use(auth);
wmsRouter.get("/status", ctrl.wmsStatus);
wmsRouter.get("/ubicaciones", ctrl.wmsListUbicaciones);
wmsRouter.post(
  "/ubicaciones",
  validateSchema(schema.wmsUbicacionSchema),
  ctrl.wmsCreateUbicacion
);
wmsRouter.get("/tareas", ctrl.wmsListTareas);
wmsRouter.post("/tareas", validateSchema(schema.wmsTareaSchema), ctrl.wmsCreateTarea);
wmsRouter.patch(
  "/tareas/:id_tarea",
  validateSchema(schema.wmsTareaUpdateSchema),
  ctrl.wmsUpdateTarea
);

/* ——— Despacho ——— */
export const despachoRouter = Router();
despachoRouter.use(auth);
despachoRouter.get("/status", ctrl.despachoStatus);
despachoRouter.get("/rutas", ctrl.despachoListRutas);
despachoRouter.post(
  "/rutas",
  validateSchema(schema.despachoRutaSchema),
  ctrl.despachoCreateRuta
);
despachoRouter.post(
  "/paradas",
  validateSchema(schema.despachoParadaSchema),
  ctrl.despachoAddParada
);
despachoRouter.get("/choferes", ctrl.despachoListChoferes);
despachoRouter.post(
  "/choferes",
  validateSchema(schema.despachoChoferSchema),
  ctrl.despachoCreateChofer
);

/* ——— Campo ——— */
export const campoRouter = Router();
campoRouter.use(auth);
campoRouter.get("/status", ctrl.campoStatus);
campoRouter.get("/vendedores", ctrl.campoListVendedores);
campoRouter.post(
  "/vendedores",
  validateSchema(schema.campoVendedorSchema),
  ctrl.campoCreateVendedor
);
campoRouter.get("/checkins", ctrl.campoListCheckins);
campoRouter.post(
  "/checkins",
  validateSchema(schema.campoCheckinSchema),
  ctrl.campoCreateCheckin
);

/* ——— Mantenimiento ——— */
export const mantenimientoRouter = Router();
mantenimientoRouter.use(auth);
mantenimientoRouter.get("/status", ctrl.manttoStatus);
mantenimientoRouter.get("/activos", ctrl.manttoListActivos);
mantenimientoRouter.post(
  "/activos",
  validateSchema(schema.manttoActivoSchema),
  ctrl.manttoCreateActivo
);
mantenimientoRouter.get("/ots", ctrl.manttoListOt);
mantenimientoRouter.post("/ots", validateSchema(schema.manttoOtSchema), ctrl.manttoCreateOt);
mantenimientoRouter.get("/tecnicos", ctrl.manttoListTecnicos);
mantenimientoRouter.post(
  "/tecnicos",
  validateSchema(schema.manttoTecnicoSchema),
  ctrl.manttoCreateTecnico
);

/* ——— Recluta ——— */
export const reclutaRouter = Router();
reclutaRouter.get("/portal/:slug", ctrl.reclutaGetPublicPortal);
reclutaRouter.post(
  "/portal/:slug/postulaciones",
  validateSchema(schema.reclutaPostulacionPublicSchema),
  ctrl.reclutaPostPublicPostulacion
);
reclutaRouter.post(
  "/setup",
  auth,
  validateSchema(schema.reclutaSetupSchema),
  ctrl.reclutaSetup
);
reclutaRouter.get("/vacantes", auth, ctrl.reclutaListVacantes);
reclutaRouter.post(
  "/vacantes",
  auth,
  validateSchema(schema.reclutaVacanteSchema),
  ctrl.reclutaCreateVacante
);
reclutaRouter.get("/postulaciones", auth, ctrl.reclutaListPostulaciones);
reclutaRouter.patch(
  "/postulaciones/:id_postulacion",
  auth,
  validateSchema(schema.reclutaPostulacionUpdateSchema),
  ctrl.reclutaUpdatePostulacion
);

/* ——— Preventa ——— */
export const preventaRouter = Router();
preventaRouter.get("/campanias/:slug", ctrl.preventaGetPublic);
preventaRouter.post(
  "/campanias/:slug/reservas",
  validateSchema(schema.preventaReservaSchema),
  ctrl.preventaCreateReservaPublic
);
preventaRouter.get("/admin/campanias", auth, ctrl.preventaListCampanias);
preventaRouter.post(
  "/admin/campanias",
  auth,
  validateSchema(schema.preventaCampaniaSchema),
  ctrl.preventaCreateCampania
);
preventaRouter.post(
  "/admin/items",
  auth,
  validateSchema(schema.preventaItemSchema),
  ctrl.preventaAddItem
);
preventaRouter.get("/admin/reservas", auth, ctrl.preventaListReservas);

/* ——— Taxi ——— */
export const taxiRouter = Router();
taxiRouter.get("/portal/:slug", ctrl.taxiGetPublic);
taxiRouter.post(
  "/bootstrap",
  optionalAuth,
  validateSchema(schema.operatorBootstrapSchema),
  ctrl.taxiBootstrap
);
taxiRouter.post(
  "/auth/admin",
  validateSchema(schema.operatorLoginSchema),
  ctrl.taxiAdminLogin
);
taxiRouter.post(
  "/auth/conductor",
  validateSchema(schema.operatorActorLoginSchema),
  ctrl.taxiConductorLogin
);
taxiRouter.post(
  "/auth/pasajero",
  validateSchema(schema.operatorActorLoginSchema),
  ctrl.taxiPasajeroLogin
);
taxiRouter.get("/admin/viajes", ctrl.authTaxiAdmin, ctrl.taxiListViajes);
taxiRouter.post(
  "/admin/viajes",
  ctrl.authTaxiAdmin,
  validateSchema(schema.taxiViajeSchema),
  ctrl.taxiCreateViaje
);
taxiRouter.patch(
  "/admin/viajes/:id_viaje/asignar",
  ctrl.authTaxiAdmin,
  validateSchema(schema.taxiAssignSchema),
  ctrl.taxiAssignConductor
);
taxiRouter.post(
  "/admin/conductores",
  ctrl.authTaxiAdmin,
  validateSchema(schema.taxiConductorSchema),
  ctrl.taxiCreateConductor
);
taxiRouter.post(
  "/admin/pasajeros",
  ctrl.authTaxiAdmin,
  validateSchema(schema.taxiPasajeroSchema),
  ctrl.taxiCreatePasajero
);

/* ——— Delivery ——— */
export const deliveryRouter = Router();
deliveryRouter.get("/portal/:slug", ctrl.deliveryGetPublic);
deliveryRouter.post(
  "/bootstrap",
  optionalAuth,
  validateSchema(schema.operatorBootstrapSchema),
  ctrl.deliveryBootstrap
);
deliveryRouter.post(
  "/auth/admin",
  validateSchema(schema.operatorLoginSchema),
  ctrl.deliveryAdminLogin
);
deliveryRouter.post(
  "/auth/repartidor",
  validateSchema(schema.operatorActorLoginSchema),
  ctrl.deliveryRepartidorLogin
);
deliveryRouter.post(
  "/auth/cliente",
  validateSchema(schema.operatorActorLoginSchema),
  ctrl.deliveryClienteLogin
);
deliveryRouter.get("/admin/pedidos", ctrl.authDeliveryAdmin, ctrl.deliveryListPedidos);
deliveryRouter.post(
  "/admin/pedidos",
  ctrl.authDeliveryAdmin,
  validateSchema(schema.deliveryPedidoSchema),
  ctrl.deliveryCreatePedido
);
deliveryRouter.patch(
  "/admin/pedidos/:id_pedido/asignar",
  ctrl.authDeliveryAdmin,
  validateSchema(schema.deliveryAssignSchema),
  ctrl.deliveryAssignRepartidor
);
deliveryRouter.post(
  "/admin/repartidores",
  ctrl.authDeliveryAdmin,
  validateSchema(schema.deliveryRepartidorSchema),
  ctrl.deliveryCreateRepartidor
);
deliveryRouter.post(
  "/admin/clientes",
  ctrl.authDeliveryAdmin,
  validateSchema(schema.deliveryClienteSchema),
  ctrl.deliveryCreateCliente
);

/* ——— Flotas ——— */
export const flotasRouter = Router();
flotasRouter.get("/portal/:slug", ctrl.flotasGetPublic);
flotasRouter.post(
  "/bootstrap",
  optionalAuth,
  validateSchema(schema.operatorBootstrapSchema),
  ctrl.flotasBootstrap
);
flotasRouter.post(
  "/auth/admin",
  validateSchema(schema.operatorLoginSchema),
  ctrl.flotasAdminLogin
);
flotasRouter.get("/admin/vehiculos", ctrl.authFlotasAdmin, ctrl.flotasListVehiculos);
flotasRouter.post(
  "/admin/vehiculos",
  ctrl.authFlotasAdmin,
  validateSchema(schema.flotasVehiculoSchema),
  ctrl.flotasCreateVehiculo
);
flotasRouter.get("/admin/combustible", ctrl.authFlotasAdmin, ctrl.flotasListCombustible);
flotasRouter.post(
  "/admin/combustible",
  ctrl.authFlotasAdmin,
  validateSchema(schema.flotasCombustibleSchema),
  ctrl.flotasCreateCombustible
);
flotasRouter.get("/admin/conductores", ctrl.authFlotasAdmin, ctrl.flotasListConductores);
flotasRouter.post(
  "/admin/conductores",
  ctrl.authFlotasAdmin,
  validateSchema(schema.flotasConductorSchema),
  ctrl.flotasCreateConductor
);

/* ——— Academia ——— */
export const academiaRouter = Router();
academiaRouter.get("/portal/:slug", ctrl.academiaGetPublic);
academiaRouter.post(
  "/bootstrap",
  optionalAuth,
  validateSchema(schema.operatorBootstrapSchema),
  ctrl.academiaBootstrap
);
academiaRouter.post(
  "/auth/admin",
  validateSchema(schema.operatorLoginSchema),
  ctrl.academiaAdminLogin
);
academiaRouter.post(
  "/auth/alumno",
  validateSchema(schema.academiaAlumnoLoginSchema),
  ctrl.academiaAlumnoLogin
);
academiaRouter.get("/admin/cursos", ctrl.authAcademiaAdmin, ctrl.academiaListCursos);
academiaRouter.post(
  "/admin/cursos",
  ctrl.authAcademiaAdmin,
  validateSchema(schema.academiaCursoSchema),
  ctrl.academiaCreateCurso
);
academiaRouter.get("/admin/alumnos", ctrl.authAcademiaAdmin, ctrl.academiaListAlumnos);
academiaRouter.post(
  "/admin/alumnos",
  ctrl.authAcademiaAdmin,
  validateSchema(schema.academiaAlumnoSchema),
  ctrl.academiaCreateAlumno
);
academiaRouter.get(
  "/admin/inscripciones",
  ctrl.authAcademiaAdmin,
  ctrl.academiaListInscripciones
);
academiaRouter.post(
  "/admin/inscripciones",
  ctrl.authAcademiaAdmin,
  validateSchema(schema.academiaInscripcionSchema),
  ctrl.academiaCreateInscripcion
);

/* ——— Agenda ——— */
export const agendaRouter = Router();
agendaRouter.get("/portal/:slug", ctrl.agendaGetPublic);
agendaRouter.post(
  "/portal/:slug/reservas",
  validateSchema(schema.agendaReservaSchema),
  ctrl.agendaCreateReservaPublic
);
agendaRouter.post(
  "/bootstrap",
  optionalAuth,
  validateSchema(schema.operatorBootstrapSchema),
  ctrl.agendaBootstrap
);
agendaRouter.post(
  "/auth/admin",
  validateSchema(schema.operatorLoginSchema),
  ctrl.agendaAdminLogin
);
agendaRouter.get("/admin/slots", ctrl.authAgendaAdmin, ctrl.agendaListSlots);
agendaRouter.post(
  "/admin/slots",
  ctrl.authAgendaAdmin,
  validateSchema(schema.agendaSlotSchema),
  ctrl.agendaCreateSlot
);
agendaRouter.get("/admin/reservas", ctrl.authAgendaAdmin, ctrl.agendaListReservas);

export default {
  tallerRouter,
  crmRouter,
  enviosRouter,
  wmsRouter,
  despachoRouter,
  campoRouter,
  mantenimientoRouter,
  reclutaRouter,
  preventaRouter,
  taxiRouter,
  deliveryRouter,
  flotasRouter,
  academiaRouter,
  agendaRouter,
};
