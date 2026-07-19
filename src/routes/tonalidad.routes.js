import { Router } from "express";
import { methods as tonalidadController } from "../controllers/tonalidad.controller.js";
import { methods as authMiddleware } from "../controllers/auth.controller.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();

router.get("/", authMiddleware.validateTokenMiddleware, tonalidadController.getTonalidades);
router.post("/", authMiddleware.validateTokenMiddleware, requireCapability("productos", "crear"), tonalidadController.addTonalidad);
router.put("/:id", authMiddleware.validateTokenMiddleware, requireCapability("productos", "editar"), tonalidadController.updateTonalidad);
router.delete("/:id", authMiddleware.validateTokenMiddleware, requireCapability("productos", "eliminar"), tonalidadController.deleteTonalidad);

export default router;
