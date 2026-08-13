import { Router } from "express";
import { methods as c } from "../controllers/catalogoPublico.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability, ADMIN_ROLE_ID, isDeveloperReq } from "../middlewares/authorize.middleware.js";
import {
  catalogoBuyerAuth,
} from "../middlewares/catalogoBuyerAuth.middleware.js";

const router = Router();

// Webhook MP (sin auth)
router.post("/webhook/mp", c.webhookMp);
router.get("/webhook/mp", c.webhookMp);

// Admin ERP (JWT horytek-erp + módulo `catalogo`)
const catalogoCap = (accion) => (req, res, next) => {
  const idRol = Number(req.user?.rol);
  if (isDeveloperReq(req) || idRol === ADMIN_ROLE_ID) return next();
  return requireCapability("catalogo", accion)(req, res, next);
};

const ver = [auth, catalogoCap("ver")];
const editar = [auth, catalogoCap("editar")];

router.get("/admin/config", auth, c.adminGetConfig);
router.patch("/admin/config", auth, c.adminPatchConfig);
router.get("/admin/pedidos", ...ver, c.adminListPedidos);
router.patch("/admin/pedidos/:id/estado", ...editar, c.adminUpdatePedidoEstado);
router.post("/admin/pickup/validar", ...editar, c.adminValidarPickup);
router.get("/admin/cupones", ...ver, c.adminCupones);
router.post("/admin/cupones", ...editar, c.adminCupones);
router.get("/admin/entrega", ...ver, c.adminEntrega);
router.post("/admin/entrega", ...editar, c.adminEntrega);
router.get("/admin/sucursales", ...ver, c.adminListSucursales);
router.patch("/admin/sucursales/:id", ...editar, c.adminPatchSucursal);
router.post("/admin/tienda/:kind", ...editar, c.adminUploadBrand);
router.get("/admin/consultas", ...ver, c.adminConsultasStats);
router.get("/admin/resenas/stats", ...ver, c.adminResenaStats);
router.get("/admin/resenas/config", ...ver, c.adminGetResenaConfig);
router.patch("/admin/resenas/config", ...editar, c.adminPatchResenaConfig);
router.get("/admin/resenas", ...ver, c.adminListResenas);
router.patch("/admin/resenas/:id", ...editar, c.adminModerarResena);
router.get("/admin/banners", ...ver, c.adminBanners);
router.post("/admin/banners", ...editar, c.adminBanners);
router.patch("/admin/productos/:id", ...editar, c.adminPatchProductoTienda);

// Storefront por slug
router.get("/store/:slug", c.getStorefront);
router.get("/store/:slug/productos", c.getCatalogoProductos);
router.get("/store/:slug/productos/:id", c.getProducto);
router.post("/store/:slug/consultas-wa", c.postConsultaWa);
router.post("/store/:slug/auth/register", c.registerBuyer);
router.post("/store/:slug/auth/login", c.loginBuyer);
router.get("/store/:slug/auth/me", catalogoBuyerAuth, c.meBuyer);
router.post("/store/:slug/checkout", catalogoBuyerAuth, c.checkout);
router.post("/store/:slug/cupon/validar", c.validateCupon);
router.get("/store/:slug/envio/cotizar", c.cotizarEnvio);
router.post("/store/:slug/envio/cotizar", c.cotizarEnvio);
router.get("/store/:slug/envio/opciones", c.opcionesEnvio);
router.get("/store/:slug/mis-pedidos", catalogoBuyerAuth, c.misPedidos);
router.get("/store/:slug/mis-pedidos/:codigo", catalogoBuyerAuth, c.miPedidoDetalle);
router.get("/store/:slug/ordenes/:codigo/sync-pago", c.syncPago);
router.get("/store/:slug/favoritos", catalogoBuyerAuth, c.listFavoritos);
router.post("/store/:slug/favoritos", catalogoBuyerAuth, c.addFavorito);
router.delete("/store/:slug/favoritos/:id_producto", catalogoBuyerAuth, c.removeFavorito);
router.post("/store/:slug/resenas", catalogoBuyerAuth, c.crearResena);

// Legacy: /api/catalogo/:id_tenant
router.get("/:id_tenant/productos", c.getCatalogoProductos);
router.get("/:id_tenant/productos/:id", c.getProducto);
router.get("/:id_tenant", c.getStorefront);

export default router;
