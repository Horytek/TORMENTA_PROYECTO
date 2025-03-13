import { Router } from "express";
import { methods as permisosController } from "./../controllers/permisos.controller";
import { auth } from "../middlewares/auth.middleware.js"; 

const router = Router();

router.get("/", permisosController.getModulosConSubmodulos);
router.get("/roles", permisosController.getRoles);
router.get("/roles/:id_rol", permisosController.getPermisosByRol);
router.get("/check", auth, permisosController.checkPermiso);
router.get("/permisos/:id_rol", auth, permisosController.getPermisosModulo);
router.post("/save", permisosController.savePermisos);


export default router;