import { Router } from "express";
import { methods as asientoContableController } from "../controllers/asientoContable.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";
import { validateSchema } from "../middlewares/validator.middleware.js";
import { asientoContableSchema } from "../schemas/contabilidad.schema.js";

const router = Router();

router.use(auth);

router.get("/", requireCapability("/contabilidad/asientos", "ver"), asientoContableController.getAsientos);
router.get("/libro-diario", requireCapability("/contabilidad/asientos", "ver"), asientoContableController.getLibroDiario);
router.get("/libro-mayor", requireCapability("/contabilidad/asientos", "ver"), asientoContableController.getLibroMayor);
router.get("/:id", requireCapability("/contabilidad/asientos", "ver"), asientoContableController.getAsiento);
router.post("/", requireCapability("/contabilidad/asientos", "crear"), validateSchema(asientoContableSchema), asientoContableController.createAsiento);
router.post("/:id/revertir", requireCapability("/contabilidad/asientos", "eliminar"), asientoContableController.revertirAsiento);

export default router;
