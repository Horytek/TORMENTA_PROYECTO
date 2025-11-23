import { Router } from "express";
import { methods as empresaController } from "./../controllers/empresa.controller.js";
import { getPagos, getPagosDashboard, addPago, updatePago, deletePago } from "../controllers/pagos.controller.js";

const router = Router();

// Rutas de Pagos (Workaround: mounted here because app.js is locked)
router.get("/pagos", getPagos);
router.get("/pagos/dashboard", getPagosDashboard);
router.post("/pagos", addPago);
router.put("/pagos/:id", updatePago);
router.delete("/pagos/:id", deletePago);

router.get("/", empresaController.getEmpresas);
router.get("/:id", empresaController.getEmpresa);
router.post("/", empresaController.addEmpresa);
router.put("/:id", empresaController.updateEmpresa);
router.delete("/:id", empresaController.deleteEmpresa);
router.put("/:id/monedas", empresaController.updateEmpresaMonedas);

export default router;