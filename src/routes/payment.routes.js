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
import { requireAdmin } from "../middlewares/authorize.middleware.js";

const router = Router();

// Crear preferencia de pago (Mercado Pago). PÚBLICO a propósito: lo llaman
// Registro y Login antes de que exista sesión (client-v2 RegisterPage/LoginPage).
// Su control real es la validación server-side de plan/precio en el controller.
router.post("/create_preference", createPreference);

// Webhook de Mercado Pago. PÚBLICO a propósito: lo llama MercadoPago, no un
// usuario. Su control real es la verificación del pago contra la API de MP.
router.post("/webhook", paymentWebhook);

// Obtener historial de pagos de Mercado Pago (requiere autenticación)
router.get("/mp", auth, getMpPayments);

// Crear suscripción/renovación automática — solo el Administrador del tenant
// (mismo gate que BillingDrawer en el frontend).
router.post("/preapproval", auth, requireAdmin, createPreapproval);

// Solicitud de cambio de plan — solo el Administrador del tenant
router.post("/plan-change", auth, requireAdmin, requestPlanChange);

router.get("/payment-receipt/:id", auth, downloadPaymentReceipt);

export default router;