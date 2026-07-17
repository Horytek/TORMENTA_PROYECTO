import { Router } from "express";
import { methods as cuentaContableController } from "../controllers/cuentaContable.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";
import { validateSchema } from "../middlewares/validator.middleware.js";
import { cuentaContableSchema } from "../schemas/contabilidad.schema.js";

const router = Router();

router.use(auth);

router.get("/", requireCapability("/contabilidad/cuentas", "ver"), cuentaContableController.getCuentas);
router.post("/", requireCapability("/contabilidad/cuentas", "crear"), validateSchema(cuentaContableSchema), cuentaContableController.createCuenta);
router.put("/:id", requireCapability("/contabilidad/cuentas", "editar"), cuentaContableController.updateCuenta);
router.delete("/:id", requireCapability("/contabilidad/cuentas", "eliminar"), cuentaContableController.deleteCuenta);

export default router;
