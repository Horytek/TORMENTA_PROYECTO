/**
 * Segundo corto Atelier — 9:16 para TikTok.
 * 21 s, sin audio. Safe zone: texto lejos del chrome (arriba / derecha / abajo).
 */
import { ATELIER_COLORS, ATELIER_FONTS } from "../../tokens";
import { ATELIER_COPY } from "../../copy";

export const TIKTOK_ID = "HorytekTiktok";
export const TIKTOK_FPS = 30;
export const TIKTOK_WIDTH = 1080;
export const TIKTOK_HEIGHT = 1920;

export const TIKTOK_SAFE = {
  top: 172,
  bottom: 300,
  left: 56,
  right: 100,
} as const;

/** Duración de cada escena en frames (30 fps). Total 21 s. */
export const TIKTOK_SCENE_FRAMES = {
  hook: 75,
  brief: 90,
  ink: 210,
  reveal: 150,
  endcard: 105,
} as const;

export type TiktokSceneId = keyof typeof TIKTOK_SCENE_FRAMES;

export const TIKTOK_SCENE_ORDER = [
  "hook",
  "brief",
  "ink",
  "reveal",
  "endcard",
] as const satisfies readonly TiktokSceneId[];

export type TiktokSceneSpan = { from: number; duration: number };

export function tiktokSceneSpans(): Record<TiktokSceneId, TiktokSceneSpan> & { total: number } {
  let from = 0;
  const map = {} as Record<TiktokSceneId, TiktokSceneSpan>;
  for (const id of TIKTOK_SCENE_ORDER) {
    const duration = TIKTOK_SCENE_FRAMES[id];
    map[id] = { from, duration };
    from += duration;
  }
  return { ...map, total: from };
}

export const TIKTOK_DURATION_FRAMES = tiktokSceneSpans().total;

export const TIKTOK_COPY = {
  wordmarkKicker: "HORYTEK",
  wordmark: "ATELIER",
  hookLine1: "No pides un producto.",
  hookLine2: "Encargas un trazo.",
  briefLabel: "La idea",
  briefTitle: "Gato en el umbral",
  briefMeta: "Tinta china · A5",
  briefNote: "Una silueta en la puerta.",
  artistName: "Mora Tinta",
  artistMark: "Estudio · tinta",
  inkLabel: "El trazo",
  inkTitle: "Primero, la tinta.",
  obraLabel: "La obra",
  obraTitle: "Noche en el umbral",
  obraNote: "La tinta encontró el papel.",
  commission: "Encargo #221",
  reveal: ATELIER_COPY.ideaExists,
  tagline: ATELIER_COPY.taglineFull,
  cta: ATELIER_COPY.ctaCommission,
} as const;

export const TIKTOK = {
  id: TIKTOK_ID,
  fps: TIKTOK_FPS,
  width: TIKTOK_WIDTH,
  height: TIKTOK_HEIGHT,
  durationInFrames: TIKTOK_DURATION_FRAMES,
  colors: ATELIER_COLORS,
  fonts: ATELIER_FONTS,
  copy: TIKTOK_COPY,
  audio: { voiceover: false as const },
} as const;
