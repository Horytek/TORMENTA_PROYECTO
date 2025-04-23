import { Router } from "express";
import { methods as usuariosController } from "./../controllers/usuarios.controller";

const router = Router();

router.get("/:id", usuariosController.getUsuario_1);

export default router;