import { Router } from "express";
import { functionShortcutsAsk } from "../controllers/functionShortcuts.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(auth);
router.post("/ask", functionShortcutsAsk);

export default router;