import { Router } from "express";
import { methods as almacenesController } from "./../controllers/almacen.controller";

const router = Router();

router.get("/", almacenesController.getAlmacenes);
router.get("/sucursales", almacenesController.getSucursales);
router.get("/:id", almacenesController.getAlmacen);
router.post("/", almacenesController.addAlmacen);
router.put("/:id", almacenesController.updateAlmacen);
router.delete("/:id", almacenesController.deleteAlmacen);



export default router;
