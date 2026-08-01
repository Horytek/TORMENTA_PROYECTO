import { Router } from "express";
import { methods as cajaTurnoController } from "../controllers/cajaTurno.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(auth);

router.get("/activo", cajaTurnoController.getTurnoActivo);
router.get("/", cajaTurnoController.getHistorialTurnos);
router.post("/abrir", cajaTurnoController.abrirTurno);
router.post("/:id/cerrar", cajaTurnoController.cerrarTurno);

export default router;
