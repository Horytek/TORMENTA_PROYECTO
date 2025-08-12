import { Router } from "express";
import { methods as logsController } from "../controllers/logs.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(auth);
router.get("/", logsController.getLogs);
router.get("/:id", logsController.getLog);

export default router;
