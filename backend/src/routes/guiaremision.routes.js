import { Router } from "express";
import { methods as guiasController } from "./../controllers/guiaremision.controller";

const router = Router();

router.get("/", guiasController.getGuias);
router.get("/sucursal",guiasController.getSucursal);

export default router;