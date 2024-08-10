import { Router } from "express";
import { methods as kardexController } from "./../controllers/kardex.controller";

const router = Router();

router.get("/", kardexController.getProductos);
router.get("/almacen", kardexController.getAlmacen);
router.get("/historico/:id", kardexController.getMovimientosProducto);

export default router;