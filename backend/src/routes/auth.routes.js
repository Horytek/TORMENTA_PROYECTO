import { Router } from "express";
import { methods as authController } from "./../controllers/auth.controller";

const router = Router();

router.post("/login", authController.login);
router.post("/logout", authController.logout);

export default router;