import { Router } from "express";
import { methods as empresaController } from "./../controllers/empresa.controller.js";

const router = Router();

router.get("/", empresaController.getEmpresas);
router.get("/:id", empresaController.getEmpresa);
router.post("/", empresaController.addEmpresa);
router.put("/:id", empresaController.updateEmpresa);
router.delete("/:id", empresaController.deleteEmpresa);
router.put("/:id/monedas", empresaController.updateEmpresaMonedas);

export default router;