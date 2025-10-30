import { Router } from "express";
import {
  createPreference,
  paymentWebhook,
  getMpPayments,
  createPreapproval,
  requestPlanChange,
  downloadPaymentReceipt
} from "../controllers/payment.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

// Crear preferencia de pago (Mercado Pago)
router.post("/create_preference", createPreference);

// Webhook de Mercado Pago
router.post("/webhook", paymentWebhook);

// Obtener historial de pagos de Mercado Pago (requiere autenticación)
router.get("/mp", auth, getMpPayments);

// Crear suscripción/renovación automática (requiere autenticación)
router.post("/preapproval", auth, createPreapproval);

// Solicitud de cambio de plan (requiere autenticación)
router.post("/plan-change", auth, requestPlanChange);

router.get("/payment-receipt/:id", downloadPaymentReceipt);

export default router;