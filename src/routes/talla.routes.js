import { Router } from "express";
import { methods as tallaController } from "../controllers/talla.controller.js";
import { methods as authMiddleware } from "../controllers/auth.controller.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();

router.get("/", authMiddleware.validateTokenMiddleware, tallaController.getTallas);
router.post("/", authMiddleware.validateTokenMiddleware, requireCapability("productos", "crear"), tallaController.addTalla);
router.put("/:id", authMiddleware.validateTokenMiddleware, requireCapability("productos", "editar"), tallaController.updateTalla);
router.delete("/:id", authMiddleware.validateTokenMiddleware, requireCapability("productos", "eliminar"), tallaController.deleteTalla);

export default router;
