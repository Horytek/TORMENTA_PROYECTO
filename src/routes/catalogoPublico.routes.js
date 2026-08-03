import { Router } from "express";
import { methods as catalogoController } from "../controllers/catalogoPublico.controller.js";

// Sin `auth`: es la vitrina pública del catálogo digital, a propósito.
const router = Router();

router.get("/:id_tenant", catalogoController.getCatalogoPublico);

export default router;
