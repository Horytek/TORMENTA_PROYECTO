import { Router } from "express";
import { methods as kardexController } from "./../controllers/kardex.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

// Aplica el middleware de autenticación a todas las rutas de productos
router.use(auth);

router.get("/", kardexController.getProductos);
router.get("/almacen", kardexController.getAlmacen);
router.get("/historico/:id", kardexController.getMovimientosProducto);
router.get("/marca", kardexController.getMarcas);
router.get("/subcategoria", kardexController.getSubCategorias);
router.get("/categoria", kardexController.getCategorias);
router.get("/detalleK", kardexController.getDetalleKardex);
router.get("/detalleKA", kardexController.getDetalleKardexAnteriores);
router.get("/producto", kardexController.getInfProducto);
router.get("/generate-excel", kardexController.generateExcelReport);
router.get("/generate-excel-dates", kardexController.generateExcelReportByDateRange);
router.get("/stock_inicio", kardexController.getProductosMenorStock);
router.get("/stock-details", kardexController.getProductoStockDetails);
export default router;