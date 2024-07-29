import { Router } from "express";
import { methods as notaingresoController } from "./../controllers/notaingreso.controller";

const router = Router();

router.get("/", notaingresoController.getIngresos);
router.get("/almacen", notaingresoController.getAlmacen);

export default router;