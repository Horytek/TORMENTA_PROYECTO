import { Router } from "express";
import { chat } from "../controllers/chat.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(auth);
router.post("/", chat);

export default router;