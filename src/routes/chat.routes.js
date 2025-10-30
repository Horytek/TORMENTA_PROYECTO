import { Router } from "express";
import { chat } from "../controllers/chat.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { checkFeatureAccess } from "../middlewares/featureAccess.js";

const router = Router();
router.use(auth);

// Solo permite acceso si el plan tiene la función chatbot
router.post("/", chat);

export default router;