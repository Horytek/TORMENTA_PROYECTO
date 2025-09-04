import { Router } from "express";
import { methods as permisosGlobalesController } from "./../controllers/permisosGlobales.controller.js";
import { auth } from "../middlewares/auth.middleware.js"; 

const router = Router();

// Aplica el middleware de autenticación a todas las rutas
router.use(auth);

// Rutas para permisos globales por plan
router.get("/modulos-plan", permisosGlobalesController.getModulosConSubmodulosPorPlan);
router.get("/roles-plan", permisosGlobalesController.getRolesPorPlan);
router.get("/permisos-rol/:id_rol", permisosGlobalesController.getPermisosByRolGlobal);
router.get("/check-global", permisosGlobalesController.checkPermisoGlobal);
router.get("/planes", permisosGlobalesController.getPlanesDisponibles);
router.post("/save-global", permisosGlobalesController.savePermisosGlobales);

export default router;
