import { Router } from "express";
import { methods as claveController } from "./../controllers/clave.controller";

const router = Router();

router.get("/", claveController.getClaves);
router.get("/:id", claveController.getClave);
router.post("/", claveController.addClave);
router.put("/:id", claveController.updateClave);
router.delete("/:id", claveController.deleteClave);

export default router;