import { Router } from "express";
import { methods as ventasController } from "./../controllers/ventas.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { logMiddleware } from "../middlewares/log.middleware.js";

const router = Router();

// Aplica el middleware de autenticación a todas las rutas de productos
router.use(auth);
router.use(logMiddleware);

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
router.get("/venta_boucher", ventasController.getVentaById);
router.get("/last_venta", ventasController.getLastVenta);
export default router;