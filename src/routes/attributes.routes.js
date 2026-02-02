import { Router } from "express";
import { methods } from "../controllers/attributes.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

// Base: /api/attributes

router.get("/", auth, methods.getAttributes);
router.post("/", auth, methods.createAttribute);
router.put("/:id", auth, methods.updateAttribute);
// router.delete("/:id", auth, methods.deleteAttribute);

router.get("/:id/values", auth, methods.getAttributeValues);
router.post("/:id/values", auth, methods.createAttributeValue);
router.put("/values/:id_valor", auth, methods.updateAttributeValue);
router.delete("/values/:id_valor", auth, methods.deleteAttributeValue);

// Categories
router.get("/category/:id_categoria", auth, methods.getCategoryAttributes);
router.post("/link-category", auth, methods.linkCategoryAttributes);

export default router;
