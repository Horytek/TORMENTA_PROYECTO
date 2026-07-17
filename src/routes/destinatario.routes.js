import { Router } from "express";
import { methods as destinatarioController } from "../controllers/destinatario.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();

// Aplica el middleware de autenticación a todas las rutas de productos
router.use(auth);

router.get("/", destinatarioController.getDestinatarios);
router.get("/:id", destinatarioController.getDestinatario);
router.post("/", requireCapability("proveedores", "crear"), destinatarioController.insertDestinatario);
router.delete("/:id", requireCapability("proveedores", "eliminar"), destinatarioController.deleteDestinatario);
router.put("/update/natural/:id", requireCapability("proveedores", "editar"), destinatarioController.updateDestinatarioNatural);
router.put("/update/juridico/:id", requireCapability("proveedores", "editar"), destinatarioController.updateDestinatarioJuridico);
router.post("/natural", requireCapability("proveedores", "crear"), destinatarioController.addDestinatarioNatural);
router.post("/juridico", requireCapability("proveedores", "crear"), destinatarioController.addDestinatarioJuridico);

export default router;