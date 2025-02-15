import { Router } from "express";
import { methods as clientesController } from "./../controllers/clientes.controller";

const router = Router();

router.get("/", clientesController.getClientes);
router.post("/", clientesController.addCliente);
router.get("/getCliente:id", clientesController.getCliente);
router.put("/updateCliente:id", clientesController.updateCliente);
router.delete("/deleteCliente/:id", clientesController.deleteCliente);
router.put("/deactivateCliente/:id", clientesController.deactivateCliente);

export default router;