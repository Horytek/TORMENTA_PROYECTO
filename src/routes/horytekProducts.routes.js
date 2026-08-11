import { Router } from "express";
import {
  HORYTEK_PRODUCTS,
  HORYTEK_BUNDLES,
  PRODUCT_DEFINITION_OF_DONE,
  getProductBySlug,
  loginSurfaces,
} from "../config/horytekProducts.config.js";

const router = Router();

/** Catálogo canónico público (landing / soluciones). Sin datos de tenant. */
router.get("/", (_req, res) => {
  res.json({
    success: true,
    data: {
      products: HORYTEK_PRODUCTS.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        job: p.job,
        database: p.database || null,
        surfaces: p.surfaces,
        wave: p.wave,
        loginMode: p.loginMode,
        adminPath: p.adminPath,
        clientPath: p.clientPath,
        notIncludes: p.notIncludes,
      })),
      bundles: HORYTEK_BUNDLES,
      definitionOfDone: PRODUCT_DEFINITION_OF_DONE,
      loginSurfaces: loginSurfaces(),
    },
  });
});

router.get("/:slug", (req, res) => {
  const product = getProductBySlug(req.params.slug);
  if (!product) {
    return res.status(404).json({ success: false, message: "Producto no encontrado" });
  }
  const bundles = HORYTEK_BUNDLES.filter((b) => b.productIds.includes(product.id));
  return res.json({
    success: true,
    data: { product, bundles, definitionOfDone: PRODUCT_DEFINITION_OF_DONE },
  });
});

export default router;
