import { Router } from "express";
import { methods as devolucionesController } from "../controllers/devoluciones.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();
const CAP = "devoluciones";

router.use(auth);

router.get("/", requireCapability(CAP, "ver"), devolucionesController.getDevoluciones);
router.get("/por_venta/:id", requireCapability(CAP, "ver"), devolucionesController.getDevolucionesPorVenta);
router.get("/:id", requireCapability(CAP, "ver"), devolucionesController.getDevolucionDetalle);
router.post("/", requireCapability(CAP, "crear"), devolucionesController.crearDevolucion);
router.patch("/:id/estado", requireCapability(CAP, "editar"), devolucionesController.cambiarEstadoDevolucion);
router.post("/:id/reembolso", requireCapability(CAP, "generar"), devolucionesController.procesarReembolso);

export default router;
