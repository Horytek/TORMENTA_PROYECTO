import { Router } from "express";
import { methods as rolController } from "../controllers/rol.controller";

const router = Router();

router.get("/", rolController.getRoles);
router.get("/:id", rolController.getRol);
router.get("/pagina-defecto/:id", rolController.getPaginaDefecto)
router.post("/", rolController.addRol);
router.put("/:id", rolController.updateRol);
router.put("/pagina-inicio/:id", rolController.guardarPaginaPorDefecto);
router.delete("/:id", rolController.deleteRol);

export default router;