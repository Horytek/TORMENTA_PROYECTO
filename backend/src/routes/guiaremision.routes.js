import { Router } from "express";
import { methods as guiasController } from "./../controllers/guiaremision.controller";

const router = Router();

router.get("/", guiasController.getGuias);
router.get("/sucursal",guiasController.getSucursal);
router.get("/ubigeo", guiasController.getUbigeoGuia);
router.get("/num_comprobante", guiasController.generarCodigoGuia);
router.get("/clienteguia", guiasController.getDestinatariosGuia);
router.get("/transpublico", guiasController.getTransportePublicoGuia);
router.get("/transprivado", guiasController.getTransportePrivadoGuia);
router.get("/cod_transporte", guiasController.generarCodigoTrans);
//vehiculo
router.get("/vehiculosguia", guiasController.getVehiculos);
// Ruta para añadir un vehículo
router.post("/nuevo_vehiculo", guiasController.addVehiculo);
router.post("/nuevo_transportepub", guiasController.addTransportistaPublico);
router.post("/nuevo_transportepriv", guiasController.addTransportistaPrivado);




export default router;