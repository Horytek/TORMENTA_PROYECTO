import { Router } from "express";
import { methods as periodoContableController } from "../controllers/periodoContable.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();

router.use(auth);

router.get("/", requireCapability("/contabilidad/periodos", "ver"), periodoContableController.getPeriodos);
router.post("/", requireCapability("/contabilidad/periodos", "crear"), periodoContableController.crearSiguientePeriodo);
router.post("/:id/cerrar", requireCapability("/contabilidad/periodos", "editar"), periodoContableController.cerrarPeriodo);
router.post("/:id/reabrir", requireCapability("/contabilidad/periodos", "eliminar"), periodoContableController.reabrirPeriodo);

export default router;
