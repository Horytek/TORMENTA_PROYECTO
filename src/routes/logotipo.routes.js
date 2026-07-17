import { Router } from "express";
import { methods as usuariosController } from "./../controllers/usuarios.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/:id", auth, usuariosController.getUsuario_1);

export default router;