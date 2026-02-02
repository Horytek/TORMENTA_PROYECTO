import { Router } from "express";
import { methods as unidadesController } from "../controllers/unidades.controller.js";
import { methods as authMiddleware } from "../controllers/auth.controller.js";

const router = Router();

router.get("/", authMiddleware.validateTokenMiddleware, unidadesController.getUnidades);
router.post("/", authMiddleware.validateTokenMiddleware, unidadesController.addUnidad);
router.put("/:id", authMiddleware.validateTokenMiddleware, unidadesController.updateUnidad);
router.delete("/:id", authMiddleware.validateTokenMiddleware, unidadesController.deleteUnidad);

export default router;
