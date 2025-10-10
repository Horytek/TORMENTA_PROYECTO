import { Router } from "express";
import { helpSearch, helpMiniContext, helpSchema, helpForms  } 
from "../controllers/help.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(auth);

router.get("/search", helpSearch);
router.get("/mini-context", helpMiniContext);
router.get("/schema", helpSchema);
router.get("/forms", helpForms);

export default router;