import { Router } from "express";
import { methods as empresaController } from "./../controllers/empresa.controller.js";
import { getPagos, getPagosDashboard, addPago, updatePago, deletePago } from "../controllers/pagos.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();

router.use(auth);

// Rutas de Pagos de planilla a vendedores (pago_vendedor). Workaround: montado
// acá porque app.js estaba "locked". Capacidad "empleados": pagar planilla es
// una acción de gestión de personal, mismo dominio que vendedores.routes.js.
router.get("/pagos", getPagos);
router.get("/pagos/dashboard", getPagosDashboard);
router.post("/pagos", requireCapability("empleados", "crear"), addPago);
router.put("/pagos/:id", requireCapability("empleados", "editar"), updatePago);
router.delete("/pagos/:id", requireCapability("empleados", "eliminar"), deletePago);

router.get("/", empresaController.getEmpresas);
router.get("/:id", empresaController.getEmpresa);
router.post("/", requireCapability("configuracion/negocio", "crear"), empresaController.addEmpresa);
router.put("/:id", requireCapability("configuracion/negocio", "editar"), empresaController.updateEmpresa);
router.delete("/:id", requireCapability("configuracion/negocio", "eliminar"), empresaController.deleteEmpresa);
router.put("/:id/monedas", requireCapability("configuracion/negocio", "editar"), empresaController.updateEmpresaMonedas);

export default router;