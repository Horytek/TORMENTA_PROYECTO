import { Router } from "express";
import { methods as rolController } from "../controllers/funciones.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(auth);

router.get("/", rolController.getFunciones);
router.get("/:id", rolController.getFuncion);
router.post("/", rolController.addFuncion);
router.put("/:id", rolController.updateFuncion);

export default router;