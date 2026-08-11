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
taxiRouter.post(
  "/auth/pasajero/registro",
  validateSchema(schema.taxiPasajeroRegisterSchema),
  ctrl.taxiPasajeroRegister
);
taxiRouter.get(
  "/admin/viajes",
  ctrl.authTaxiAdmin,
  ctrl.requireTaxiAdmin,
  ctrl.taxiListViajes
);
taxiRouter.post(
  "/admin/viajes",
  ctrl.authTaxiAdmin,
  ctrl.requireTaxiAdmin,
  validateSchema(schema.taxiViajeSchema),
  ctrl.taxiCreateViaje
);
taxiRouter.patch(
  "/admin/viajes/:id_viaje/asignar",
  ctrl.authTaxiAdmin,
  ctrl.requireTaxiAdmin,
  validateSchema(schema.taxiAssignSchema),
  ctrl.taxiAssignConductor
);
taxiRouter.get(
  "/admin/conductores",
  ctrl.authTaxiAdmin,
  ctrl.requireTaxiAdmin,
  ctrl.taxiListConductores
);
taxiRouter.post(
  "/admin/conductores",
  ctrl.authTaxiAdmin,
  ctrl.requireTaxiAdmin,
  validateSchema(schema.taxiConductorSchema),
  ctrl.taxiCreateConductor
);
taxiRouter.patch(
  "/admin/conductores/:id_conductor",
  ctrl.authTaxiAdmin,
  ctrl.requireTaxiAdmin,
  validateSchema(schema.taxiConductorUpdateSchema),
  ctrl.taxiUpdateConductor
);
taxiRouter.patch(
  "/admin/conductores/:id_conductor/password",
  ctrl.authTaxiAdmin,
  ctrl.requireTaxiAdmin,
  validateSchema(schema.taxiPasswordSchema),
  ctrl.taxiSetConductorPassword
);
taxiRouter.get(
  "/admin/pasajeros",
  ctrl.authTaxiAdmin,
  ctrl.requireTaxiAdmin,
  ctrl.taxiListPasajeros
);
taxiRouter.post(
  "/admin/pasajeros",
  ctrl.authTaxiAdmin,
  ctrl.requireTaxiAdmin,
  validateSchema(schema.taxiPasajeroSchema),
  ctrl.taxiCreatePasajero
);
taxiRouter.patch(
  "/admin/pasajeros/:id_pasajero",
  ctrl.authTaxiAdmin,
  ctrl.requireTaxiAdmin,
  validateSchema(schema.taxiPasajeroUpdateSchema),
  ctrl.taxiUpdatePasajero
);
taxiRouter.patch(
  "/admin/pasajeros/:id_pasajero/password",
  ctrl.authTaxiAdmin,
  ctrl.requireTaxiAdmin,
  validateSchema(schema.taxiPasswordSchema),
  ctrl.taxiSetPasajeroPassword
);
taxiRouter.get(
  "/admin/admins",
  ctrl.authTaxiAdmin,
  ctrl.requireTaxiAdmin,
  ctrl.taxiListAdmins
);
taxiRouter.post(
  "/admin/admins",
  ctrl.authTaxiAdmin,
  ctrl.requireTaxiAdmin,
  validateSchema(schema.taxiAdminCreateSchema),
  ctrl.taxiCreateAdmin
);
taxiRouter.patch(
  "/admin/admins/:id_admin/password",
  ctrl.authTaxiAdmin,
  ctrl.requireTaxiAdmin,
  validateSchema(schema.taxiPasswordSchema),
  ctrl.taxiSetAdminPassword
);
taxiRouter.get(
  "/admin/operador",
  ctrl.authTaxiAdmin,
  ctrl.requireTaxiAdmin,
  ctrl.taxiGetOperador
);
taxiRouter.patch(
  "/admin/operador",
  ctrl.authTaxiAdmin,
  ctrl.requireTaxiAdmin,
  validateSchema(schema.taxiOperadorUpdateSchema),
  ctrl.taxiUpdateOperador
);
taxiRouter.patch(
  "/admin/viajes/:id_viaje",
  ctrl.authTaxiAdmin,
  ctrl.requireTaxiAdmin,
  validateSchema(schema.taxiViajeAdminPatchSchema),
  ctrl.taxiAdminPatchViaje
);
taxiRouter.get(
  "/pasajero/viajes",
  ctrl.authTaxiAdmin,
  ctrl.requireTaxiPasajero,
  ctrl.taxiPasajeroListViajes
);
taxiRouter.post(
  "/pasajero/viajes",
  ctrl.authTaxiAdmin,
  ctrl.requireTaxiPasajero,
  validateSchema(schema.taxiViajeSchema),
  ctrl.taxiPasajeroCreateViaje
);
taxiRouter.get(
  "/conductor/viajes",
  ctrl.authTaxiAdmin,
  ctrl.requireTaxiConductor,
  ctrl.taxiConductorListViajes
);
taxiRouter.patch(
  "/conductor/viajes/:id_viaje",
  ctrl.authTaxiAdmin,
  ctrl.requireTaxiConductor,
  validateSchema(schema.taxiConductorPatchSchema),
  ctrl.taxiConductorPatchViaje
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
deliveryRouter.get(
  "/admin/repartidores",
  ctrl.authDeliveryAdmin,
  ctrl.requireDeliveryAdmin,
  ctrl.deliveryListRepartidores
);
deliveryRouter.post(
  "/admin/repartidores",
  ctrl.authDeliveryAdmin,
  ctrl.requireDeliveryAdmin,
  validateSchema(schema.deliveryRepartidorSchema),
  ctrl.deliveryCreateRepartidor
);
deliveryRouter.patch(
  "/admin/repartidores/:id_repartidor",
  ctrl.authDeliveryAdmin,
  ctrl.requireDeliveryAdmin,
  validateSchema(schema.deliveryRepartidorUpdateSchema),
  ctrl.deliveryUpdateRepartidor
);
deliveryRouter.patch(
  "/admin/repartidores/:id_repartidor/password",
  ctrl.authDeliveryAdmin,
  ctrl.requireDeliveryAdmin,
  validateSchema(schema.taxiPasswordSchema),
  ctrl.deliverySetRepartidorPassword
);
deliveryRouter.get(
  "/admin/clientes",
  ctrl.authDeliveryAdmin,
  ctrl.requireDeliveryAdmin,
  ctrl.deliveryListClientes
);
deliveryRouter.post(
  "/admin/clientes",
  ctrl.authDeliveryAdmin,
  ctrl.requireDeliveryAdmin,
  validateSchema(schema.deliveryClienteSchema),
  ctrl.deliveryCreateCliente
);
deliveryRouter.patch(
  "/admin/clientes/:id_cliente",
  ctrl.authDeliveryAdmin,
  ctrl.requireDeliveryAdmin,
  validateSchema(schema.deliveryClienteUpdateSchema),
  ctrl.deliveryUpdateCliente
);
deliveryRouter.patch(
  "/admin/clientes/:id_cliente/password",
  ctrl.authDeliveryAdmin,
  ctrl.requireDeliveryAdmin,
  validateSchema(schema.taxiPasswordSchema),
  ctrl.deliverySetClientePassword
);
deliveryRouter.get(
  "/admin/admins",
  ctrl.authDeliveryAdmin,
  ctrl.requireDeliveryAdmin,
  ctrl.deliveryListAdmins
);
deliveryRouter.post(
  "/admin/admins",
  ctrl.authDeliveryAdmin,
  ctrl.requireDeliveryAdmin,
  validateSchema(schema.taxiAdminCreateSchema),
  ctrl.deliveryCreateAdmin
);
deliveryRouter.patch(
  "/admin/admins/:id_admin/password",
  ctrl.authDeliveryAdmin,
  ctrl.requireDeliveryAdmin,
  validateSchema(schema.taxiPasswordSchema),
  ctrl.deliverySetAdminPassword
);
deliveryRouter.get(
  "/admin/operador",
  ctrl.authDeliveryAdmin,
  ctrl.requireDeliveryAdmin,
  ctrl.deliveryGetOperador
);
deliveryRouter.patch(
  "/admin/operador",
  ctrl.authDeliveryAdmin,
  ctrl.requireDeliveryAdmin,
  validateSchema(schema.taxiOperadorUpdateSchema),
  ctrl.deliveryUpdateOperador
);
deliveryRouter.patch(
  "/admin/pedidos/:id_pedido",
  ctrl.authDeliveryAdmin,
  ctrl.requireDeliveryAdmin,
  validateSchema(schema.deliveryPedidoAdminPatchSchema),
  ctrl.deliveryAdminPatchPedido
);
deliveryRouter.get(
  "/cliente/pedidos",
  ctrl.authDeliveryAdmin,
  ctrl.requireDeliveryCliente,
  ctrl.deliveryClienteListPedidos
);
deliveryRouter.post(
  "/cliente/pedidos",
  ctrl.authDeliveryAdmin,
  ctrl.requireDeliveryCliente,
  validateSchema(schema.deliveryPedidoSchema),
  ctrl.deliveryClienteCreatePedido
);
deliveryRouter.get(
  "/repartidor/pedidos",
  ctrl.authDeliveryAdmin,
  ctrl.requireDeliveryRepartidor,
  ctrl.deliveryRepartidorListPedidos
);
deliveryRouter.patch(
  "/repartidor/pedidos/:id_pedido",
  ctrl.authDeliveryAdmin,
  ctrl.requireDeliveryRepartidor,
  validateSchema(schema.deliveryRepartidorPatchSchema),
  ctrl.deliveryRepartidorPatchPedido
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
