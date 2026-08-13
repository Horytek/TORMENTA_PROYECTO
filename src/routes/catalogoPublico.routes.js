import { Router } from "express";
import { methods as c } from "../controllers/catalogoPublico.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import {
  catalogoBuyerAuth,
} from "../middlewares/catalogoBuyerAuth.middleware.js";

const router = Router();

// Webhook MP (sin auth)
router.post("/webhook/mp", c.webhookMp);
router.get("/webhook/mp", c.webhookMp);

// Admin ERP (JWT horytek-erp)
router.get("/admin/config", auth, c.adminGetConfig);
router.patch("/admin/config", auth, c.adminPatchConfig);
router.get("/admin/pedidos", auth, c.adminListPedidos);
router.patch("/admin/pedidos/:id/estado", auth, c.adminUpdatePedidoEstado);
router.post("/admin/pickup/validar", auth, c.adminValidarPickup);
router.get("/admin/cupones", auth, c.adminCupones);
router.post("/admin/cupones", auth, c.adminCupones);
router.get("/admin/entrega", auth, c.adminEntrega);
router.post("/admin/entrega", auth, c.adminEntrega);
router.get("/admin/resenas", auth, c.adminListResenas);
router.patch("/admin/resenas/:id", auth, c.adminModerarResena);
router.get("/admin/banners", auth, c.adminBanners);
router.post("/admin/banners", auth, c.adminBanners);
router.patch("/admin/productos/:id", auth, c.adminPatchProductoTienda);

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
