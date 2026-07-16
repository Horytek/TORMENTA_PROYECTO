import { Router } from "express";
import { methods as modulosController } from "./../controllers/modulos.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireDeveloper } from "../middlewares/authorize.middleware.js";


const router = Router();

router.use(auth);

router.get("/", modulosController.getModulos);
router.post("/", requireDeveloper, modulosController.addModulo);
router.post("/submodulos", requireDeveloper, modulosController.addSubmodulo);
router.put("/:id", requireDeveloper, modulosController.updateModulo);
router.delete("/:id", requireDeveloper, modulosController.deleteModulo);



export default router;