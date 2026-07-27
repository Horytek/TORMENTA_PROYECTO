import { Router } from "express";
import { methods as cuentaPorPagarController } from "../controllers/cuentaPorPagar.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();
const CAP = "compras/cuentas-por-pagar";

router.use(auth);

router.get("/", requireCapability(CAP, "ver"), cuentaPorPagarController.getCuentasPorPagar);
router.get("/:id/pagos", requireCapability(CAP, "ver"), cuentaPorPagarController.getPagos);
router.post("/:id/pagos", requireCapability(CAP, "generar"), cuentaPorPagarController.registrarPago);

export default router;
