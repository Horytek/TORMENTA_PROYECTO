import { Router } from "express";
import { methods as dashboardController } from "./../controllers/dashboard.controller";

const router = Router();

router.get("/product_top", dashboardController.getProductoMasVendido);
router.get("/product_sell", dashboardController.getTotalProductosVendidos);
router.get("/ventas_total", dashboardController.getTotalVentas);
router.post("/comparacion_ventas", dashboardController.getComparacionVentasPorRango);


export default router;