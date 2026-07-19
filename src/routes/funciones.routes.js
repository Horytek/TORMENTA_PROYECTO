import { Router } from "express";
import { methods as rolController } from "../controllers/funciones.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireDeveloper } from "../middlewares/authorize.middleware.js";

const router = Router();

router.use(auth);

router.get("/", rolController.getFunciones);
router.get("/:id", rolController.getFuncion);
// Catálogo de funciones de los planes (plan_pago.funciones) — solo Developer
// puede mutarlo; los tenants solo lo leen.
router.post("/", requireDeveloper, rolController.addFuncion);
router.put("/:id", requireDeveloper, rolController.updateFuncion);

export default router;