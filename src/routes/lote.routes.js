import { Router } from "express";
import { methods as loteController } from "../controllers/lote.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();

// Routes for Lote Inventario (parte de InventoryPage.tsx, bajo la capacidad "almacen")
router.post("/create", auth, requireCapability("almacen", "crear"), loteController.createLote);
router.get("/", auth, loteController.getLotes); // Needed for list
router.post("/verify", auth, requireCapability("almacen", "editar"), loteController.verifyLote);
router.post("/approve", auth, requireCapability("almacen", "editar"), loteController.approveLote);

// Helper for details if needed (guessing controller structure)
router.get("/:id", auth, loteController.getLoteDetalle);

export default router;
