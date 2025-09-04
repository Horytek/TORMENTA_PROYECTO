import { Router } from "express";
import { methods as productosController } from "./../controllers/productos.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { logMiddleware } from "../middlewares/log.middleware.js";

const router = Router();

// Aplica el middleware de autenticación a todas las rutas de productos
router.use(auth);
router.use(logMiddleware);

router.get("/", productosController.getProductos);
router.get("/lastid", productosController.getUltimoIdProducto);
router.get("/:id", productosController.getProducto);
router.post("/", productosController.addProducto);
router.put("/:id", productosController.updateProducto);
router.delete("/:id", productosController.deleteProducto);

export default router;