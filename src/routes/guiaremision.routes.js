import { Router } from "express";
import { methods as guiasController } from "./../controllers/guiaremision.controller";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

// Aplica el middleware de autenticación a todas las rutas de productos
router.use(auth);
router.get("/", guiasController.getGuias);
router.get("/sucursal",guiasController.getSucursal);
router.get("/ubigeo", guiasController.getUbigeoGuia);
router.get("/num_comprobante", guiasController.generarCodigoGuia);
router.get("/clienteguia", guiasController.getDestinatariosGuia);
router.get("/transpublico", guiasController.getTransportePublicoGuia);
router.get("/transprivado", guiasController.getTransportePrivadoGuia);
router.get("/cod_transporte", guiasController.generarCodigoTrans);
router.get("/vehiculosguia", guiasController.getVehiculos);
router.post("/nuevo_vehiculo", guiasController.addVehiculo);
router.post("/nuevo_transportepub", guiasController.addTransportistaPublico);
router.post("/nuevo_transportepriv", guiasController.addTransportistaPrivado);
router.get("/productos", guiasController.getProductos);
router.post("/destnatural", guiasController.addDestinatarioNatural);
router.post("/destjuridico", guiasController.addDestinatarioJuridico);
router.post("/anularguia", guiasController.anularGuia);
router.post("/nuevaguia", guiasController.insertGuiaRemisionAndDetalle);

export default router;