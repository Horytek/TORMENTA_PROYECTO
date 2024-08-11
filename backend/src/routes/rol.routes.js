import { Router } from "express";
import { methods as rolController } from "../controllers/rol.controller";

const router = Router();

router.get("/", rolController.getRoles);

export default router;