import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
import { requireDeveloper } from "../middlewares/authorize.middleware.js";
import { syncTenantController, syncPlanController } from "../controllers/sync.controller.js";

const router = Router();

// Restringido a Developers/SuperAdmins.
router.use(auth, requireDeveloper);

router.post("/tenant/:id_tenant", syncTenantController);
router.post("/plan/:id_plan", syncPlanController);

export default router;
