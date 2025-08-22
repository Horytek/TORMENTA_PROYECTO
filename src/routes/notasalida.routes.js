import { Router } from "express";
import { methods as notasalidaController } from "./../controllers/notasalida.controller";
import { auth } from "../middlewares/auth.middleware.js";
import { logMiddleware } from "../middlewares/log.middleware.js";

const router = Router();

// Aplica el middleware de autenticación a todas las rutas de productos
router.use(auth);
router.use(logMiddleware);

router.get("/", notasalidaController.getSalidas);
router.get("/almacen", notasalidaController.getAlmacen);
router.get("/productos", notasalidaController.getProductos);
router.get("/nuevodocumento", notasalidaController.getNuevoDocumento);
router.get("/destinatario", notasalidaController.getDestinatario);
router.post("/nuevanota", notasalidaController.insertNotaAndDetalle);
router.post("/anular", notasalidaController.anularNota);
export default router;