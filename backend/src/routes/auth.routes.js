import { Router } from "express";
import { methods as authController } from "./../controllers/auth.controller";
import { validateSchema } from "../middlewares/validator.middleware.js";
import { loginSchema } from "../schemas/auth.schema.js";

const router = Router();

router.post("/login", validateSchema(loginSchema), authController.login);
router.post("/logout", authController.logout);
router.get("/verify", authController.verifyToken);

export default router;