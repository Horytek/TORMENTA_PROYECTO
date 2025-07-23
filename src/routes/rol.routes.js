import { Router } from "express";
import { methods as rolController } from "../controllers/rol.controller";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

// Aplica el middleware de autenticación a todas las rutas de productos
router.use(auth);


router.get("/", rolController.getRoles);
router.get("/:id", rolController.getRol);
router.get("/pagina-defecto/:id", rolController.getPaginaDefecto)
router.post("/", rolController.addRol);
router.put("/:id", rolController.updateRol);
router.put("/pagina-inicio/:id", rolController.guardarPaginaPorDefecto);
router.delete("/:id", rolController.deleteRol);

export default router;