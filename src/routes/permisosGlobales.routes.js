import { Router } from "express";
import { methods as permisosGlobalesController } from "./../controllers/permisosGlobales.controller.js";
import { methods as permissionsV2Controller } from "./../controllers/permissions.v2.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireDeveloper } from "../middlewares/authorize.middleware.js";

const router = Router();

// Aplica el middleware de autenticación a todas las rutas
router.use(auth);

// Rutas para permisos globales por plan (afectan a todos los tenants de un plan
// a la vez — reservado a Developer, igual que ya intentaba hacer el controller ad-hoc)
router.get("/modulos-plan", permisosGlobalesController.getModulosConSubmodulosPorPlan);
router.get("/roles-plan", permisosGlobalesController.getRolesPorPlan);
router.get("/permisos-rol/:id_rol", permisosGlobalesController.getPermisosByRolGlobal);
router.get("/check-global", permisosGlobalesController.checkPermisoGlobal);
router.get("/planes", permisosGlobalesController.getPlanesDisponibles);
router.post("/save-global", requireDeveloper, permisosGlobalesController.savePermisosGlobales);
router.get("/v2/unified-catalog", permissionsV2Controller.getMergedPermissions);

export default router;
