/**
 * Config del video TikTok V2 — Textiles Creando Moda.
 * 23 s · 9:16 · 30 fps · pantalla llena · sin teléfonos en pantalla.
 */
import { VIDEO_EASE } from "../../../../atelier/video/videoConfig";
import { BRAND } from "../creandoModa.data";

export const CREANDO_MODA_V2_ID = "CreandoModaTiktokV2";
export const CREANDO_MODA_V2_FPS = 30;
export const CREANDO_MODA_V2_WIDTH = 1080;
export const CREANDO_MODA_V2_HEIGHT = 1920;

/** Safe zone ampliada para UI TikTok/IG — textos críticos en centro-inferior. */
export const CREANDO_MODA_SAFE_V2 = {
  top: 200,
  bottom: 340,
  left: 72,
  right: 120,
} as const;

/** Duración por escena en frames (total 690 = 23 s). */
export const CREANDO_MODA_SCENE_FRAMES_V2 = {
  hook: 60,
  collection: 90,
  productHero: 120,
  catalogFlow: 120,
  experience: 120,
  ecomOverlay: 90,
  cta: 90,
} as const;

export type CreandoModaSceneV2Id = keyof typeof CREANDO_MODA_SCENE_FRAMES_V2;

export const CREANDO_MODA_SCENE_ORDER_V2 = [
  "hook",
  "collection",
  "productHero",
  "catalogFlow",
  "experience",
  "ecomOverlay",
  "cta",
] as const satisfies readonly CreandoModaSceneV2Id[];

export type CreandoModaSceneV2Span = { from: number; duration: number };

export function creandoModaSceneSpansV2(): Record<CreandoModaSceneV2Id, CreandoModaSceneV2Span> & {
  total: number;
} {
  let from = 0;
  const map = {} as Record<CreandoModaSceneV2Id, CreandoModaSceneV2Span>;
  for (const id of CREANDO_MODA_SCENE_ORDER_V2) {
    const duration = CREANDO_MODA_SCENE_FRAMES_V2[id];
    map[id] = { from, duration };
    from += duration;
  }
  return { ...map, total: from };
}

export const CREANDO_MODA_V2_DURATION_FRAMES = creandoModaSceneSpansV2().total;

/** Frames de corte para SFX / transiciones sincronizadas al beat. */
export const AUDIO_CUE_FRAMES_V2 = [0, 60, 150, 270, 390, 510, 600] as const;

export const CREANDO_MODA_V2_FONTS = {
  display: '"Outfit", ui-sans-serif, system-ui, sans-serif',
  body: '"Manrope", ui-sans-serif, system-ui, sans-serif',
  href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap",
} as const;

/** Tamaños mínimos tipográficos v2 (1080×1920). */
export const CREANDO_MODA_V2_TYPE = {
  hero: 92,
  product: 58,
  price: 48,
  secondary: 30,
  ctaButton: 34,
  micro: 22,
} as const;

export const CREANDO_MODA_V2_COPY = {
  hookHeadline: "TU NUEVO ESTILO ESTÁ AQUÍ.",
  collectionHeadline: "NUEVA TEMPORADA",
  collectionTagline: "Moda femenina para cada momento.",
  experienceLine1: "ENCUENTRA TU ESTILO",
  experienceLine2: "ENCUENTRA TU MOMENTO",
  overlayHeadline: "VER COLECCIÓN →",
  ctaHook: "¡Renueva tu clóset hoy!",
  ctaPriceFrom: `Desde ${BRAND.priceFrom}`,
  ctaButton: "TOCA EL ENLACE DEL PERFIL",
  whatsappHint: "Consúltanos por WhatsApp desde la tienda",
  chips: {
    disponible: "Disponible",
    tallas: "Tallas",
    colores: "Colores",
  },
} as const;

export const CREANDO_MODA_V2 = {
  id: CREANDO_MODA_V2_ID,
  fps: CREANDO_MODA_V2_FPS,
  width: CREANDO_MODA_V2_WIDTH,
  height: CREANDO_MODA_V2_HEIGHT,
  durationInFrames: CREANDO_MODA_V2_DURATION_FRAMES,
  colors: {
    accent: BRAND.accent,
    accentDark: "#831843",
    bg: BRAND.bg,
    ink: BRAND.ink,
    overlay: "rgba(28, 25, 23, 0.28)",
    overlayStrong: "rgba(28, 25, 23, 0.55)",
    white: "#FFFFFF",
    muted: "rgba(255, 255, 255, 0.82)",
    gradientCta: "linear-gradient(165deg, #BE185D 0%, #831843 100%)",
  },
  fonts: CREANDO_MODA_V2_FONTS,
  type: CREANDO_MODA_V2_TYPE,
  copy: CREANDO_MODA_V2_COPY,
  ease: VIDEO_EASE,
  safe: CREANDO_MODA_SAFE_V2,
} as const;
