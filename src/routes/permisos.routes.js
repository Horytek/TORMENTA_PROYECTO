import { Router } from "express";
import { methods as permisosController } from "./../controllers/permisos.controller.js";
import { methods as rutasController } from "./../controllers/rutas.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();

// Aplica el middleware de autenticación a todas las rutas de productos
router.use(auth);


router.get("/", rutasController.getModulosConSubmodulos);
router.get("/roles", permisosController.getRoles);
router.get("/roles/:id_rol", permisosController.getPermisosByRol);
router.get("/check", permisosController.checkPermiso);
router.get("/permisos/:id_rol", permisosController.getPermisosModulo);
router.post("/save", requireCapability("configuracion/roles", "editar"), permisosController.savePermisos);


export default router;