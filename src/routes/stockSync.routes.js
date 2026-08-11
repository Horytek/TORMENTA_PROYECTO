import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validator.middleware.js";
import {
  syncCanalSchema,
  syncMapeoSchema,
  syncJobSchema,
} from "../schemas/stockSync.schema.js";
import {
  listCanales,
  createCanal,
  listMapeos,
  createMapeo,
  listJobs,
  enqueueJob,
  getStatus,
} from "../controllers/stockSync.controller.js";

const router = Router();

router.use(auth);

router.get("/status", getStatus);
router.get("/canales", listCanales);
router.post("/canales", validateSchema(syncCanalSchema), createCanal);
router.get("/mapeos", listMapeos);
router.post("/mapeos", validateSchema(syncMapeoSchema), createMapeo);
router.get("/jobs", listJobs);
router.post("/jobs", validateSchema(syncJobSchema), enqueueJob);

export default router;
