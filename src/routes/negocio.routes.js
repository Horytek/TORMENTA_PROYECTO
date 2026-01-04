import { Router } from "express";
import { getNegocio, updateNegocio } from "../controllers/negocio.controller.js";
import upload from "../middlewares/upload.middleware.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(auth); // Require login

router.get("/", getNegocio);
router.put("/", upload.single('logo'), updateNegocio);

export default router;
