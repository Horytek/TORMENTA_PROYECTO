import { Router } from "express";
import { methods as claveController } from "./../controllers/clave.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();

// Aplica el middleware de autenticación a todas las rutas de productos
router.use(auth);

// Capacidad "configuracion/negocio": las credenciales SUNAT son configuración
// de la empresa, mismo dominio que negocio.routes.js/empresa.routes.js.
router.get("/", requireCapability("configuracion/negocio", "ver"), claveController.getClaves);
router.get("/:id", requireCapability("configuracion/negocio", "ver"), claveController.getClave);
router.get("/valor/:id", requireCapability("configuracion/negocio", "ver"), claveController.getClaveByEmpresaAndTipo);
router.post("/", requireCapability("configuracion/negocio", "editar"), claveController.addClave);
router.put("/:id", requireCapability("configuracion/negocio", "editar"), claveController.updateClave);
router.delete("/:id", requireCapability("configuracion/negocio", "eliminar"), claveController.deleteClave);

export default router;