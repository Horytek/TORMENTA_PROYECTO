import { Router } from "express";
import { methods as usuariosController } from "./../controllers/usuarios.controller.js";
import { checkFeatureAccess } from "../middlewares/featureAccess.js";

const router = Router();

router.get("/", usuariosController.getUsuarios);
router.get("/:id", usuariosController.getUsuario);
//router.get("/empresa_u/:id", usuariosController.getUsuario_1);

// Limita creación de usuarios según el plan
router.post("/", checkFeatureAccess("usuarios_ilimitados", { checkLimit: true }), usuariosController.addUsuario);

router.put("/:id", usuariosController.updateUsuario);
router.put("/plan/:id", usuariosController.updateUsuarioPlan);
router.delete("/:id", usuariosController.deleteUsuario);

export default router;