import { Router } from "express";
import { methods as ordenCompraController } from "../controllers/ordenCompra.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();
const CAP = "compras/ordenes";

router.use(auth);

router.get("/", requireCapability(CAP, "ver"), ordenCompraController.getOrdenes);
router.get("/:id", requireCapability(CAP, "ver"), ordenCompraController.getOrdenDetalle);
router.post("/", requireCapability(CAP, "crear"), ordenCompraController.crearOrden);
router.post("/:id/aprobar", requireCapability(CAP, "editar"), ordenCompraController.aprobarOrden);
router.post("/:id/recibir", requireCapability(CAP, "generar"), ordenCompraController.recibirOrden);
router.post("/:id/cancelar", requireCapability(CAP, "eliminar"), ordenCompraController.cancelarOrden);

export default router;
