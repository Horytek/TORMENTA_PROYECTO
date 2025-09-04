import { Router } from "express";
import { methods as almacenesController } from "./../controllers/almacen.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

// Aplica el middleware de autenticación a todas las rutas de productos
router.use(auth);

router.get("/", almacenesController.getAlmacenes);
router.get("/sucursales", almacenesController.getSucursales);
router.get("/alternativo", almacenesController.getAlmacenes_A);
router.get("/:id", almacenesController.getAlmacen);
router.post("/", almacenesController.addAlmacen);
router.put("/:id", almacenesController.updateAlmacen);
router.delete("/:id", almacenesController.deleteAlmacen);


export default router;
