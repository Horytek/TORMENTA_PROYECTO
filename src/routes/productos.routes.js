import { Router } from "express";
import { methods as productosController } from "./../controllers/productos.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { logMiddleware } from "../middlewares/log.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();

// Aplica el middleware de autenticación a todas las rutas de productos
router.use(auth);
router.use(logMiddleware);

router.get("/", productosController.getProductos);
router.get("/lastid", productosController.getUltimoIdProducto);
router.get("/:id/variants", productosController.getProductVariants);
router.get("/:id/attributes", productosController.getProductAttributes);
router.get("/:id/historial-precio", productosController.getHistorialPrecioProducto);
router.post("/variants", requireCapability("productos", "crear"), productosController.registerVariants);
router.get("/:id", productosController.getProducto);
router.post("/", requireCapability("productos", "crear"), productosController.addProducto);
router.put("/:id", requireCapability("productos", "editar"), productosController.updateProducto);
router.delete("/:id", requireCapability("productos", "eliminar"), productosController.deleteProducto);
router.post("/skus/generate", requireCapability("productos", "generar"), productosController.generateSKUs);
router.post("/import/excel", requireCapability("productos", "crear"), productosController.importExcel);

export default router;