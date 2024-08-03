import { Router } from "express";
import { methods as subCategoriaController } from "./../controllers/subcategoria.controller";

const router = Router();

router.get("/", subCategoriaController.getSubCategorias);
router.get("/:id", subCategoriaController.getSubCategoria);
router.post("/", subCategoriaController.addSubCategoria);
router.put("/update/:id", subCategoriaController.updateSubCategoria);
router.put("/deactivate/:id", subCategoriaController.deactivateSubCategoria);
router.delete("/:id", subCategoriaController.deleteSubCategoria);

export default router;
