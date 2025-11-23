import { Router } from "express";
import { getPagos, getPagosDashboard, addPago, updatePago, deletePago } from "../controllers/pagos.controller.js";
import { verifyToken } from "../middlewares/authJwt.js";

const router = Router();

// Middleware de autenticación para todas las rutas
router.use(verifyToken);

router.get("/", getPagos);
router.get("/dashboard", getPagosDashboard);
router.post("/", addPago);
router.put("/:id", updatePago);
router.delete("/:id", deletePago);

export default router;
