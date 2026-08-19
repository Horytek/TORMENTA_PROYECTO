import { CREANDO_MODA_FONTS } from "./tiktokConfig";

let fontsPromise: Promise<void> | null = null;

/** Carga Outfit + Manrope una sola vez (Studio, Player y render). */
export function loadEcommerceFonts() {
  if (typeof document === "undefined") return Promise.resolve();
  if (fontsPromise) return fontsPromise;
  fontsPromise = new Promise((resolve) => {
    const existing = document.getElementById("ecommerce-video-fonts");
    if (existing) {
      resolve();
      return;
    }
    const link = document.createElement("link");
    link.id = "ecommerce-video-fonts";
    link.rel = "stylesheet";
    link.href = CREANDO_MODA_FONTS.href;
    link.onload = () => resolve();
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });
  return fontsPromise;
}
