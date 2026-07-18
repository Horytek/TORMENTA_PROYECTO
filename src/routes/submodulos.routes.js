import { Router } from "express";
import { methods as SubmodulosController } from "./../controllers/submodulos.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireDeveloper } from "../middlewares/authorize.middleware.js";

const router = Router();

router.use(auth);

router.put("/:id", requireDeveloper, SubmodulosController.updateSubModulo);
router.delete("/:id", requireDeveloper, SubmodulosController.deleteSubModulo);


export default router;
