import { Router } from "express";
import { methods as usuariosController } from "./../controllers/usuarios.controller.js";
import { checkFeatureAccess } from "../middlewares/featureAccess.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", auth, usuariosController.getUsuarios);
router.get("/:id", auth,  usuariosController.getUsuario);

// Ruta protegida por plan (ERP normal)
router.post("/", auth, usuariosController.addUsuario);

// Ruta especial para landing (sin restricciones de plan)
router.post("/landing", usuariosController.addUsuarioLanding);

router.put("/:id", auth, usuariosController.updateUsuario);
router.put("/plan/:id", usuariosController.updateUsuarioPlan);
router.delete("/:id", auth, usuariosController.deleteUsuario);

export default router;