import { Router } from "express";
import { methods as unidadesController } from "../controllers/unidades.controller.js";
import { methods as authMiddleware } from "../controllers/auth.controller.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();

router.get("/", authMiddleware.validateTokenMiddleware, unidadesController.getUnidades);
router.post("/", authMiddleware.validateTokenMiddleware, requireCapability("productos", "crear"), unidadesController.addUnidad);
router.put("/:id", authMiddleware.validateTokenMiddleware, requireCapability("productos", "editar"), unidadesController.updateUnidad);
router.delete("/:id", authMiddleware.validateTokenMiddleware, requireCapability("productos", "eliminar"), unidadesController.deleteUnidad);

export default router;
