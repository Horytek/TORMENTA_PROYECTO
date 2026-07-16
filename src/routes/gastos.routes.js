import { Router } from "express";
import { methods as gastosController } from "../controllers/gastos.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();

router.use(auth);

router.get("/categorias", requireCapability("contabilidad", "ver"), gastosController.getCategorias);
router.post("/categorias", requireCapability("contabilidad", "crear"), gastosController.createCategoria);

router.get("/", requireCapability("contabilidad", "ver"), gastosController.getGastos);
router.post("/", requireCapability("contabilidad", "crear"), gastosController.createGasto);
router.delete("/:id", requireCapability("contabilidad", "eliminar"), gastosController.deleteGasto);

router.get("/pl", requireCapability("contabilidad", "ver"), gastosController.getPL);

export default router;
