import { Router } from "express";
import { methods as facturaCompraController } from "../controllers/facturaCompra.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();
const CAP = "compras/facturas";

router.use(auth);

router.get("/", requireCapability(CAP, "ver"), facturaCompraController.getFacturas);
router.post("/", requireCapability(CAP, "crear"), facturaCompraController.crearFactura);

export default router;
