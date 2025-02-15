import { Router } from "express";
import { methods as rolController } from "../controllers/funciones.controller";

const router = Router();

router.get("/", rolController.getFunciones);
router.get("/:id", rolController.getFuncion);
router.post("/", rolController.addFuncion);
router.put("/:id", rolController.updateFuncion);
//router.delete("/:id", rolController.deleteFuncion);

export default router;