import { Router } from "express";
import { methods as claveController } from "./../controllers/clave.controller";

const router = Router();

router.get("/:id", claveController.getClaveByEmpresaAndTipo);
export default router;