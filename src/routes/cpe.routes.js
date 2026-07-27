import { Router } from "express";
import { methods as cpeController } from "../controllers/cpe.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

/**
 * Comprobantes electrónicos (CPE). Rutas nuevas: `/api/sunat/*` queda intacta
 * para no romper al cliente legacy.
 *
 * Capacidad propia `comprobantes` (antes reusaba `ventas` a propósito, para no
 * tener que sembrar filas de `modulo`/`permisos` — ver
 * scripts/migrations/create_comprobantes_modulo.js, que copió 1:1 los
 * permisos y entitlements de Ventas hacia este módulo nuevo antes de este
 * cambio, así nadie perdió acceso).
 */

const router = Router();

router.use(auth);

// Consulta
router.get("/", requireCapability("comprobantes", "ver"), cpeController.listarComprobantes);
router.get("/resumen", requireCapability("comprobantes", "ver"), cpeController.obtenerResumen);
router.get("/pendientes", requireCapability("comprobantes", "ver"), cpeController.listarPendientes);
router.get("/venta/:id_venta", requireCapability("comprobantes", "ver"), cpeController.obtenerPorVenta);
router.get("/:id", requireCapability("comprobantes", "ver"), cpeController.obtenerComprobante);
router.get("/:id/xml", requireCapability("comprobantes", "ver"), cpeController.descargarXml);
router.get("/:id/cdr", requireCapability("comprobantes", "ver"), cpeController.descargarCdr);

// Emisión (acciones que hablan con SUNAT)
router.post("/emitir", requireCapability("comprobantes", "generar"), cpeController.emitir);
router.post("/:id/reintentar", requireCapability("comprobantes", "generar"), cpeController.reintentar);

export default router;
