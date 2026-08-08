import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validator.middleware.js";
import {
  mayoristaTiendaSchema,
  mayoristaListaSchema,
  mayoristaItemSchema,
  mayoristaCompradorSchema,
  mayoristaLoginSchema,
  mayoristaPedidoSchema,
} from "../schemas/mayorista.schema.js";
import {
  listTiendas,
  createTienda,
  createLista,
  listListas,
  addListaItem,
  listListaItems,
  createComprador,
  listPedidosAdmin,
  updatePedidoEstado,
  getPortalPublic,
  loginComprador,
  catalogoComprador,
  crearPedidoComprador,
  misPedidosComprador,
  authMayoristaComprador,
} from "../controllers/mayorista.controller.js";

const router = Router();

/* Público / portal B2B */
router.get("/portal/:slug", getPortalPublic);
router.post("/auth/login", validateSchema(mayoristaLoginSchema), loginComprador);
router.get("/me/catalogo", authMayoristaComprador, catalogoComprador);
router.post("/me/pedidos", authMayoristaComprador, validateSchema(mayoristaPedidoSchema), crearPedidoComprador);
router.get("/me/pedidos", authMayoristaComprador, misPedidosComprador);

/* Admin ERP */
router.get("/admin/tiendas", auth, listTiendas);
router.post("/admin/tiendas", auth, validateSchema(mayoristaTiendaSchema), createTienda);
router.get("/admin/listas", auth, listListas);
router.post("/admin/listas", auth, validateSchema(mayoristaListaSchema), createLista);
router.get("/admin/listas/:id_lista/items", auth, listListaItems);
router.post("/admin/items", auth, validateSchema(mayoristaItemSchema), addListaItem);
router.post("/admin/compradores", auth, validateSchema(mayoristaCompradorSchema), createComprador);
router.get("/admin/pedidos", auth, listPedidosAdmin);
router.patch("/admin/pedidos/:id_pedido", auth, updatePedidoEstado);

export default router;
