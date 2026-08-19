/**
 * Config del video TikTok — Textiles Creando Moda.
 * 23 s · 9:16 · 30 fps · sin teléfonos en pantalla.
 */
import { VIDEO_EASE } from "../../../atelier/video/videoConfig";
import { BRAND } from "./creandoModa.data";

export const CREANDO_MODA_ID = "CreandoModaTiktok";
export const CREANDO_MODA_FPS = 30;
export const CREANDO_MODA_WIDTH = 1080;
export const CREANDO_MODA_HEIGHT = 1920;

export const CREANDO_MODA_SAFE = {
  top: 172,
  bottom: 300,
  left: 56,
  right: 100,
} as const;

/** Duración por escena en frames (total 690 = 23 s). */
export const CREANDO_MODA_SCENE_FRAMES = {
  brandIntro: 90,
  visualImpact: 90,
  productEditorial: 150,
  cinematicMoment: 120,
  storefront: 120,
  closing: 120,
} as const;

export type CreandoModaSceneId = keyof typeof CREANDO_MODA_SCENE_FRAMES;

export const CREANDO_MODA_SCENE_ORDER = [
  "brandIntro",
  "visualImpact",
  "productEditorial",
  "cinematicMoment",
  "storefront",
  "closing",
] as const satisfies readonly CreandoModaSceneId[];

export type CreandoModaSceneSpan = { from: number; duration: number };

export function creandoModaSceneSpans(): Record<CreandoModaSceneId, CreandoModaSceneSpan> & {
  total: number;
} {
  let from = 0;
  const map = {} as Record<CreandoModaSceneId, CreandoModaSceneSpan>;
  for (const id of CREANDO_MODA_SCENE_ORDER) {
    const duration = CREANDO_MODA_SCENE_FRAMES[id];
    map[id] = { from, duration };
    from += duration;
  }
  return { ...map, total: from };
}

export const CREANDO_MODA_DURATION_FRAMES = creandoModaSceneSpans().total;

/** Frames de corte para SFX / transiciones. */
export const AUDIO_CUE_FRAMES = [90, 180, 330, 450, 570] as const;

export const CREANDO_MODA_FONTS = {
  display: '"Outfit", ui-sans-serif, system-ui, sans-serif',
  body: '"Manrope", ui-sans-serif, system-ui, sans-serif',
  href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap",
} as const;

export const CREANDO_MODA_COPY = {
  wordmark: "TEXTILES CREANDO MODA",
  tagline: BRAND.tagline,
  concept: BRAND.concept,
  heroHeadline: BRAND.heroHeadline,
  heroTagline: BRAND.heroTagline,
  cinematicLine1: "ENCUENTRA TU ESTILO",
  cinematicLine2: "ENCUENTRA TU MOMENTO",
  whatsappHint: "Escríbenos por WhatsApp desde la tienda",
  ctaUrl: "horycore.online/tienda/textiles_creando_moda",
  priceFrom: `Desde ${BRAND.priceFrom}`,
} as const;

export const CREANDO_MODA = {
  id: CREANDO_MODA_ID,
  fps: CREANDO_MODA_FPS,
  width: CREANDO_MODA_WIDTH,
  height: CREANDO_MODA_HEIGHT,
  durationInFrames: CREANDO_MODA_DURATION_FRAMES,
  colors: {
    accent: BRAND.accent,
    bg: BRAND.bg,
    ink: BRAND.ink,
    overlay: "rgba(28, 25, 23, 0.28)",
    overlayStrong: "rgba(28, 25, 23, 0.42)",
    white: "#FFFFFF",
    muted: "rgba(28, 25, 23, 0.62)",
  },
  fonts: CREANDO_MODA_FONTS,
  copy: CREANDO_MODA_COPY,
  ease: VIDEO_EASE,
} as const;
