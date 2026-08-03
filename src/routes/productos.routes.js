import { Router } from "express";
import { methods as productosController } from "./../controllers/productos.controller.js";
import { methods as productoImagenController } from "./../controllers/productoImagen.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { logMiddleware } from "../middlewares/log.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";
import { validateSchema } from "../middlewares/validator.middleware.js";
import { subirImagenSchema, reordenarImagenesSchema } from "../schemas/productoImagen.schema.js";

const router = Router();

// Aplica el middleware de autenticación a todas las rutas de productos
router.use(auth);
router.use(logMiddleware);

router.get("/", productosController.getProductos);
router.get("/lastid", productosController.getUltimoIdProducto);
router.get("/sku-por-barcode", productosController.buscarSkuPorBarcode);
router.get("/:id/variants", productosController.getProductVariants);
router.get("/:id/attributes", productosController.getProductAttributes);
router.get("/:id/historial-precio", productosController.getHistorialPrecioProducto);
router.get("/:id/combo", productosController.getProductCombo);
router.put("/:id/combo", requireCapability("productos", "editar"), productosController.updateProductCombo);
router.get("/images/all", productoImagenController.listAllTenantImages);
router.get("/:id/images", productoImagenController.listImages);
router.post("/:id/images", requireCapability("productos", "editar"), validateSchema(subirImagenSchema), productoImagenController.uploadImage);
router.delete("/:id/images/:idImagen", requireCapability("productos", "editar"), productoImagenController.deleteImage);
router.put("/:id/images/reorder", requireCapability("productos", "editar"), validateSchema(reordenarImagenesSchema), productoImagenController.reorderImages);
router.put("/:id/images/:idImagen/principal", requireCapability("productos", "editar"), productoImagenController.setPrincipal);
router.post("/variants", requireCapability("productos", "crear"), productosController.registerVariants);
router.get("/:id", productosController.getProducto);
router.post("/", requireCapability("productos", "crear"), productosController.addProducto);
router.put("/:id", requireCapability("productos", "editar"), productosController.updateProducto);
router.delete("/:id", requireCapability("productos", "eliminar"), productosController.deleteProducto);
router.post("/skus/generate", requireCapability("productos", "generar"), productosController.generateSKUs);
router.post("/import/excel", requireCapability("productos", "crear"), productosController.importExcel);
router.post("/batch", requireCapability("productos", "editar"), productosController.batchUpdateProductos);

export default router;