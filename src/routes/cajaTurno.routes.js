import { Router } from "express";
import { methods as cajaTurnoController } from "../controllers/cajaTurno.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();

router.use(auth);

router.get("/activo", cajaTurnoController.getTurnoActivo);
router.get("/", cajaTurnoController.getHistorialTurnos);
// Misma capability que crear una venta: abrir/cerrar turno es una acción
// operativa de caja, no administrativa — quien puede cobrar, puede abrir/cerrar su turno.
router.post("/abrir", requireCapability("ventas", "crear"), cajaTurnoController.abrirTurno);
router.post("/:id/cerrar", requireCapability("ventas", "editar"), cajaTurnoController.cerrarTurno);

export default router;
