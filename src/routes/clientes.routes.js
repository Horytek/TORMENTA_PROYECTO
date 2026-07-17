import { Router } from "express";
import { methods as clientesController } from "./../controllers/clientes.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { logMiddleware } from "../middlewares/log.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();

// Aplica el middleware de autenticación a todas las rutas de productos
router.use(auth);
router.use(logMiddleware);

router.get("/", clientesController.getClientes);
router.post("/", requireCapability("clientes", "crear"), clientesController.addCliente);
router.get("/getCliente/:id", clientesController.getCliente);
router.put("/updateCliente", requireCapability("clientes", "editar"), clientesController.updateCliente);
router.delete("/deleteCliente/:id", requireCapability("clientes", "eliminar"), clientesController.deleteCliente);
router.put("/deactivateCliente/:id", requireCapability("clientes", "desactivar"), clientesController.deactivateCliente);
router.get("/compras", clientesController.getComprasCliente);
router.get("/historial", clientesController.getHistorialCliente);
router.get("/externos", clientesController.getClientesExternos);
router.get("/externos/compras", clientesController.getComprasClienteExterno);
router.get("/externos/compra/:id", clientesController.getCompraExternoById);
router.get("/stats", clientesController.getClientStats);
router.get("/externos/compras-by-doc", clientesController.getComprasClienteExternoByDoc);

export default router;