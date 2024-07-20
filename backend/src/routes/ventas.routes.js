import { Router } from "express";
import { methods as ventasController } from "./../controllers/ventas.controller";

const router = Router();

router.get("/", ventasController.getVentas);
router.get("/producto_venta", ventasController.getProductosVentas);
router.post("/agregar_venta", ventasController.addVenta);
router.get("/cliente_venta", ventasController.getClienteVentas);
router.post("/cliente", ventasController.addCliente);

export default router;