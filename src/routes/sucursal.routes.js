import { Router } from "express";
import { methods as sucursalController } from "./../controllers/sucursal.controller";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

// Aplica el middleware de autenticación a todas las rutas de productos
router.use(auth);


router.get("/inicio", sucursalController.getSucursalInicio);
router.get("/", sucursalController.getSucursales);
router.get("/vendedores", sucursalController.getVendedores);
router.post("/addsucursal", sucursalController.insertSucursal);
router.post("/updatesucursal", sucursalController.updateSucursal);
router.delete("/delete/:id", sucursalController.deleteSucursal);

export default router;