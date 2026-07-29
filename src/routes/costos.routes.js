import { Router } from "express";
import { methods as costosController } from "../controllers/costos.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

/**
 * Costos de inventario.
 *
 * Reusa la capacidad `productos` a propósito: el costo es un atributo del
 * producto, no un módulo aparte, y así no hace falta sembrar filas nuevas en
 * `modulo`/`permisos` para que funcione. Leer costos pide `ver`; declararlos
 * pide `editar`, que es lo mismo que se exige para cambiar el precio.
 */

const router = Router();

router.use(auth);

router.get("/cobertura", requireCapability("productos", "ver"), costosController.obtenerCobertura);
router.get("/margen", requireCapability("productos", "ver"), costosController.obtenerMargen);
router.get("/pendientes", requireCapability("productos", "ver"), costosController.listarPendientes);
router.post("/inicial", requireCapability("productos", "editar"), costosController.cargarCostosIniciales);

export default router;
