import { Router } from "express";
import { methods as SubmodulosController } from "./../controllers/submodulos.controller.js";

const router = Router();

router.put("/:id", SubmodulosController.updateSubModulo);
router.delete("/:id", SubmodulosController.deleteSubModulo);


export default router;
