import { Router } from "express";
import { methods as tesoreriaController } from "../controllers/tesoreria.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";
import { validateSchema } from "../middlewares/validator.middleware.js";
import { cuentaTesoreriaSchema, movimientoTesoreriaSchema } from "../schemas/contabilidad.schema.js";

const router = Router();

router.use(auth);

router.get("/cuentas", requireCapability("/contabilidad/tesoreria", "ver"), tesoreriaController.getCuentasTesoreria);
router.post("/cuentas", requireCapability("/contabilidad/tesoreria", "crear"), validateSchema(cuentaTesoreriaSchema), tesoreriaController.createCuentaTesoreria);

router.get("/movimientos", requireCapability("/contabilidad/tesoreria", "ver"), tesoreriaController.getMovimientos);
router.post("/movimientos", requireCapability("/contabilidad/tesoreria", "crear"), validateSchema(movimientoTesoreriaSchema), tesoreriaController.createMovimiento);
router.post("/movimientos/:id/conciliar", requireCapability("/contabilidad/tesoreria", "editar"), tesoreriaController.conciliarMovimiento);

router.get("/cierres", requireCapability("/contabilidad/tesoreria", "ver"), tesoreriaController.getCierres);
router.post("/cierres", requireCapability("/contabilidad/tesoreria", "generar"), tesoreriaController.cerrarCaja);

export default router;
