import { Router } from "express";
import { methods as cpeController } from "../controllers/cpe.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

/**
 * Comprobantes electrónicos (CPE). Rutas nuevas: `/api/sunat/*` queda intacta
 * para no romper al cliente legacy.
 *
 * Se reusa la capacidad `ventas` a propósito: crear un slug nuevo obligaría a
 * sembrar filas en `modulo` y `permisos` para todos los tenants y roles, y
 * `requireCapability` deniega por defecto cuando no encuentra el permiso — es
 * decir, un slug nuevo dejaría a todo el mundo fuera hasta migrar los datos.
 */

const router = Router();

router.use(auth);

// Consulta
router.get("/", requireCapability("ventas", "ver"), cpeController.listarComprobantes);
router.get("/resumen", requireCapability("ventas", "ver"), cpeController.obtenerResumen);
router.get("/pendientes", requireCapability("ventas", "ver"), cpeController.listarPendientes);
router.get("/venta/:id_venta", requireCapability("ventas", "ver"), cpeController.obtenerPorVenta);
router.get("/:id", requireCapability("ventas", "ver"), cpeController.obtenerComprobante);
router.get("/:id/xml", requireCapability("ventas", "ver"), cpeController.descargarXml);
router.get("/:id/cdr", requireCapability("ventas", "ver"), cpeController.descargarCdr);

// Emisión (acciones que hablan con SUNAT)
router.post("/emitir", requireCapability("ventas", "generar"), cpeController.emitir);
router.post("/:id/reintentar", requireCapability("ventas", "generar"), cpeController.reintentar);

export default router;
