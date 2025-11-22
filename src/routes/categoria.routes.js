import { Router } from "express";
import { methods as categoriaController } from "./../controllers/categoria.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

// Aplica el middleware de autenticación a todas las rutas de productos
router.use(auth);


router.get("/", categoriaController.getCategorias);
router.get("/:id", categoriaController.getCategoria);
router.post("/", categoriaController.addCategoria);
router.put("/update/:id", categoriaController.updateCategoria);
router.put("/deactivate/:id", categoriaController.deactivateCategoria);
router.delete("/:id", categoriaController.deleteCategoria);
router.post("/import/excel", categoriaController.importExcel);

export default router;
