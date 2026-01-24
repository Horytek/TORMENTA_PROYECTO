import { Router } from "express";
import { methods as loteController } from "../controllers/lote.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

// Routes for Lote Inventario
router.post("/create", auth, loteController.createLote);
router.get("/", auth, loteController.getLotes); // Needed for list
router.post("/verify", auth, loteController.verifyLote);
router.post("/approve", auth, loteController.approveLote);

// Helper for details if needed (guessing controller structure)
router.get("/:id", auth, loteController.getLoteDetalle);

export default router;
