import { Router } from "express";
import { methods as auditoriaContableController } from "../controllers/auditoriaContable.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();

router.use(auth);

router.get("/", requireCapability("/contabilidad/auditoria", "ver"), auditoriaContableController.getAuditoria);

export default router;
