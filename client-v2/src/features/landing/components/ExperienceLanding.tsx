import type { LandingProductModule } from "../modules/landingModule.types";
import { PRODUCT_LAYOUTS } from "../layouts/products/registry";
import { ExperienceDemoCta } from "./ExperienceDemoCta";

export interface ExperienceLandingProps {
  module: LandingProductModule;
}

/**
 * Cada producto tiene layout interactivo propio (registry).
 * Sin fallback a kits genéricos Story/Feature/Case.
 */
export function ExperienceLanding({ module }: ExperienceLandingProps) {
  const Layout = PRODUCT_LAYOUTS[module.productId];
  if (!Layout) {
    console.error(`ExperienceLanding: sin layout para productId=${module.productId}`);
    return null;
  }

  return (
    <>
      <Layout module={module} />
      <ExperienceDemoCta productId={module.productId} />
    </>
  );
}
