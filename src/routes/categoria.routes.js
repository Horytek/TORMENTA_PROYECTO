import { Router } from "express";
import { methods as categoriaController } from "./../controllers/categoria.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();

// Aplica el middleware de autenticación a todas las rutas de productos
router.use(auth);


router.get("/", categoriaController.getCategorias);
router.get("/check-usage/:id", categoriaController.checkUsageCategoria);
router.get("/:id", categoriaController.getCategoria);
router.post("/", requireCapability("productos", "crear"), categoriaController.addCategoria);
router.put("/update/:id", requireCapability("productos", "editar"), categoriaController.updateCategoria);
router.put("/deactivate/:id", requireCapability("productos", "desactivar"), categoriaController.deactivateCategoria);
router.delete("/:id", requireCapability("productos", "eliminar"), categoriaController.deleteCategoria);
router.post("/import/excel", requireCapability("productos", "crear"), categoriaController.importExcel);

export default router;
