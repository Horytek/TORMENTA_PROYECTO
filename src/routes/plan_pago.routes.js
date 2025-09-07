import { Router } from "express";
import { methods as rolController } from "../controllers/plan_pago.controller.js";

const router = Router();

router.get("/", rolController.getPlanes);

export default router;