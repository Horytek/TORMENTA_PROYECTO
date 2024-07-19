import { Router } from "express";
import { methods as marcasController } from "./../controllers/marcas.controller";

const router = Router();

router.get("/", marcasController.getMarcas);
router.get("/:id", marcasController.getMarca);
router.post("/", marcasController.addMarca);
router.put("/:id", marcasController.updateMarca);
router.put("/:id", marcasController.deactivateMarca);
router.delete("/:id", marcasController.deleteMarca);

export default router;