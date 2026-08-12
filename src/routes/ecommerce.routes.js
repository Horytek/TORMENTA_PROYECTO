import { Router } from "express";
import { validateSchema } from "../middlewares/validator.middleware.js";
import { ecommerceAuth } from "../middlewares/ecommerceAuth.middleware.js";
import { storefrontAuth } from "../middlewares/storefrontAuth.middleware.js";
import {
  ecommerceRegisterSchema,
  ecommerceLoginSchema,
  ecommerceCreatePreferenceSchema,
  ecommerceProductoSchema,
  ecommerceMpCredentialsSchema,
  ecommerceCheckoutSchema,
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
} from "../schemas/ecommerce.schema.js";
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
  listOrdenes,
  getOrden,
  getStoreBySlug,
  getStoreProduct,
  checkoutStore,
  ecommerceStoreWebhook,
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
  "/store/:slug/checkout",
  storefrontAuth,
  validateSchema(ecommerceCheckoutSchema),
  checkoutStore
);

// Webhook carrito (token comerciante)
router.post("/webhook", ecommerceStoreWebhook);
router.get("/webhook", ecommerceStoreWebhook);

// Admin
router.use("/admin", ecommerceAuth);
router.get("/admin/me", meEcommerce);
router.get("/admin/dashboard", getDashboard);
router.get("/admin/pickup/kpis", getPickupDashboardKpis);
router.get("/admin/entregas/kpis", getEntregaDashboardKpis);
router.get("/admin/entregas/config", getEntregaConfig);
router.patch(
  "/admin/entregas/config",
  validateSchema(ecommerceEntregaConfigSchema),
  patchEntregaConfig
);
router.get("/admin/entregas/zonas", listZonas);
router.post(
  "/admin/entregas/zonas",
  validateSchema(ecommerceZonaSchema),
  createZona
);
router.put(
  "/admin/entregas/zonas/:id",
  validateSchema(ecommerceZonaSchema.partial()),
  updateZona
);
router.delete("/admin/entregas/zonas/:id", deleteZona);
router.get("/admin/entregas/destinos", listDestinos);
router.post(
  "/admin/entregas/destinos",
  validateSchema(ecommerceDestinoSchema),
  createDestino
);
router.put(
  "/admin/entregas/destinos/:id",
  validateSchema(ecommerceDestinoSchema.partial()),
  updateDestino
);
router.delete("/admin/entregas/destinos/:id", deleteDestino);
router.get("/admin/entregas/agencias", listAgencias);
router.post(
  "/admin/entregas/agencias",
  validateSchema(ecommerceAgenciaSchema),
  createAgencia
);
router.put(
  "/admin/entregas/agencias/:id",
  validateSchema(ecommerceAgenciaSchema.partial()),
  updateAgencia
);
router.delete("/admin/entregas/agencias/:id", deleteAgencia);
router.patch("/admin/tienda", validateSchema(ecommerceTiendaUpdateSchema), updateTienda);
router.post(
  "/admin/tienda/logo",
  validateSchema(ecommerceBrandUploadSchema),
  uploadTiendaLogo
);
router.post(
  "/admin/tienda/banner",
  validateSchema(ecommerceBrandUploadSchema),
  uploadTiendaBanner
);
router.put(
  "/admin/mp-credentials",
  validateSchema(ecommerceMpCredentialsSchema),
  saveMpCredentials
);
router.get("/admin/productos", listProductos);
router.post("/admin/productos", validateSchema(ecommerceProductoSchema), createProducto);
router.put("/admin/productos/:id", validateSchema(ecommerceProductoSchema.partial()), updateProducto);
router.delete("/admin/productos/:id", deleteProducto);
router.post("/admin/productos/:id/imagenes", uploadProductoImagen);
router.get("/admin/ordenes", listOrdenes);
router.get("/admin/ordenes/:id", getOrden);

// Admin — pickup / retiro
router.get("/admin/pickup/ordenes", listPickupOrdenes);
router.get("/admin/pickup/ordenes/:id", getPickupOrden);
router.patch(
  "/admin/pickup/ordenes/:id/estado",
  validateSchema(ecommercePickupEstadoSchema),
  patchPickupEstado
);
router.post(
  "/admin/pickup/validar",
  validateSchema(ecommercePickupValidarSchema),
  validarRetiro
);
router.post(
  "/admin/pickup/confirmar-entrega/:id_orden",
  validateSchema(ecommercePickupConfirmarSchema),
  confirmarEntrega
);

// Admin — reseñas
router.get("/admin/reviews/config", getReviewConfig);
router.patch(
  "/admin/reviews/config",
  validateSchema(ecommerceReviewConfigSchema),
  patchReviewConfig
);
router.get("/admin/reviews/stats", adminReviewStats);
router.get("/admin/reviews", adminListReviews);
router.patch(
  "/admin/reviews/:id/estado",
  validateSchema(ecommerceReviewEstadoSchema),
  adminPatchReviewEstado
);
router.post(
  "/admin/reviews/:id/reply",
  validateSchema(ecommerceReviewReplySchema),
  adminReplyReview
);

// Admin — sucursales e inventario multisucursal
router.get("/admin/sucursales", adminListSucursales);
router.post("/admin/sucursales", validateSchema(ecommerceSucursalSchema), adminCreateSucursal);
router.put("/admin/sucursales/:id", validateSchema(ecommerceSucursalSchema.partial()), adminUpdateSucursal);
router.delete("/admin/sucursales/:id", adminDeleteSucursal);
router.get("/admin/inventario/resumen", adminInventarioResumen);
router.get("/admin/inventario/matriz", adminInventarioMatriz);
router.post("/admin/inventario/ajuste", validateSchema(ecommerceInventarioAjusteSchema), adminAjustarInventario);
router.get("/admin/inventario/movimientos", adminListMovimientos);
router.get("/admin/variantes/search", adminSearchVariantes);
router.get("/admin/transferencias", adminListTransferencias);
router.post("/admin/transferencias", validateSchema(ecommerceTransferenciaSchema), adminCreateTransferencia);
router.patch(
  "/admin/transferencias/:id/estado",
  validateSchema(ecommerceTransferenciaEstadoSchema),
  adminUpdateTransferenciaEstado
);

export default router;
