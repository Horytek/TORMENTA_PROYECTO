import { Router } from "express";
import { methods as logsController } from "../controllers/logs.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { forceLogCleanup, logMaintenanceService } from "../services/logMaintenance.service.js";

const router = Router();

router.use(auth);
router.get("/", logsController.getLogs);
router.get("/stats", logsController.getLogStats);
router.get("/:id", logsController.getLog);

// Rutas de mantenimiento (solo para administradores)
router.post("/cleanup", async (req, res) => {
  try {
    const result = await forceLogCleanup();
    res.json({
      code: 1,
      message: "Limpieza de logs ejecutada correctamente",
      data: result
    });
  } catch (error) {
    console.error('Error en limpieza manual:', error);
    res.status(500).json({
      code: 0,
      message: "Error ejecutando limpieza de logs"
    });
  }
});

router.get("/maintenance/status", (req, res) => {
  const status = logMaintenanceService.getStatus();
  res.json({
    code: 1,
    data: status
  });
});

export default router;
