import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";
import {
  getTransfers,
  createTransferRequest,
  dispatchTransfer,
  receiveTransfer,
  cancelTransfer,
  getBlindCounts,
  createBlindCount,
  saveBlindCountItems,
  getReconciliationMatrix,
  applyAdjustment,
} from "../controllers/inventoryMovement.controller.js";

/**
 * Movimientos de inventario: transferencias entre almacenes y conteo ciego.
 *
 * Reusa la capacidad `nota_almacen` —igual que `transferenciaAlmacen.routes.js`—
 * porque es la misma operación de negocio: mover mercadería entre almacenes y
 * ajustar existencias. Así no hace falta sembrar un módulo nuevo.
 *
 * Sin estos gates, cualquier usuario autenticado (un vendedor, por ejemplo)
 * podía despachar transferencias y, sobre todo, aplicar el ajuste de un conteo
 * ciego — que reescribe el stock del almacén sin dejar a nadie a cargo.
 */
const router = Router();
const CAP = "nota_almacen";

router.use(auth);

// Transferencias Guiadas
router.get("/transfers", requireCapability(CAP, "ver"), getTransfers);
router.post("/transfers", requireCapability(CAP, "crear"), createTransferRequest);
router.put("/transfers/:id/dispatch", requireCapability(CAP, "editar"), dispatchTransfer);
router.put("/transfers/:id/receive", requireCapability(CAP, "editar"), receiveTransfer);
router.put("/transfers/:id/cancel", requireCapability(CAP, "desactivar"), cancelTransfer);

// Inventario Físico Ciego
router.get("/blind-counts", requireCapability(CAP, "ver"), getBlindCounts);
router.post("/blind-counts", requireCapability(CAP, "crear"), createBlindCount);
router.put("/blind-counts/:id/count", requireCapability(CAP, "editar"), saveBlindCountItems);
router.get("/blind-counts/:id/reconcile", requireCapability(CAP, "ver"), getReconciliationMatrix);
// El ajuste es la acción que de verdad reescribe el stock: pide `generar`,
// la acción más restringida, no un simple `editar`.
router.post("/blind-counts/:id/apply", requireCapability(CAP, "generar"), applyAdjustment);

export default router;
