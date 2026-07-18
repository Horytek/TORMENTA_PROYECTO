import { Router } from "express";
import { methods as presupuestoController } from "../controllers/presupuesto.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";
import { validateSchema } from "../middlewares/validator.middleware.js";
import { presupuestoSchema } from "../schemas/contabilidad.schema.js";

const router = Router();

router.use(auth);

router.get("/", requireCapability("/contabilidad/presupuestos", "ver"), presupuestoController.getPresupuestos);
router.post("/", requireCapability("/contabilidad/presupuestos", "crear"), validateSchema(presupuestoSchema), presupuestoController.upsertPresupuesto);
router.delete("/:id", requireCapability("/contabilidad/presupuestos", "eliminar"), presupuestoController.deletePresupuesto);

export default router;
