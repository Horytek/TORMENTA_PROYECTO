import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
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

const router = Router();

router.use(auth);

// Transferencias Guiadas
router.get("/transfers", getTransfers);
router.post("/transfers", createTransferRequest);
router.put("/transfers/:id/dispatch", dispatchTransfer);
router.put("/transfers/:id/receive", receiveTransfer);
router.put("/transfers/:id/cancel", cancelTransfer);

// Inventario Físico Ciego
router.get("/blind-counts", getBlindCounts);
router.post("/blind-counts", createBlindCount);
router.put("/blind-counts/:id/count", saveBlindCountItems);
router.get("/blind-counts/:id/reconcile", getReconciliationMatrix);
router.post("/blind-counts/:id/apply", applyAdjustment);

export default router;
