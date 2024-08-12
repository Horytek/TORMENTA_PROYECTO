import { Router } from "express";
import { methods as productosController } from "./../controllers/productos.controller";

const router = Router();

router.get("/", productosController.getProductos);
router.get("/lastid", productosController.getUltimoIdProducto);
router.get("/:id", productosController.getProducto);
router.post("/", productosController.addProducto);
router.put("/:id", productosController.updateProducto);
router.delete("/:id", productosController.deleteProducto);

export default router;