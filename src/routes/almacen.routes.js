import { Router } from "express";
import { methods as almacenesController } from "./../controllers/almacen.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { checkFeatureAccess } from "../middlewares/featureAccess.js";

const router = Router();

router.use(auth);

router.get("/", almacenesController.getAlmacenes);
router.get("/sucursales", almacenesController.getSucursales);
router.get("/alternativo", almacenesController.getAlmacenes_A);
router.get("/:id", almacenesController.getAlmacen);

// Limita creación de almacenes según el plan
router.post("/", checkFeatureAccess("almacenes", { checkLimit: true }), almacenesController.addAlmacen);

router.put("/:id", almacenesController.updateAlmacen);
router.delete("/:id", almacenesController.deleteAlmacen);

export default router;