import { Router } from "express";
import { methods as developerController } from "../controllers/developer.controller.js";
import { methods as actionCatalogController } from "../controllers/actionCatalog.controller.js";
import { methods as actionCatalog } from "../controllers/actionCatalog.controller.js";
import { auth as verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.delete("/clear-data", [verifyToken], developerController.clearData);

// Routes for Action Catalog
router.get("/actions", [verifyToken], actionCatalog.getActions);
router.post("/actions", [verifyToken], actionCatalog.createAction);
router.put("/actions/:id", [verifyToken], actionCatalog.updateAction);
router.delete("/actions/:id", [verifyToken], actionCatalog.deleteAction);

// Route for Module Configuration (Active Actions)
router.put("/module-config/:type/:id", [verifyToken], actionCatalog.updateModuleConfig);

export default router;
