import { Router } from "express";
import { methods as sucursalController } from "./../controllers/sucursal.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { checkFeatureAccess } from "../middlewares/featureAccess.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();

router.use(auth);

router.get("/inicio", sucursalController.getSucursalInicio);
router.get("/", sucursalController.getSucursales);
router.get("/vendedores", sucursalController.getVendedores);

// Limita creación de sucursales según el plan, y además exige el permiso del rol
router.post("/addsucursal", requireCapability("sucursal", "crear"), checkFeatureAccess("multiples_sucursales", { checkLimit: true }), sucursalController.insertSucursal);

router.post("/updatesucursal", requireCapability("sucursal", "editar"), sucursalController.updateSucursal);
router.delete("/delete/:id", requireCapability("sucursal", "eliminar"), sucursalController.deleteSucursal);

export default router;