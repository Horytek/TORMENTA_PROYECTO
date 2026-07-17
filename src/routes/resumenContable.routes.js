import { Router } from "express";
import { methods as resumenContableController } from "../controllers/resumenContable.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();

router.use(auth);

router.get("/", requireCapability("/contabilidad", "ver"), resumenContableController.getResumen);

export default router;
