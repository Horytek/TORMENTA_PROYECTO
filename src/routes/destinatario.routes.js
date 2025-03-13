import { Router } from "express";
import { methods as destinatarioController } from "../controllers/destinatario.controller";

const router = Router();
router.get("/", destinatarioController.getDestinatarios);
router.get("/:id", destinatarioController.getDestinatario);
router.post("/", destinatarioController.insertDestinatario);
router.delete("/:id", destinatarioController.deleteDestinatario);
router.put("/update/:id", destinatarioController.updateDestinatario);

export default router;