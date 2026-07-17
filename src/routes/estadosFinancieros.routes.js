import { Router } from "express";
import { methods as estadosFinancierosController } from "../controllers/estadosFinancieros.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();

router.use(auth);

router.get("/balance-general", requireCapability("/contabilidad/estados-financieros", "ver"), estadosFinancierosController.getBalanceGeneral);
router.get("/estado-resultados", requireCapability("/contabilidad/estados-financieros", "ver"), estadosFinancierosController.getEstadoResultados);
router.get("/balance-comprobacion", requireCapability("/contabilidad/estados-financieros", "ver"), estadosFinancierosController.getBalanceComprobacion);

export default router;
