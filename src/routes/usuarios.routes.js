import { Router } from "express";
import { methods as usuariosController } from "./../controllers/usuarios.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();

router.get("/", auth, usuariosController.getUsuarios);
router.get("/:id", auth, usuariosController.getUsuario);

// Ruta protegida por plan (ERP normal)
router.post("/", auth, requireCapability("configuracion/usuarios", "crear"), usuariosController.addUsuario);

// Ruta especial para landing (sin restricciones de plan)
router.post("/landing", usuariosController.addUsuarioLanding);

// Ruta para operaciones masivas
router.post("/bulk-update", auth, requireCapability("configuracion/usuarios", "editar"), usuariosController.bulkUpdateUsuarios);
router.post("/import", auth, requireCapability("configuracion/usuarios", "crear"), upload.single('file'), usuariosController.importUsuarios);
router.get("/export", auth, usuariosController.exportUsuarios);

router.put("/:id", auth, requireCapability("configuracion/usuarios", "editar"), usuariosController.updateUsuario);
router.put("/plan/:id", auth, requireCapability("configuracion/usuarios", "editar"), usuariosController.updateUsuarioPlan);
router.delete("/:id", auth, requireCapability("configuracion/usuarios", "eliminar"), usuariosController.deleteUsuario);

export default router;