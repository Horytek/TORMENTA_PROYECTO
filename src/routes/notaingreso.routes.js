import { Router } from "express";
import { methods as notaingresoController } from "./../controllers/notaingreso.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { logMiddleware } from "../middlewares/log.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();

// Aplica el middleware de autenticación a todas las rutas de productos
router.use(auth);
router.use(logMiddleware);

router.get("/", notaingresoController.getIngresos);
router.get("/almacen", notaingresoController.getAlmacen);
router.get("/productos", notaingresoController.getProductos);
router.get("/productosSinStock", notaingresoController.getProductos_SinStock);
router.get("/ndocumento", notaingresoController.getNuevoDocumento);
router.get("/destinatario", notaingresoController.getDestinatario);
router.post("/addNota", requireCapability("nota_almacen", "crear"), notaingresoController.insertNotaAndDetalle);
router.post("/anular", requireCapability("nota_almacen", "desactivar"), notaingresoController.anularNota);
export default router;