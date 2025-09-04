import { Router } from "express";
import { methods as dashboardController } from "./../controllers/dashboard.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

// Aplica el middleware de autenticación a todas las rutas de productos
router.use(auth);

router.get("/sucursales", dashboardController.getSucursalInicio);
router.get("/product_top", dashboardController.getProductoMasVendido);
router.get("/product_sell", dashboardController.getTotalProductosVendidos);
router.get("/ventas_total", dashboardController.getTotalVentas);
router.get("/comparacion_ventas", dashboardController.getComparacionVentasPorRango);
router.get("/usuarioRol", dashboardController.getUserRolController);
router.get("/ventas_por_sucursal", dashboardController.getVentasPorSucursalPeriodo);
router.get("/notas_pendientes", dashboardController.getNotasPendientes);
router.post("/actualizar_espera", dashboardController.actualizarEstadoEspera);
export default router;