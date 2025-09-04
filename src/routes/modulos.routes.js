import { Router } from "express";
import { methods as modulosController } from "./../controllers/modulos.controller.js";


const router = Router();


router.get("/", modulosController.getModulos);
router.post("/", modulosController.addModulo);
router.post("/submodulos", modulosController.addSubmodulo);
router.put("/:id", modulosController.updateModulo);
router.delete("/:id", modulosController.deleteModulo);



export default router;