import { Router } from "express";
import { methods as empleadosController } from "../controllers/vendedores.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

// Aplica el middleware de autenticación a todas las rutas de productos
router.use(auth);


router.get("/", empleadosController.getVendedores);
router.get("/:dni", empleadosController.getVendedor);
router.post("/", empleadosController.addVendedor);
router.put("/update/:dni", empleadosController.updateVendedor);
router.put("/deactivate/:dni", empleadosController.deactivateVendedor);
router.delete("/:dni", empleadosController.deleteVendedor);

export default router;