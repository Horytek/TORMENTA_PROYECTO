import { Router } from "express";
import { methods as anticipoProveedorController } from "../controllers/anticipoProveedor.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();
const CAP = "compras/anticipos";

router.use(auth);

router.get("/", requireCapability(CAP, "ver"), anticipoProveedorController.getAnticipos);
router.post("/", requireCapability(CAP, "crear"), anticipoProveedorController.crearAnticipo);
router.post("/:id/aplicar", requireCapability(CAP, "generar"), anticipoProveedorController.aplicarAnticipo);

export default router;
