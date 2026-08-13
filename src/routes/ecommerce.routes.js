import { Router } from "express";
import { validateSchema } from "../middlewares/validator.middleware.js";
import { ecommerceAuth } from "../middlewares/ecommerceAuth.middleware.js";
import { storefrontAuth, storefrontAuthOptional } from "../middlewares/storefrontAuth.middleware.js";
import {
  ecommerceRegisterSchema,
  ecommerceLoginSchema,
  ecommerceCreatePreferenceSchema,
  ecommerceProductoSchema,
  ecommerceMpCredentialsSchema,
  ecommerceCheckoutSchema,
  ecommerceCartValidateSchema,
  ecommerceTiendaUpdateSchema,
  ecommerceBrandUploadSchema,
  ecommerceSucursalSchema,
  ecommerceInventarioAjusteSchema,
  ecommerceTransferenciaSchema,
  ecommerceTransferenciaEstadoSchema,
  ecommerceBuyerRegisterSchema,
  ecommerceBuyerLoginSchema,
  ecommerceBuyerProfileSchema,
  ecommerceBuyerPasswordSchema,
  ecommercePickupEstadoSchema,
  ecommercePickupValidarSchema,
  ecommercePickupConfirmarSchema,
  ecommerceEntregaConfigSchema,
  ecommerceZonaSchema,
  ecommerceDestinoSchema,
  ecommerceAgenciaSchema,
  ecommerceCotizarSchema,
  ecommerceReviewConfigSchema,
  ecommerceReviewCreateSchema,
  ecommerceReviewMediaUploadSchema,
  ecommerceReviewEstadoSchema,
  ecommerceReviewReplySchema,
  ecommerceDeleteOrdenesSchema,
  ecommerceDisponibilidadConfigSchema,
  ecommerceConsultaDisponibilidadSchema,
  ecommerceSolicitudCreateSchema,
  ecommerceSolicitudAprobarSchema,
  ecommerceSolicitudRechazarSchema,
  ecommerceAtributoSchema,
  ecommerceAtributoValorSchema,
  ecommerceProductoAtributosSchema,
  ecommerceImagenReorderSchema,
  ecommerceRolPatchSchema,
  ecommerceUsuarioCreateSchema,
  ecommerceUsuarioUpdateSchema,
  ecommerceTaxonomiaSchema,
  ecommerceTaxonomiaPatchSchema,
} from "../schemas/ecommerce.schema.js";
import { ecommerceAccess, requireEcommercePermiso } from "../middlewares/ecommerceRbac.middleware.js";
import {
  registerEcommerce,
  createEcommerceSaasPreference,
  listEcommercePlans,
  loginEcommerce,
  meEcommerce,
  updateTienda,
  uploadTiendaLogo,
  uploadTiendaBanner,
  saveMpCredentials,
  getDashboard,
  listProductos,
  createProducto,
  updateProducto,
  deleteProducto,
  uploadProductoImagen,
  listProductoImagenes,
  setProductoImagenPrincipal,
  reorderProductoImagenes,
  deleteProductoImagen,
  listOrdenes,
  getOrden,
  deleteOrdenes,
  getStoreBySlug,
  getStoreProduct,
  validateCartStore,
  checkoutStore,
  ecommerceStoreWebhook,
  syncStoreOrderPayment,
} from "../controllers/ecommerce.controller.js";
import {
  registerBuyer,
  loginBuyer,
  meBuyer,
  updateBuyerProfile,
  changeBuyerPassword,
  listFavoritos,
  toggleFavorito,
  deleteFavorito,
  listMisPedidos,
  getMisPedido,
  getMisPedidoQr,
} from "../controllers/ecommerceBuyer.controller.js";
import {
  listPickupOrdenes,
  getPickupOrden,
  patchPickupEstado,
  validarRetiro,
  confirmarEntrega,
  getPickupDashboardKpis,
} from "../controllers/ecommercePickup.controller.js";
import {
  getEntregaConfig,
  patchEntregaConfig,
  listZonas,
  createZona,
  updateZona,
  deleteZona,
  listDestinos,
  createDestino,
  updateDestino,
  deleteDestino,
  listAgencias,
  createAgencia,
  updateAgencia,
  deleteAgencia,
  storeEntregaOpciones,
  storeEntregaCotizar,
  getEntregaDashboardKpis,
} from "../controllers/ecommerceDelivery.controller.js";
import {
  getReviewConfig,
  patchReviewConfig,
  getReviewEligibilidad,
  getProductReviews,
  getReviewSummary,
  getSucursalReviews,
  getOpinionesGenerales,
  createReview,
  uploadReviewMedia,
  listMisReviews,
  adminListReviews,
  adminReviewStats,
  adminPatchReviewEstado,
  adminReplyReview,
} from "../controllers/ecommerceReview.controller.js";
import {
  listStoreSucursales,
  searchStore,
  getProductAvailability,
  resolveProductDisponibilidad,
  adminListSucursales,
  adminCreateSucursal,
  adminUpdateSucursal,
  adminDeleteSucursal,
  adminInventarioResumen,
  adminInventarioMatriz,
  adminAjustarInventario,
  adminListMovimientos,
  adminListTransferencias,
  adminSearchVariantes,
  adminCreateTransferencia,
  adminUpdateTransferenciaEstado,
} from "../controllers/ecommerceBranch.controller.js";
import {
  adminListAtributos,
  adminGetAtributo,
  adminCreateAtributo,
  adminUpdateAtributo,
  adminDeleteAtributo,
  adminAddAtributoValor,
  adminUpdateAtributoValor,
  adminDeleteAtributoValor,
  adminAtributoProductos,
  adminGetProductoAtributos,
  adminSetProductoAtributos,
  adminListStock,
} from "../controllers/ecommerceAttribute.controller.js";
import {
  adminListTaxonomia,
  adminCreateTaxonomia,
  adminUpdateTaxonomia,
  adminDeleteTaxonomia,
} from "../controllers/ecommerceTaxonomy.controller.js";
import {
  adminListRoles,
  adminPatchRol,
  adminListUsuarios,
  adminCreateUsuario,
  adminUpdateUsuario,
} from "../controllers/ecommerceRbac.controller.js";
import {
  adminGetDisponibilidadConfig,
  adminPatchDisponibilidadConfig,
  adminDisponibilidadStats,
  adminListReservasDisponibilidad,
  adminCrearReservaDisponibilidad,
  adminCancelarReservaDisponibilidad,
  storeRegistrarConsulta,
} from "../controllers/ecommerceDisponibilidad.controller.js";
import {
  storeCrearSolicitud,
  storeListMisSolicitudes,
  storeGetMisSolicitud,
  storeCancelarSolicitud,
  storeComprarDesdeSolicitud,
  storeListMisNotificaciones,
  storeUnreadNotificaciones,
  storeLeerNotificacion,
  storeLeerTodasNotificaciones,
  adminListSolicitudes,
  adminStatsSolicitudes,
  adminGetSolicitud,
  adminEnRevisionSolicitud,
  adminConfirmarSolicitud,
  adminEnTrasladoSolicitud,
  adminAprobarSolicitud,
  adminRechazarSolicitud,
  adminCancelarSolicitud,
} from "../controllers/ecommerceSolicitud.controller.js";

const router = Router();

// Público — SaaS
router.get("/plans", listEcommercePlans);
router.post("/register", validateSchema(ecommerceRegisterSchema), registerEcommerce);
router.post(
  "/create-preference",
  validateSchema(ecommerceCreatePreferenceSchema),
  createEcommerceSaasPreference
);
router.post("/auth/login", validateSchema(ecommerceLoginSchema), loginEcommerce);

// Público — storefront
router.get("/store/:slug", getStoreBySlug);
router.get("/store/:slug/sucursales", listStoreSucursales);
router.get("/store/:slug/search", searchStore);
router.get("/store/:slug/products/:id", getStoreProduct);
router.get("/store/:slug/products/:id/disponibilidad", getProductAvailability);
router.post(
  "/store/:slug/products/:id/disponibilidad/resolver",
  resolveProductDisponibilidad
);
router.get(
  "/store/:slug/products/:id/disponibilidad/resolver",
  resolveProductDisponibilidad
);
router.post(
  "/store/:slug/consultas-disponibilidad",
  validateSchema(ecommerceConsultaDisponibilidadSchema),
  storeRegistrarConsulta
);
router.get("/store/:slug/products/:id/reviews", getProductReviews);
router.get("/store/:slug/reviews/summary", getReviewSummary);
router.get("/store/:slug/sucursales/:id/reviews", getSucursalReviews);
router.get("/store/:slug/opiniones", getOpinionesGenerales);
router.get("/store/:slug/entregas/opciones", storeEntregaOpciones);
router.post(
  "/store/:slug/entregas/cotizar",
  validateSchema(ecommerceCotizarSchema),
  storeEntregaCotizar
);

// Auth comprador (público register/login)
router.post(
  "/store/:slug/auth/register",
  validateSchema(ecommerceBuyerRegisterSchema),
  registerBuyer
);
router.post(
  "/store/:slug/auth/login",
  validateSchema(ecommerceBuyerLoginSchema),
  loginBuyer
);

// Comprador autenticado
router.get("/store/:slug/auth/me", storefrontAuth, meBuyer);
router.patch(
  "/store/:slug/auth/me",
  storefrontAuth,
  validateSchema(ecommerceBuyerProfileSchema),
  updateBuyerProfile
);
router.patch(
  "/store/:slug/auth/me/password",
  storefrontAuth,
  validateSchema(ecommerceBuyerPasswordSchema),
  changeBuyerPassword
);
router.get("/store/:slug/favoritos", storefrontAuth, listFavoritos);
router.post("/store/:slug/favoritos/:id_producto", storefrontAuth, toggleFavorito);
router.delete("/store/:slug/favoritos/:id_producto", storefrontAuth, deleteFavorito);
router.get("/store/:slug/mis-pedidos", storefrontAuth, listMisPedidos);
router.get("/store/:slug/mis-pedidos/:id_orden", storefrontAuth, getMisPedido);
router.get("/store/:slug/mis-pedidos/:id_orden/qr", storefrontAuth, getMisPedidoQr);
router.get("/store/:slug/reviews/eligibilidad", storefrontAuth, getReviewEligibilidad);
router.post(
  "/store/:slug/reviews",
  storefrontAuth,
  validateSchema(ecommerceReviewCreateSchema),
  createReview
);
router.post(
  "/store/:slug/reviews/media",
  storefrontAuth,
  validateSchema(ecommerceReviewMediaUploadSchema),
  uploadReviewMedia
);
router.get("/store/:slug/mis-reviews", storefrontAuth, listMisReviews);

router.post(
  "/store/:slug/solicitudes",
  storefrontAuth,
  validateSchema(ecommerceSolicitudCreateSchema),
  storeCrearSolicitud
);
router.get("/store/:slug/mis-solicitudes", storefrontAuth, storeListMisSolicitudes);
router.get("/store/:slug/mis-solicitudes/:id", storefrontAuth, storeGetMisSolicitud);
router.post("/store/:slug/mis-solicitudes/:id/cancelar", storefrontAuth, storeCancelarSolicitud);
router.post("/store/:slug/mis-solicitudes/:id/comprar", storefrontAuth, storeComprarDesdeSolicitud);
router.get("/store/:slug/mis-notificaciones", storefrontAuth, storeListMisNotificaciones);
router.get("/store/:slug/mis-notificaciones/unread-count", storefrontAuth, storeUnreadNotificaciones);
router.post("/store/:slug/mis-notificaciones/leer-todas", storefrontAuth, storeLeerTodasNotificaciones);
router.post("/store/:slug/mis-notificaciones/:id/leer", storefrontAuth, storeLeerNotificacion);

router.post(
  "/store/:slug/cart/validate",
  storefrontAuthOptional,
  validateSchema(ecommerceCartValidateSchema),
  validateCartStore
);
router.post(
  "/store/:slug/checkout",
  storefrontAuth,
  validateSchema(ecommerceCheckoutSchema),
  checkoutStore
);

// Webhook carrito (token comerciante)
router.post("/webhook", ecommerceStoreWebhook);
router.get("/webhook", ecommerceStoreWebhook);
router.get("/store/:slug/ordenes/:codigo/sync-pago", syncStoreOrderPayment);

// Admin
const P = requireEcommercePermiso;
router.use("/admin", ecommerceAuth, ecommerceAccess);
router.get("/admin/me", meEcommerce);
router.get("/admin/dashboard", P("dashboard.ver"), getDashboard);
router.get("/admin/pickup/kpis", P("pedidos.ver"), getPickupDashboardKpis);
router.get("/admin/entregas/kpis", P("entregas.ver"), getEntregaDashboardKpis);
router.get("/admin/entregas/config", P("entregas.ver"), getEntregaConfig);
router.patch(
  "/admin/entregas/config",
  P("entregas.editar"),
  validateSchema(ecommerceEntregaConfigSchema),
  patchEntregaConfig
);
router.get("/admin/entregas/zonas", P("entregas.ver"), listZonas);
router.post(
  "/admin/entregas/zonas",
  P("entregas.editar"),
  validateSchema(ecommerceZonaSchema),
  createZona
);
router.put(
  "/admin/entregas/zonas/:id",
  P("entregas.editar"),
  validateSchema(ecommerceZonaSchema.partial()),
  updateZona
);
router.delete("/admin/entregas/zonas/:id", P("entregas.editar"), deleteZona);
router.get("/admin/entregas/destinos", P("entregas.ver"), listDestinos);
router.post(
  "/admin/entregas/destinos",
  P("entregas.editar"),
  validateSchema(ecommerceDestinoSchema),
  createDestino
);
router.put(
  "/admin/entregas/destinos/:id",
  P("entregas.editar"),
  validateSchema(ecommerceDestinoSchema.partial()),
  updateDestino
);
router.delete("/admin/entregas/destinos/:id", P("entregas.editar"), deleteDestino);
router.get("/admin/entregas/agencias", P("entregas.ver"), listAgencias);
router.post(
  "/admin/entregas/agencias",
  P("entregas.editar"),
  validateSchema(ecommerceAgenciaSchema),
  createAgencia
);
router.put(
  "/admin/entregas/agencias/:id",
  P("entregas.editar"),
  validateSchema(ecommerceAgenciaSchema.partial()),
  updateAgencia
);
router.delete("/admin/entregas/agencias/:id", P("entregas.editar"), deleteAgencia);
router.patch(
  "/admin/tienda",
  P("configuracion.editar"),
  validateSchema(ecommerceTiendaUpdateSchema),
  updateTienda
);
router.get("/admin/disponibilidad/config", P("configuracion.ver"), adminGetDisponibilidadConfig);
router.patch(
  "/admin/disponibilidad/config",
  P("configuracion.editar"),
  validateSchema(ecommerceDisponibilidadConfigSchema),
  adminPatchDisponibilidadConfig
);
router.get("/admin/disponibilidad/stats", P("dashboard.ver"), adminDisponibilidadStats);
router.get("/admin/disponibilidad/reservas", P("inventario.ver"), adminListReservasDisponibilidad);
router.post("/admin/disponibilidad/reservas", P("inventario.editar"), adminCrearReservaDisponibilidad);
router.delete(
  "/admin/disponibilidad/reservas/:id",
  P("inventario.editar"),
  adminCancelarReservaDisponibilidad
);

router.get("/admin/solicitudes/stats", P("solicitudes.ver"), adminStatsSolicitudes);
router.get("/admin/solicitudes", P("solicitudes.ver"), adminListSolicitudes);
router.get("/admin/solicitudes/:id", P("solicitudes.ver"), adminGetSolicitud);
router.post("/admin/solicitudes/:id/en-revision", P("solicitudes.verificar"), adminEnRevisionSolicitud);
router.post("/admin/solicitudes/:id/confirmar", P("solicitudes.verificar"), adminConfirmarSolicitud);
router.post("/admin/solicitudes/:id/en-traslado", P("solicitudes.verificar"), adminEnTrasladoSolicitud);
router.post(
  "/admin/solicitudes/:id/aprobar",
  P("solicitudes.aprobar"),
  validateSchema(ecommerceSolicitudAprobarSchema),
  adminAprobarSolicitud
);
router.post(
  "/admin/solicitudes/:id/rechazar",
  P("solicitudes.rechazar"),
  validateSchema(ecommerceSolicitudRechazarSchema),
  adminRechazarSolicitud
);
router.post("/admin/solicitudes/:id/cancelar", P("solicitudes.cancelar"), adminCancelarSolicitud);
router.post(
  "/admin/tienda/logo",
  P("configuracion.editar"),
  validateSchema(ecommerceBrandUploadSchema),
  uploadTiendaLogo
);
router.post(
  "/admin/tienda/banner",
  P("configuracion.editar"),
  validateSchema(ecommerceBrandUploadSchema),
  uploadTiendaBanner
);
router.put(
  "/admin/mp-credentials",
  P("configuracion.editar"),
  validateSchema(ecommerceMpCredentialsSchema),
  saveMpCredentials
);
router.get("/admin/productos", P("productos.ver"), listProductos);
router.post("/admin/productos", P("productos.crear"), validateSchema(ecommerceProductoSchema), createProducto);
router.put(
  "/admin/productos/:id",
  P("productos.editar"),
  validateSchema(ecommerceProductoSchema.partial()),
  updateProducto
);
router.delete("/admin/productos/:id", P("productos.eliminar"), deleteProducto);
router.get("/admin/productos/:id/imagenes", P("productos.ver"), listProductoImagenes);
router.post("/admin/productos/:id/imagenes", P("productos.editar"), uploadProductoImagen);
router.patch(
  "/admin/productos/:id/imagenes/reorder",
  P("productos.editar"),
  validateSchema(ecommerceImagenReorderSchema),
  reorderProductoImagenes
);
router.patch(
  "/admin/productos/:id/imagenes/:idImagen/principal",
  P("productos.editar"),
  setProductoImagenPrincipal
);
router.delete(
  "/admin/productos/:id/imagenes/:idImagen",
  P("productos.editar"),
  deleteProductoImagen
);
router.get("/admin/productos/:id/atributos", P("productos.ver"), adminGetProductoAtributos);
router.put(
  "/admin/productos/:id/atributos",
  P("productos.editar"),
  validateSchema(ecommerceProductoAtributosSchema),
  adminSetProductoAtributos
);

router.get("/admin/atributos", P("atributos.ver"), adminListAtributos);
router.post("/admin/atributos", P("atributos.crear"), validateSchema(ecommerceAtributoSchema), adminCreateAtributo);
router.get("/admin/atributos/:id", P("atributos.ver"), adminGetAtributo);
router.put(
  "/admin/atributos/:id",
  P("atributos.editar"),
  validateSchema(ecommerceAtributoSchema.partial()),
  adminUpdateAtributo
);
router.delete("/admin/atributos/:id", P("atributos.eliminar"), adminDeleteAtributo);
router.get("/admin/atributos/:id/productos", P("atributos.ver"), adminAtributoProductos);
router.post(
  "/admin/atributos/:id/valores",
  P("atributos.editar"),
  validateSchema(ecommerceAtributoValorSchema),
  adminAddAtributoValor
);
router.put(
  "/admin/atributos/:id/valores/:idValor",
  P("atributos.editar"),
  validateSchema(ecommerceAtributoValorSchema.partial()),
  adminUpdateAtributoValor
);
router.delete("/admin/atributos/:id/valores/:idValor", P("atributos.editar"), adminDeleteAtributoValor);

router.get("/admin/taxonomia", P("productos.ver"), adminListTaxonomia);
router.post(
  "/admin/taxonomia",
  P("productos.editar"),
  validateSchema(ecommerceTaxonomiaSchema),
  adminCreateTaxonomia
);
router.put(
  "/admin/taxonomia/:id",
  P("productos.editar"),
  validateSchema(ecommerceTaxonomiaPatchSchema),
  adminUpdateTaxonomia
);
router.delete("/admin/taxonomia/:id", P("productos.editar"), adminDeleteTaxonomia);

router.get("/admin/stock", P("stock.ver"), adminListStock);

router.get("/admin/ordenes", P("ordenes.ver"), listOrdenes);
router.post(
  "/admin/ordenes/eliminar",
  P("ordenes.editar"),
  validateSchema(ecommerceDeleteOrdenesSchema),
  deleteOrdenes
);
router.get("/admin/ordenes/:id", P("ordenes.ver"), getOrden);

router.get("/admin/pickup/ordenes", P("pedidos.ver"), listPickupOrdenes);
router.get("/admin/pickup/ordenes/:id", P("pedidos.ver"), getPickupOrden);
router.patch(
  "/admin/pickup/ordenes/:id/estado",
  P("pedidos.editar"),
  validateSchema(ecommercePickupEstadoSchema),
  patchPickupEstado
);
router.post(
  "/admin/pickup/validar",
  P("recojo.escanear"),
  validateSchema(ecommercePickupValidarSchema),
  validarRetiro
);
router.post(
  "/admin/pickup/confirmar-entrega/:id_orden",
  P("recojo.confirmar"),
  validateSchema(ecommercePickupConfirmarSchema),
  confirmarEntrega
);

router.get("/admin/reviews/config", P("resenas.ver"), getReviewConfig);
router.patch(
  "/admin/reviews/config",
  P("resenas.editar"),
  validateSchema(ecommerceReviewConfigSchema),
  patchReviewConfig
);
router.get("/admin/reviews/stats", P("resenas.ver"), adminReviewStats);
router.get("/admin/reviews", P("resenas.ver"), adminListReviews);
router.patch(
  "/admin/reviews/:id/estado",
  P("resenas.editar"),
  validateSchema(ecommerceReviewEstadoSchema),
  adminPatchReviewEstado
);
router.post(
  "/admin/reviews/:id/reply",
  P("resenas.editar"),
  validateSchema(ecommerceReviewReplySchema),
  adminReplyReview
);

router.get("/admin/sucursales", P("sucursales.ver"), adminListSucursales);
router.post("/admin/sucursales", P("sucursales.crear"), validateSchema(ecommerceSucursalSchema), adminCreateSucursal);
router.put(
  "/admin/sucursales/:id",
  P("sucursales.editar"),
  validateSchema(ecommerceSucursalSchema.partial()),
  adminUpdateSucursal
);
router.delete("/admin/sucursales/:id", P("sucursales.eliminar"), adminDeleteSucursal);
router.get("/admin/inventario/resumen", P("inventario.ver"), adminInventarioResumen);
router.get("/admin/inventario/matriz", P("inventario.ver"), adminInventarioMatriz);
router.post(
  "/admin/inventario/ajuste",
  P("inventario.editar"),
  validateSchema(ecommerceInventarioAjusteSchema),
  adminAjustarInventario
);
router.get("/admin/inventario/movimientos", P("inventario.ver"), adminListMovimientos);
router.get("/admin/variantes/search", P("inventario.ver"), adminSearchVariantes);
router.get("/admin/transferencias", P("transferencias.ver"), adminListTransferencias);
router.post(
  "/admin/transferencias",
  P("transferencias.crear"),
  validateSchema(ecommerceTransferenciaSchema),
  adminCreateTransferencia
);
router.patch(
  "/admin/transferencias/:id/estado",
  P("transferencias.editar"),
  validateSchema(ecommerceTransferenciaEstadoSchema),
  adminUpdateTransferenciaEstado
);

router.get("/admin/roles", P("roles.ver"), adminListRoles);
router.patch(
  "/admin/roles/:id",
  P("roles.editar"),
  validateSchema(ecommerceRolPatchSchema),
  adminPatchRol
);
router.get("/admin/usuarios", P("usuarios.ver"), adminListUsuarios);
router.post(
  "/admin/usuarios",
  P("usuarios.crear"),
  validateSchema(ecommerceUsuarioCreateSchema),
  adminCreateUsuario
);
router.patch(
  "/admin/usuarios/:id",
  P("usuarios.editar"),
  validateSchema(ecommerceUsuarioUpdateSchema),
  adminUpdateUsuario
);

export default router;
