import { Router } from "express";
import { validateSchema } from "../middlewares/validator.middleware.js";
import { ecommerceAuth } from "../middlewares/ecommerceAuth.middleware.js";
import {
  ecommerceRegisterSchema,
  ecommerceLoginSchema,
  ecommerceCreatePreferenceSchema,
  ecommerceProductoSchema,
  ecommerceMpCredentialsSchema,
  ecommerceCheckoutSchema,
  ecommerceTiendaUpdateSchema,
  ecommerceBrandUploadSchema,
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
router.get("/store/:slug/products/:id", getStoreProduct);
router.post(
  "/store/:slug/checkout",
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

export default router;
