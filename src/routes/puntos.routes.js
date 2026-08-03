import { Router } from "express";
import { methods as puntosController } from "../controllers/puntos.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();

router.use(auth);

router.get("/config", puntosController.getPuntosConfig);
router.put("/config", requireCapability("configuracion/negocio", "editar"), puntosController.updatePuntosConfig);
router.get("/cliente/:id_cliente", puntosController.getPuntosCliente);

export default router;
