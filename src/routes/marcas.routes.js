import { Router } from "express";
import { methods as marcasController } from "./../controllers/marcas.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

// Aplica el middleware de autenticación a todas las rutas de productos
router.use(auth);


router.get("/", marcasController.getMarcas);
router.get("/:id", marcasController.getMarca);
router.post("/", marcasController.addMarca);
router.put("/update/:id", marcasController.updateMarca);
router.put("/deactivate/:id", marcasController.deactivateMarca);
router.delete("/:id", marcasController.deleteMarca);
router.post("/import/excel", marcasController.importExcel);

export default router;