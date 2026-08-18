import { ATELIER_FONTS } from "../tokens";

let fontsPromise: Promise<void> | null = null;

/** Carga Fraunces + DM Sans una sola vez (Studio, Player y render). */
export function loadAtelierFonts() {
  if (typeof document === "undefined") return Promise.resolve();
  if (fontsPromise) return fontsPromise;
  fontsPromise = new Promise((resolve) => {
    const existing = document.getElementById("atelier-fonts");
    if (existing) {
      resolve();
      return;
    }
    const link = document.createElement("link");
    link.id = "atelier-fonts";
    link.rel = "stylesheet";
    link.href = ATELIER_FONTS.href;
    link.onload = () => resolve();
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });
  return fontsPromise;
}
