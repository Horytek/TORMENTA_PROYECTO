import { Router } from "express";
import { methods as destinatarioController } from "../controllers/destinatario.controller";

const router = Router();
router.post("/nuevodestinatario", destinatarioController.insertDestinatario);

export default router;