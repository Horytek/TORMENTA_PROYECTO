import { Router } from "express";
import { methods as ventasController } from "./../controllers/ventas.controller";

const router = Router();

router.get("/", ventasController.getVentas);
router.get("/producto_venta", ventasController.getProductosVentas);
router.post("/agregar_venta", ventasController.addVenta);
router.get("/cliente_venta", ventasController.getClienteVentas);
router.post("/cliente", ventasController.addCliente);
router.get("/comprobante", ventasController.getComprobante);
router.get("/sucursal", ventasController.getSucursal);
router.post("/eliminar_venta", ventasController.updateVenta);
router.get("/numero_comprobante", ventasController.generarComprobante);
router.post("/actualizar_venta", ventasController.getEstado);
router.post("/productos_vendidos", ventasController.getTotalProductosVendidos);
router.get("/producto_top", ventasController.getProductoMasVendido);
router.get("/cantidad_por_producto", ventasController.getCantidadVentasPorProducto);
router.get("/cantidad_por_subcategoria", ventasController.getCantidadVentasPorSubcategoria);
router.get("/analisis_ganancias_sucursales", ventasController.getAnalisisGananciasSucursales);

export default router;