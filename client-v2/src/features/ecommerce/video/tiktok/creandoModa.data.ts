/**
 * Wrapper estable sobre el catálogo generado.
 * Si falta el .generated.ts, corre: npm run export:creando-moda-video
 */
import {
  BRAND,
  CATEGORIES,
  GENERATED_AT,
  PRODUCTS,
  SCENE_PICKS,
  SCENE_PICKS_V2,
  SOURCE,
} from "./creandoModa.data.generated";
import type { CreandoModaProduct } from "./creandoModa.data.generated";

export type { CreandoModaProduct, CreandoModaTonalidad } from "./creandoModa.data.generated";
export { BRAND, CATEGORIES, GENERATED_AT, PRODUCTS, SCENE_PICKS, SCENE_PICKS_V2, SOURCE };

export function formatPen(n: number): string {
  return `S/ ${Number(n).toFixed(2)}`;
}

export function productById(id: number): CreandoModaProduct | undefined {
  return PRODUCTS.find((p) => p.id_producto === id);
}

export function productBySku(sku: string): CreandoModaProduct | undefined {
  return PRODUCTS.find((p) => p.sku === sku);
}

export type SceneRole =
  | "impact"
  | "editorial-hero"
  | "editorial-secondary"
  | "cinematic"
  | "storefront"
  | "banner";

export function productsForScene(role: SceneRole): CreandoModaProduct[] {
  switch (role) {
    case "impact":
      return SCENE_PICKS.impact
        .map((id) => productById(id))
        .filter((p): p is CreandoModaProduct => Boolean(p));
    case "editorial-hero": {
      const hero = productById(SCENE_PICKS.editorial.hero);
      return hero ? [hero] : [];
    }
    case "editorial-secondary":
      return SCENE_PICKS.editorial.secondary
        .map((id) => productById(id))
        .filter((p): p is CreandoModaProduct => Boolean(p));
    case "cinematic": {
      const p = productById(SCENE_PICKS.cinematic);
      return p ? [p] : [];
    }
    case "storefront": {
      const p = productById(SCENE_PICKS.storefront);
      return p ? [p] : [];
    }
    case "banner": {
      const url = SCENE_PICKS.banner;
      if (!url) return [];
      const match = PRODUCTS.find((p) => p.image === url);
      return match ? [match] : [];
    }
    default:
      return [];
  }
}

export type SceneRoleV2 =
  | "hook"
  | "collection"
  | "productHero"
  | "catalogScroll"
  | "experience"
  | "overlay-background"
  | "overlay-card";

export function productsForSceneV2(role: SceneRoleV2): CreandoModaProduct[] {
  switch (role) {
    case "hook": {
      const p = productById(SCENE_PICKS_V2.hook);
      return p ? [p] : [];
    }
    case "collection":
      return SCENE_PICKS_V2.collection
        .map((id) => productById(id))
        .filter((p): p is CreandoModaProduct => Boolean(p));
    case "productHero": {
      const p = productById(SCENE_PICKS_V2.productHero);
      return p ? [p] : [];
    }
    case "catalogScroll":
      return SCENE_PICKS_V2.catalogScroll
        .map((id) => productById(id))
        .filter((p): p is CreandoModaProduct => Boolean(p));
    case "experience": {
      const p = productById(SCENE_PICKS_V2.experience);
      return p ? [p] : [];
    }
    case "overlay-background": {
      const p = productById(SCENE_PICKS_V2.overlay.background);
      return p ? [p] : [];
    }
    case "overlay-card": {
      const p = productById(SCENE_PICKS_V2.overlay.card);
      return p ? [p] : [];
    }
    default:
      return [];
  }
}
