import { Router } from "express";
import { methods as rutasController } from "./../controllers/rutas.controller";

const router = Router();

router.get("/", rutasController.getModulos);
router.get("/submodulos", rutasController.getSubmodulos);
router.get("/modulos", rutasController.getModulosConSubmodulos);



export default router;
