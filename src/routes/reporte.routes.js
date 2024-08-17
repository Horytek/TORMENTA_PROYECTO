import { Router } from "express";
import { methods as reporteController } from "./../controllers/reporte.controller";

const router = Router();

router.get("/ganancias", reporteController.getTotalSalesRevenue);
router.get("/productos_vendidos", reporteController.getTotalProductosVendidos);
router.get("/ventas_pdf", reporteController.getVentasPDF);
router.get("/producto_top", reporteController.getProductoMasVendido);
router.get("/cantidad_por_producto", reporteController.getCantidadVentasPorProducto);
router.get("/cantidad_por_subcategoria", reporteController.getCantidadVentasPorSubcategoria);
router.get("/analisis_ganancias_sucursales", reporteController.getAnalisisGananciasSucursales);

export default router;