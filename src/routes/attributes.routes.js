import { Router } from "express";
import { methods } from "../controllers/attributes.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";

const router = Router();

// Base: /api/attributes

router.get("/", auth, methods.getAttributes);
router.post("/", auth, requireCapability("productos", "crear"), methods.createAttribute);
// Antes de "/:id": si no, Express lo interpreta como id_atributo = "reorder".
router.put("/reorder", auth, requireCapability("productos", "editar"), methods.reorderAttributes);
router.get("/:id/impact", auth, methods.getAttributeImpact);
router.put("/:id", auth, requireCapability("productos", "editar"), methods.updateAttribute);
// router.delete("/:id", auth, methods.deleteAttribute);

router.get("/:id/values", auth, methods.getAttributeValues);
router.post("/:id/values", auth, requireCapability("productos", "crear"), methods.createAttributeValue);
router.put("/:id/values/reorder", auth, requireCapability("productos", "editar"), methods.reorderAttributeValues);
router.put("/values/:id_valor", auth, requireCapability("productos", "editar"), methods.updateAttributeValue);
router.delete("/values/:id_valor", auth, requireCapability("productos", "eliminar"), methods.deleteAttributeValue);

// Categories
router.get("/category/:id_categoria", auth, methods.getCategoryAttributes);
router.post("/link-category", auth, requireCapability("productos", "editar"), methods.linkCategoryAttributes);

export default router;
