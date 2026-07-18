import { Router } from "express";
import { methods as AuthzController } from "./../controllers/authz.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireDeveloper } from "../middlewares/authorize.middleware.js";

const router = Router();

router.use(auth);

router.get("/catalog", AuthzController.getCatalog);
router.get("/catalog-by-plan/:planId", requireDeveloper, AuthzController.getCatalogByPlan);
router.get("/roles/:id/effective", AuthzController.getEffectivePermissions);
router.get("/why", AuthzController.why);

export default router;
