import { Router } from "express";
import { createPreference, paymentWebhook } from "../controllers/payment.controller.js";

const router = Router();
router.post("/create_preference", createPreference);

// NUEVO: endpoint para recibir notificaciones de Mercado Pago
router.post("/webhook", paymentWebhook);

export default router;