import { Router } from "express";
import { methods as reporteController } from "./../controllers/reporte.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

// Aplica el middleware de autenticación a todas las rutas de productos
router.use(auth);

router.get("/ganancias", reporteController.getTotalSalesRevenue);
router.get("/productos_vendidos", reporteController.getTotalProductosVendidos);
router.get("/ventas_pdf", reporteController.getVentasPDF);
router.get("/producto_top", reporteController.getProductoMasVendido);
router.get("/cantidad_por_producto", reporteController.getCantidadVentasPorProducto);
router.get("/cantidad_por_subcategoria", reporteController.getCantidadVentasPorSubcategoria);
router.get("/analisis_ganancias_sucursales", reporteController.getAnalisisGananciasSucursales);
router.get("/libro_ventas_sunat", reporteController.obtenerRegistroVentas);
router.get("/registro_ventas_sunat", reporteController.exportarRegistroVentas);
router.get("/sucursales", reporteController.getSucursales);
router.get("/ventas_sucursal", reporteController.getSucursalMayorRendimiento);
router.get("/tendencia_ventas", reporteController.getTendenciaVentas);
router.get("/top_productos_margen", reporteController.getTopProductosMargen);


export default router;