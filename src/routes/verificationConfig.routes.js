import { Router } from "express";
import { methods as configController } from "../controllers/verificationConfig.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", auth, configController.getVerificationRoles);
router.post("/", auth, configController.updateVerificationRoles);

export default router;
