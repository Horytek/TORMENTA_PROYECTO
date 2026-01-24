import { Router } from "express";
import { chat, getChatMetrics, clearCache } from "../controllers/chat.controller.js";
import { generateAIReport } from "../controllers/chatReportPDF.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { checkFeatureAccess } from "../middlewares/featureAccess.js";

const router = Router();
router.use(auth);

// Chat conversacional
router.post("/", chat);

// Generar reportes PDF con IA
router.post("/generate-report", generateAIReport);

// Métricas del chatbot (admin only - opcional agregar middleware)
router.get("/metrics", getChatMetrics);

// Limpiar caché (admin only - opcional agregar middleware)
router.post("/clear-cache", clearCache);

export default router;