import { continueRender, delayRender } from "remotion";
import { BRAND, PRODUCTS } from "../creandoModa.data";

function loadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

/** Precarga logo + imágenes del catálogo antes del render. */
export async function preloadCreandoModaAssets(): Promise<void> {
  const urls = new Set<string>([BRAND.logoUrl]);
  for (const p of PRODUCTS) {
    urls.add(p.image);
    for (const img of p.images) urls.add(img);
  }
  await Promise.all([...urls].map(loadImage));
}

export function delayRenderUntilAssetsLoaded(): Promise<void> {
  const handle = delayRender("creando-moda-v2-assets");
  return preloadCreandoModaAssets().finally(() => continueRender(handle));
}
