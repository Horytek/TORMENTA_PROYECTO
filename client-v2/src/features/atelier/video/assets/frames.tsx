/**
 * Marcos del DS — no fotos de personas ni stock genérico.
 * Tinta, papel, trazo. Usados en el anuncio Remotion y como poster.
 */
import { ATELIER_COLORS } from "../../tokens";

const ink = ATELIER_COLORS.ink;
const paper = ATELIER_COLORS.paper;
const off = ATELIER_COLORS.offwhite;
const accent = ATELIER_COLORS.accent;
const stone = ATELIER_COLORS.stone;

type FrameProps = {
  width?: number | string;
  height?: number | string;
};

const svg = {
  width: "100%",
  height: "100%",
  display: "block",
} as const;

/** Papel con mancha de pigmento. */
export function PaperWash({ width = "100%", height = "100%" }: FrameProps) {
  return (
    <svg viewBox="0 0 400 500" width={width} height={height} style={svg} aria-hidden>
      <rect width="400" height="500" fill={paper} />
      <ellipse cx="210" cy="240" rx="150" ry="170" fill={off} />
      <ellipse cx="120" cy="390" rx="90" ry="50" fill={accent} opacity="0.12" />
      <ellipse cx="280" cy="80" rx="70" ry="40" fill={ink} opacity="0.04" />
    </svg>
  );
}

/** Construcción a lápiz: óvalo, ejes, sin cara fotográfica. */
export function LinePortrait({
  width = "100%",
  height = "100%",
  progress = 1,
}: FrameProps & { progress?: number }) {
  const length = 1400;
  const offset = length * (1 - Math.min(1, Math.max(0, progress)));
  return (
    <svg viewBox="0 0 400 500" width={width} height={height} style={svg} aria-hidden>
      <rect width="400" height="500" fill={off} />
      <g
        fill="none"
        stroke={ink}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={length}
        strokeDashoffset={offset}
      >
        <ellipse cx="200" cy="198" rx="78" ry="96" />
        <line x1="200" y1="102" x2="200" y2="360" />
        <line x1="122" y1="210" x2="278" y2="210" />
        <path d="M158 188 C168 182 178 182 188 188" />
        <path d="M212 188 C222 182 232 182 242 188" />
        <path d="M176 248 C192 262 208 262 224 248" />
        <path d="M150 292 C200 340 250 340 270 300" />
        <path d="M168 320 C200 390 240 410 248 360" />
      </g>
      <ellipse cx="200" cy="430" rx="70" ry="8" fill={stone} opacity="0.2" />
    </svg>
  );
}

/** Obra: el mismo retrato, ya con pigmento. */
export function WashPortrait({ width = "100%", height = "100%" }: FrameProps) {
  return (
    <svg viewBox="0 0 400 500" width={width} height={height} style={svg} aria-hidden>
      <rect width="400" height="500" fill={paper} />
      <ellipse cx="200" cy="310" rx="130" ry="90" fill={accent} opacity="0.1" />
      <ellipse cx="200" cy="200" rx="92" ry="112" fill="#c4b8a8" opacity="0.55" />
      <ellipse cx="200" cy="198" rx="78" ry="96" fill="#d9cfc2" />
      <ellipse cx="168" cy="186" rx="14" ry="8" fill={ink} opacity="0.35" />
      <ellipse cx="230" cy="186" rx="14" ry="8" fill={ink} opacity="0.35" />
      <path d="M176 248 C192 266 208 266 224 248" fill="none" stroke={ink} strokeWidth="1.6" opacity="0.45" />
      <path d="M150 300 C200 360 255 350 268 304" fill="#b7a090" opacity="0.7" />
      <ellipse cx="118" cy="400" rx="80" ry="36" fill={accent} opacity="0.18" />
      <path
        d="M40 460 C90 420 140 470 200 440 C270 405 330 455 380 430"
        fill="none"
        stroke={ink}
        strokeWidth="0.8"
        opacity="0.25"
      />
    </svg>
  );
}

/** Hoja de brief: tipografía como objeto, no UI de formulario. */
export function BriefSheet({ width = "100%", height = "100%" }: FrameProps) {
  return (
    <svg viewBox="0 0 400 500" width={width} height={height} style={svg} aria-hidden>
      <rect width="400" height="500" fill={off} />
      <rect x="36" y="40" width="80" height="6" fill={accent} />
      <rect x="36" y="80" width="240" height="10" fill={ink} opacity="0.85" />
      <rect x="36" y="102" width="160" height="10" fill={ink} opacity="0.45" />
      <rect x="36" y="160" width="328" height="4" fill={ink} opacity="0.12" />
      <rect x="36" y="184" width="300" height="4" fill={ink} opacity="0.12" />
      <rect x="36" y="208" width="310" height="4" fill={ink} opacity="0.12" />
      <rect x="36" y="232" width="220" height="4" fill={ink} opacity="0.12" />
      <rect x="36" y="280" width="328" height="1" fill={ink} opacity="0.1" />
      <circle cx="52" cy="340" r="8" fill="none" stroke={ink} strokeWidth="1.2" />
      <rect x="72" y="334" width="140" height="6" fill={ink} opacity="0.35" />
      <circle cx="52" cy="376" r="8" fill={accent} />
      <rect x="72" y="370" width="180" height="6" fill={ink} opacity="0.55" />
    </svg>
  );
}
