import { Router } from "express";
import { methods as usuariosController } from "./../controllers/usuarios.controller";

const router = Router();

router.get("/", usuariosController.getUsuarios);
router.get("/:id", usuariosController.getUsuario);
router.post("/", usuariosController.addUsuario);
router.put("/:id", usuariosController.updateUsuario);
router.delete("/:id", usuariosController.deleteUsuario);

export default router;