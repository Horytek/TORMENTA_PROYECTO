/**
 * Config del anuncio 16:9 P1. El corto 9:16 TikTok vive en ./tiktok.
 * Audio/VO apagados.
 *
 * Paleta y serif alineadas al DS (tokens.ts). Import relativo: Remotion CLI no usa alias @/.
 */
import { ATELIER_COLORS, ATELIER_FONTS } from "../tokens";
import { ATELIER_COPY } from "../copy";

export const VIDEO_FPS = 30;
export const VIDEO_WIDTH = 1920;
export const VIDEO_HEIGHT = 1080;
export const VIDEO_ID = "HorytekAd";

/** Duración de cada escena en frames (30 fps). Total ~37 s. */
export const SCENE_FRAMES = {
  intro: 120,
  idea: 150,
  artist: 150,
  sketch: 180,
  creation: 180,
  artwork: 180,
  outro: 150,
} as const;

export type SceneId = keyof typeof SCENE_FRAMES;

export const SCENE_ORDER = [
  "intro",
  "idea",
  "artist",
  "sketch",
  "creation",
  "artwork",
  "outro",
] as const satisfies readonly SceneId[];

export type SceneSpan = { from: number; duration: number };

export function sceneSpans(): Record<SceneId, SceneSpan> & { total: number } {
  let from = 0;
  const map = {} as Record<SceneId, SceneSpan>;
  for (const id of SCENE_ORDER) {
    const duration = SCENE_FRAMES[id];
    map[id] = { from, duration };
    from += duration;
  }
  return { ...map, total: from };
}

export const VIDEO_DURATION_FRAMES = sceneSpans().total;

export const VIDEO_COPY = {
  wordmarkKicker: "HORYTEK",
  wordmark: "ATELIER",
  briefTitle: "Retrato de Coco",
  briefMeta: "Acuarela · A4",
  briefNote: "Una idea, todavía sin trazo.",
  artistName: "Luna Ink",
  artistMark: "Estudio · acuarela",
  chatArtist: "El boceto está listo.",
  chatClient: "El trazo es el que buscaba.",
  commission: "Encargo #184",
  obraTitle: "Coco, en acuarela",
  reveal: ATELIER_COPY.ideaExists,
  tagline: ATELIER_COPY.taglineFull,
  cta: ATELIER_COPY.ctaCommission,
} as const;

export const VIDEO = {
  id: VIDEO_ID,
  fps: VIDEO_FPS,
  width: VIDEO_WIDTH,
  height: VIDEO_HEIGHT,
  durationInFrames: VIDEO_DURATION_FRAMES,
  colors: ATELIER_COLORS,
  fonts: ATELIER_FONTS,
  copy: VIDEO_COPY,
  audio: { voiceover: false as const },
} as const;

export const VIDEO_EASE = [0.22, 1, 0.36, 1] as const;
