import { Router } from "express";
import { methods as rolController } from "../controllers/plan_pago.controller";

const router = Router();

router.get("/", rolController.getPlanes);
//router.delete("/:id", rolController.deleteFuncion);

export default router;