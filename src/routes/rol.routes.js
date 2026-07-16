import { Router } from "express";
import { methods as rolController } from "../controllers/rol.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();

// Aplica el middleware de autenticación a todas las rutas de productos
router.use(auth);


router.get("/", rolController.getRoles);
router.get("/:id", rolController.getRol);
router.get("/pagina-defecto/:id", rolController.getPaginaDefecto)
router.post("/", requireCapability("configuracion/roles", "crear"), rolController.addRol);
router.put("/:id", requireCapability("configuracion/roles", "editar"), rolController.updateRol);
router.put("/pagina-inicio/:id", rolController.guardarPaginaPorDefecto);
router.delete("/:id", requireCapability("configuracion/roles", "eliminar"), rolController.deleteRol);

export default router;