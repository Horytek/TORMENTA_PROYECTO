import { Router } from "express";
import { methods as cuentaPorCobrarController } from "../controllers/cuentaPorCobrar.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();
const CAP = "clientes/cuentas-por-cobrar";

router.use(auth);

router.get("/", requireCapability(CAP, "ver"), cuentaPorCobrarController.getCuentasPorCobrar);
router.get("/:id/pagos", requireCapability(CAP, "ver"), cuentaPorCobrarController.getPagos);
router.post("/:id/pagos", requireCapability(CAP, "generar"), cuentaPorCobrarController.registrarPago);

export default router;
