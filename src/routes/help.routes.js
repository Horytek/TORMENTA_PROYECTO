import { Router } from "express";
import { helpSearch, helpMiniContext } from "../controllers/help.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(auth);

router.get("/search", helpSearch);
router.get("/mini-context", helpMiniContext);

export default router;