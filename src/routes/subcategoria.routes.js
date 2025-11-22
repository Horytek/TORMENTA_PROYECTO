import { Router } from "express";
import { methods as subCategoriaController } from "./../controllers/subcategoria.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

// Aplica el middleware de autenticación a todas las rutas de productos
router.use(auth);


router.get("/", subCategoriaController.getSubCategorias);
router.get("/categoria/:id", subCategoriaController.getSubcategoriesForCategory);
router.get("/subcategoria_list", subCategoriaController.getSubcategoriasConCategoria);
router.get("/:id", subCategoriaController.getSubCategoria);
router.post("/", subCategoriaController.addSubCategoria);
router.put("/update/:id", subCategoriaController.updateSubCategoria);
router.put("/deactivate/:id", subCategoriaController.deactivateSubCategoria);
router.delete("/:id", subCategoriaController.deleteSubCategoria);
router.post("/import/excel", subCategoriaController.importExcel);


export default router;
