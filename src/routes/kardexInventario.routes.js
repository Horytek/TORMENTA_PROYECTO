import { Router } from "express";
import { methods as kardexInventarioController } from "./../controllers/kardexInventario.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

// Todo el módulo requiere autenticación + tenant.
router.use(auth);

// Endpoints paralelos a /api/kardex pero leyendo SOLO la tabla `inventario`
// (no `producto_sku`, `tonalidad` ni `talla`).
router.get("/", kardexInventarioController.getProductos);
router.get("/producto", kardexInventarioController.getInfProducto);
router.get("/stock_inicio", kardexInventarioController.getProductosMenorStock);
router.get("/stock-minimo", kardexInventarioController.getStockMinimo);
router.get("/almacenes", kardexInventarioController.getAlmacenes);
router.get("/detalle", kardexInventarioController.getDetalleKardex);
router.get("/detalle-anteriores", kardexInventarioController.getDetalleKardexAnteriores);

export default router;
