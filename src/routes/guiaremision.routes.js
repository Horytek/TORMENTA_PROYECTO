import { Router } from "express";
import { methods as guiasController } from "./../controllers/guiaremision.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

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
router.post("/nuevo_vehiculo", requireCapability("guia_remision", "crear"), guiasController.addVehiculo);
router.post("/nuevo_transportepub", requireCapability("guia_remision", "crear"), guiasController.addTransportistaPublico);
router.post("/nuevo_transportepriv", requireCapability("guia_remision", "crear"), guiasController.addTransportistaPrivado);
router.get("/productos", guiasController.getProductos);
router.post("/destnatural", requireCapability("guia_remision", "crear"), guiasController.addDestinatarioNatural);
router.post("/destjuridico", requireCapability("guia_remision", "crear"), guiasController.addDestinatarioJuridico);
router.post("/anularguia", requireCapability("guia_remision", "eliminar"), guiasController.anularGuia);
router.post("/nuevaguia", requireCapability("guia_remision", "crear"), guiasController.insertGuiaRemisionAndDetalle);

export default router;