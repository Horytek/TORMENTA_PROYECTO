import { Router } from "express";
import { methods as developerController } from "../controllers/developer.controller.js";
import { auth as verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.delete("/clear-data", [verifyToken], developerController.clearData);

export default router;
