import { Router } from "express";
import { methods as developerController } from "../controllers/developer.controller.js";
import { methods as actionCatalog } from "../controllers/actionCatalog.controller.js";
import { auth as verifyToken } from "../middlewares/auth.middleware.js";
import { requireDeveloper } from "../middlewares/authorize.middleware.js";

const router = Router();

// Todo el panel Developer queda reservado a id_rol=10 / usuario "desarrollador".
// La password de clear-data (ver developer.controller.js) queda como confirmación
// extra dentro del modal, ya no como única barrera.
router.use([verifyToken, requireDeveloper]);

router.delete("/clear-data", developerController.clearData);

// Routes for Action Catalog
router.get("/actions", actionCatalog.getActions);
router.post("/actions", actionCatalog.createAction);
router.put("/actions/:id", actionCatalog.updateAction);
router.delete("/actions/:id", actionCatalog.deleteAction);

// Route for Module Configuration (Active Actions)
router.put("/module-config/:type/:id", actionCatalog.updateModuleConfig);

export default router;
