import { Router } from "express";
import { methods as sucursalController } from "./../controllers/sucursal.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { checkFeatureAccess } from "../middlewares/featureAccess.js";

const router = Router();

router.use(auth);

router.get("/inicio", sucursalController.getSucursalInicio);
router.get("/", sucursalController.getSucursales);
router.get("/vendedores", sucursalController.getVendedores);

// Limita creación de sucursales según el plan
router.post("/addsucursal", checkFeatureAccess("multiples_sucursales", { checkLimit: true }), sucursalController.insertSucursal);

router.post("/updatesucursal", sucursalController.updateSucursal);
router.delete("/delete/:id", sucursalController.deleteSucursal);

export default router;