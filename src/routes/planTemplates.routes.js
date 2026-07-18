import { Router } from "express";
import { methods as PlanTemplatesController } from "./../controllers/planTemplates.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireDeveloper } from "../middlewares/authorize.middleware.js";

const router = Router();

router.use(auth, requireDeveloper);

router.get("/:id_plan/versions", PlanTemplatesController.listVersions);
router.get("/:id/entitlements", PlanTemplatesController.getEntitlements);
router.post("/draft", PlanTemplatesController.createDraft);
router.put("/:id/entitlements", PlanTemplatesController.saveEntitlements);
router.post("/:id/publish", PlanTemplatesController.publishVersion);
router.delete("/:id", PlanTemplatesController.discardDraft);

export default router;
