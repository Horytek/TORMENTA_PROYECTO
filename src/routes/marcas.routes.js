import { Router } from "express";
import { methods as marcasController } from "./../controllers/marcas.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();

// Aplica el middleware de autenticación a todas las rutas de productos
router.use(auth);


router.get("/", marcasController.getMarcas);
router.get("/check-usage/:id", marcasController.checkUsageMarca);
router.get("/:id", marcasController.getMarca);
router.post("/", requireCapability("productos", "crear"), marcasController.addMarca);
router.put("/update/:id", requireCapability("productos", "editar"), marcasController.updateMarca);
router.put("/deactivate/:id", requireCapability("productos", "desactivar"), marcasController.deactivateMarca);
router.delete("/:id", requireCapability("productos", "eliminar"), marcasController.deleteMarca);
router.post("/import/excel", requireCapability("productos", "crear"), marcasController.importExcel);

export default router;