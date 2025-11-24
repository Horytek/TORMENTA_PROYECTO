import { Router } from "express";
import { methods as clientesController } from "./../controllers/clientes.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { logMiddleware } from "../middlewares/log.middleware.js";

const router = Router();

// Aplica el middleware de autenticación a todas las rutas de productos
router.use(auth);
router.use(logMiddleware);

router.get("/", clientesController.getClientes);
router.post("/", clientesController.addCliente);
router.get("/getCliente/:id", clientesController.getCliente);
router.put("/updateCliente", clientesController.updateCliente);
router.delete("/deleteCliente/:id", clientesController.deleteCliente);
router.put("/deactivateCliente/:id", clientesController.deactivateCliente);
router.get("/compras", clientesController.getComprasCliente);
router.get("/historial", clientesController.getHistorialCliente);
router.get("/stats", clientesController.getClientStats);

export default router;