import { Router } from "express";
import { methods as tonalidadController } from "../controllers/tonalidad.controller.js";
import { methods as authMiddleware } from "../controllers/auth.controller.js";

const router = Router();

router.get("/", authMiddleware.validateTokenMiddleware, tonalidadController.getTonalidades);
router.post("/", authMiddleware.validateTokenMiddleware, tonalidadController.addTonalidad);
router.put("/:id", authMiddleware.validateTokenMiddleware, tonalidadController.updateTonalidad);
router.delete("/:id", authMiddleware.validateTokenMiddleware, tonalidadController.deleteTonalidad);

export default router;
