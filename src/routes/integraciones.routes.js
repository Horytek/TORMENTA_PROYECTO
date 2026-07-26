import { Router } from "express";
import { methods as integracionesController } from "../controllers/integraciones.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/authorize.middleware.js";

/**
 * Estado de las integraciones del tenant (pantalla de Ajustes).
 *
 * Gateado por ROL de administrador, no por capacidad, siguiendo el mismo
 * criterio que los Logs del Sistema. La razón es concreta: `configuracion/negocio`
 * existe solo como submódulo y los roles admin de los tenants actuales NO lo
 * tienen concedido, así que exigir esa capacidad dejaría la pantalla invisible
 * para todo el mundo hasta migrar datos de permisos.
 *
 * Es defendible además por contenido: no expone ningún secreto, solo el estado
 * de la configuración de la propia cuenta — información de administración.
 */

const router = Router();

router.use(auth);

router.get("/", requireAdmin, integracionesController.obtenerEstado);

export default router;
