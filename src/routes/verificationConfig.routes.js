import { Router } from "express";
import { methods as configController } from "../controllers/verificationConfig.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();

router.get("/", auth, configController.getVerificationRoles);
router.post("/", auth, requireCapability("almacen", "editar"), configController.updateVerificationRoles);

export default router;
