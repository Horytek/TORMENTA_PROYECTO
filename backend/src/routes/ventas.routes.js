import { Router } from "express";
import { methods as ventasController } from "./../controllers/ventas.controller";

const router = Router();

router.get("/", ventasController.getLanguages);

export default router;