import { Router } from "express";
import { methods as centroCostoController } from "../controllers/centroCosto.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";
import { validateSchema } from "../middlewares/validator.middleware.js";
import { centroCostoSchema } from "../schemas/contabilidad.schema.js";

const router = Router();

router.use(auth);

router.get("/", requireCapability("/contabilidad/centros-costo", "ver"), centroCostoController.getCentrosCosto);
router.post("/", requireCapability("/contabilidad/centros-costo", "crear"), validateSchema(centroCostoSchema), centroCostoController.createCentroCosto);
router.put("/:id", requireCapability("/contabilidad/centros-costo", "editar"), centroCostoController.updateCentroCosto);

export default router;
