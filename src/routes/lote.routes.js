import { Router } from "express";
import { methods as loteController } from "../controllers/lote.controller.js";
import { methods as authMiddleware } from "../controllers/auth.controller.js";

const router = Router();

// Routes for Lote Inventario
router.post("/create", authMiddleware.verifyToken, loteController.createLote);
router.get("/", authMiddleware.verifyToken, loteController.getLotes); // Needed for list
router.post("/verify", authMiddleware.verifyToken, loteController.verifyLote);
router.post("/approve", authMiddleware.verifyToken, loteController.approveLote);

// Helper for details if needed (guessing controller structure)
router.get("/:id", authMiddleware.verifyToken, loteController.getLoteDetalle);

export default router;
