import { Router } from "express";
import { methods as empleadosController } from "../controllers/vendedores.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();

// Aplica el middleware de autenticación a todas las rutas de productos
router.use(auth);


router.get("/", empleadosController.getVendedores);
router.get("/comisiones", empleadosController.getComisiones);
router.get("/:dni", empleadosController.getVendedor);
router.post("/", requireCapability("empleados", "crear"), empleadosController.addVendedor);
router.put("/update/:dni", requireCapability("empleados", "editar"), empleadosController.updateVendedor);
router.put("/deactivate/:dni", requireCapability("empleados", "desactivar"), empleadosController.deactivateVendedor);
router.put("/reactivate/:dni", requireCapability("empleados", "desactivar"), empleadosController.reactivateVendedor);
router.delete("/:dni", requireCapability("empleados", "eliminar"), empleadosController.deleteVendedor);

export default router;