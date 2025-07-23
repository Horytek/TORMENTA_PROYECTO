import { Router } from "express";
import { methods as destinatarioController } from "../controllers/destinatario.controller";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

// Aplica el middleware de autenticación a todas las rutas de productos
router.use(auth);

router.get("/", destinatarioController.getDestinatarios);
router.get("/:id", destinatarioController.getDestinatario);
router.post("/", destinatarioController.insertDestinatario);
router.delete("/:id", destinatarioController.deleteDestinatario);
router.put("/update/natural/:id", destinatarioController.updateDestinatarioNatural);
router.put("/update/juridico/:id", destinatarioController.updateDestinatarioJuridico);
router.post("/natural", destinatarioController.addDestinatarioNatural);      // <-- Agrega esta línea
router.post("/juridico", destinatarioController.addDestinatarioJuridico);

export default router;