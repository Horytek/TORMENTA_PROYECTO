import { Router } from "express";
import { methods as empleadosController } from "../controllers/vendedores.controller";

const router = Router();

router.get("/", empleadosController.getVendedores);
router.get("/:dni", empleadosController.getVendedor);
router.post("/", empleadosController.addVendedor);
router.put("/update/:dni", empleadosController.updateVendedor);
router.put("/deactivate/:dni", empleadosController.deactivateVendedor);
router.delete("/:dni", empleadosController.deleteVendedor);

export default router;