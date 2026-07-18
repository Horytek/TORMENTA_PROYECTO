import { Router } from "express";
import { methods as subCategoriaController } from "./../controllers/subcategoria.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();

// Aplica el middleware de autenticación a todas las rutas de productos
router.use(auth);


router.get("/", subCategoriaController.getSubCategorias);
router.get("/categoria/:id", subCategoriaController.getSubcategoriesForCategory);
router.get("/check-usage/:id", subCategoriaController.checkUsageSubcategoria);
router.get("/subcategoria_list", subCategoriaController.getSubcategoriasConCategoria);
router.get("/:id", subCategoriaController.getSubCategoria);
router.post("/", requireCapability("productos", "crear"), subCategoriaController.addSubCategoria);
router.put("/update/:id", requireCapability("productos", "editar"), subCategoriaController.updateSubCategoria);
router.put("/deactivate/:id", requireCapability("productos", "desactivar"), subCategoriaController.deactivateSubCategoria);
router.delete("/:id", requireCapability("productos", "eliminar"), subCategoriaController.deleteSubCategoria);
router.post("/import/excel", requireCapability("productos", "crear"), subCategoriaController.importExcel);


export default router;
