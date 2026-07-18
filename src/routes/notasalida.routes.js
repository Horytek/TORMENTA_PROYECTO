import { Router } from "express";
import { methods as notasalidaController } from "./../controllers/notasalida.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { logMiddleware } from "../middlewares/log.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();

// Aplica el middleware de autenticación a todas las rutas de productos
router.use(auth);
router.use(logMiddleware);

router.get("/", notasalidaController.getSalidas);
router.get("/almacen", notasalidaController.getAlmacen);
router.get("/productos", notasalidaController.getProductos);
router.get("/nuevodocumento", notasalidaController.getNuevoDocumento);
router.get("/destinatario", notasalidaController.getDestinatario);
router.post("/nuevanota", requireCapability("nota_almacen", "crear"), notasalidaController.insertNotaAndDetalle);
router.post("/anular", requireCapability("nota_almacen", "desactivar"), notasalidaController.anularNota);
export default router;