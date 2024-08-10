import { Router } from "express";
import { methods as notasalidaController } from "./../controllers/notasalida.controller";

const router = Router();

router.get("/", notasalidaController.getSalidas);
router.get("/almacen", notasalidaController.getAlmacen);
router.get("/productos", notasalidaController.getProductos);
router.get("/nuevodocumento", notasalidaController.getNuevoDocumento);
router.get("/destinatario", notasalidaController.getDestinatario);
router.post("/nuevanota", notasalidaController.insertNotaAndDetalle);
router.post("/anular", notasalidaController.anularNota);
export default router;