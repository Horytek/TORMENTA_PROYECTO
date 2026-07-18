import { Router } from "express";
import { methods as rutasController } from "./../controllers/rutas.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(auth);

router.get("/", rutasController.getModulos);
router.get("/submodulos", rutasController.getSubmodulos);
router.get("/modulos", rutasController.getModulosConSubmodulos);



export default router;
