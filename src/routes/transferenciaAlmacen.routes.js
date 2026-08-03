import { Router } from "express";
import { methods as transferenciaController } from "../controllers/transferenciaAlmacen.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { logMiddleware } from "../middlewares/log.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();

router.use(auth);
router.use(logMiddleware);

router.post("/", requireCapability("nota_almacen", "crear"), transferenciaController.insertTransferencia);

export default router;
