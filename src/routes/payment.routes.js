import { Router } from "express";
import { createPreference,paymentWebhook } from "../controllers/payment.controller.js";

const router = Router();
router.post("/create_preference", createPreference);
router.post("/webhook", paymentWebhook);
export default router;