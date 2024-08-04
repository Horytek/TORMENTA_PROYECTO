import { Router } from "express";
import { methods as guiasController } from "./../controllers/guiaremision.controller";

const router = Router();

router.get("/", guiasController.getGuias);
router.get("/sucursal",guiasController.getSucursal);
router.get("/ubigeo", guiasController.getUbigeoGuia);
router.get("/num_comprobante", guiasController.generarCodigoGuia);

export default router;