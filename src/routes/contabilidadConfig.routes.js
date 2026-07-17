import { Router } from "express";
import { methods as contabilidadConfigController } from "../controllers/contabilidadConfig.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";
import { validateSchema } from "../middlewares/validator.middleware.js";
import { contabilidadConfigSchema } from "../schemas/contabilidad.schema.js";

const router = Router();

router.use(auth);

router.get("/", requireCapability("/contabilidad/configuracion", "ver"), contabilidadConfigController.getConfig);
router.post("/", requireCapability("/contabilidad/configuracion", "crear"), validateSchema(contabilidadConfigSchema), contabilidadConfigController.upsertConfig);
router.delete("/:id", requireCapability("/contabilidad/configuracion", "eliminar"), contabilidadConfigController.deleteConfig);

export default router;
