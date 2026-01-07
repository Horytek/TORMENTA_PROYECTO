import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
import { syncTenantController, syncPlanController } from "../controllers/sync.controller.js";

const router = Router();

// Middleware to protect routes - Restricted to Developers/SuperAdmins ideally
// For now, verifyToken ensures valid session. Controller can check roles.
router.use(auth);

router.post("/tenant/:id_tenant", syncTenantController);
router.post("/plan/:id_plan", syncPlanController);

export default router;
