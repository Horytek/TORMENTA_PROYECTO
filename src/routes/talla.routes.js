import { Router } from "express";
import { methods as tallaController } from "../controllers/talla.controller.js";
import { methods as authMiddleware } from "../controllers/auth.controller.js";

const router = Router();

router.get("/", authMiddleware.validateTokenMiddleware, tallaController.getTallas);
router.post("/", authMiddleware.validateTokenMiddleware, tallaController.addTalla);
router.put("/:id", authMiddleware.validateTokenMiddleware, tallaController.updateTalla);
router.delete("/:id", authMiddleware.validateTokenMiddleware, tallaController.deleteTalla);

export default router;
