import { Router } from "express";
import { functionShortcutsAsk } from "../controllers/functionShortcuts.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { checkFeatureAccess } from "../middlewares/featureAccess.js";

const router = Router();
router.use(auth);

// Solo permite acceso si el plan tiene la función de atajos/mensajería/log
router.post("/ask", functionShortcutsAsk);

export default router;