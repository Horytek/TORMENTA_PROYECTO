import { Router } from "express";
import { methods as kardexController } from "./../controllers/kardex.controller";

const router = Router();

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
export default router;