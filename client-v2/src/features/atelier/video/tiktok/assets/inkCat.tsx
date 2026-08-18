/**
 * Obra del corto TikTok: umbral + gato a tinta.
 * Silueta legible a tamaño de teléfono. Construcción → pigmento, sin foto.
 */
import { ATELIER_COLORS } from "../../../tokens";

const ink = ATELIER_COLORS.ink;
const paper = ATELIER_COLORS.paper;
const off = ATELIER_COLORS.offwhite;
const accent = ATELIER_COLORS.accent;
const stone = ATELIER_COLORS.stone;

const svg = {
  width: "100%",
  height: "100%",
  display: "block",
} as const;

function localProgress(progress: number, from: number, to: number) {
  return Math.min(1, Math.max(0, (progress - from) / Math.max(0.001, to - from)));
}

function Drawn({
  d,
  progress,
  from,
  to,
  length,
  strokeWidth = 1.7,
  opacity = 1,
}: {
  d: string;
  progress: number;
  from: number;
  to: number;
  length: number;
  strokeWidth?: number;
  opacity?: number;
}) {
  const t = localProgress(progress, from, to);
  return (
    <path
      d={d}
      fill="none"
      stroke={ink}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={length}
      strokeDashoffset={length * (1 - t)}
      opacity={opacity}
    />
  );
}

/** Solo el vano: papel, jambas, umbral, luna. */
export function DoorwayVoid() {
  return (
    <svg viewBox="0 0 480 800" width="100%" height="100%" style={svg} preserveAspectRatio="xMidYMin slice" aria-hidden>
      <rect width="480" height="800" fill={paper} />
      <ellipse cx="240" cy="210" rx="86" ry="86" fill={accent} opacity="0.14" />
      <rect x="118" y="108" width="244" height="508" fill={off} />
      <path d="M118 108 L118 616 L362 616 L362 108 Z" fill="none" stroke={ink} strokeWidth="1.5" />
      <line x1="56" y1="616" x2="424" y2="616" stroke={ink} strokeWidth="1.3" />
      <rect x="118" y="616" width="244" height="14" fill={ink} opacity="0.08" />
    </svg>
  );
}

/** Construcción a tinta: el gato se dibuja por tramos. */
export function InkCatLine({ progress = 1 }: { progress?: number }) {
  return (
    <svg viewBox="0 0 480 800" width="100%" height="100%" style={svg} aria-hidden>
      <rect width="480" height="800" fill={off} />
      <ellipse cx="240" cy="208" rx="72" ry="72" fill={accent} opacity="0.1" />
      <g>
        <Drawn
          d="M118 108 L118 616 L362 616 L362 108 Z"
          progress={progress}
          from={0}
          to={0.2}
          length={1500}
          strokeWidth={1.4}
          opacity={0.8}
        />
        <Drawn
          d="M56 616 L424 616"
          progress={progress}
          from={0.06}
          to={0.24}
          length={380}
          strokeWidth={1.25}
        />
        <Drawn
          d="M196 430 C176 400 182 352 214 328 C236 312 268 318 284 346 C300 376 292 418 266 440"
          progress={progress}
          from={0.18}
          to={0.48}
          length={480}
          strokeWidth={1.85}
        />
        <Drawn
          d="M226 338 L214 292 L248 324"
          progress={progress}
          from={0.36}
          to={0.52}
          length={130}
          strokeWidth={1.6}
        />
        <Drawn
          d="M258 328 L292 286 L280 340"
          progress={progress}
          from={0.4}
          to={0.56}
          length={140}
          strokeWidth={1.6}
        />
        <Drawn
          d="M176 520 A 62 96 0 1 1 300 520 A 62 96 0 1 1 176 520"
          progress={progress}
          from={0.46}
          to={0.78}
          length={700}
          strokeWidth={1.85}
        />
        <Drawn
          d="M174 500 C108 478 92 398 142 358 C172 336 196 368 176 404 C160 438 172 472 200 492"
          progress={progress}
          from={0.62}
          to={0.86}
          length={600}
          strokeWidth={1.65}
        />
        <Drawn
          d="M204 598 L204 616 M248 602 L248 616"
          progress={progress}
          from={0.74}
          to={0.88}
          length={80}
          strokeWidth={1.5}
        />
        <Drawn
          d="M256 352 C266 348 278 350 284 358"
          progress={progress}
          from={0.82}
          to={0.92}
          length={70}
          strokeWidth={1.35}
          opacity={0.75}
        />
        <Drawn
          d="M232 368 C244 378 262 378 276 366"
          progress={progress}
          from={0.86}
          to={0.96}
          length={90}
          strokeWidth={1.3}
          opacity={0.7}
        />
        <Drawn
          d="M286 360 L330 346 M288 370 L334 370 M286 380 L326 394"
          progress={progress}
          from={0.9}
          to={1}
          length={220}
          strokeWidth={0.95}
          opacity={0.42}
        />
      </g>
      <ellipse cx="240" cy="690" rx="86" ry="8" fill={stone} opacity={0.2} />
    </svg>
  );
}

/** Obra terminada: silueta de tinta en el umbral, luna de acento. */
export function InkCatWash() {
  return (
    <svg viewBox="0 0 480 800" width="100%" height="100%" style={svg} aria-hidden>
      <rect width="480" height="800" fill={paper} />
      <rect x="118" y="108" width="244" height="508" fill="#ece6dc" />
      <ellipse cx="240" cy="208" rx="78" ry="78" fill={accent} opacity="0.22" />
      <ellipse cx="240" cy="208" rx="28" ry="28" fill={off} opacity="0.7" />
      <path d="M118 108 L118 616 L362 616 L362 108 Z" fill="none" stroke={ink} strokeWidth="1.4" opacity="0.45" />
      <line x1="56" y1="616" x2="424" y2="616" stroke={ink} strokeWidth="1.2" opacity="0.55" />
      <ellipse cx="238" cy="522" rx="64" ry="98" fill={ink} />
      <ellipse cx="268" cy="478" rx="40" ry="58" fill={ink} />
      <ellipse cx="252" cy="368" rx="46" ry="44" fill={ink} />
      <path d="M228 342 L216 292 L254 326 Z" fill={ink} />
      <path d="M264 330 L304 284 L288 344 Z" fill={ink} />
      <path
        d="M174 500 C108 478 92 398 142 358 C172 336 196 368 176 404 C160 438 172 472 200 492"
        fill={ink}
      />
      <rect x="214" y="600" width="14" height="28" rx="7" fill={ink} />
      <rect x="252" y="602" width="14" height="26" rx="7" fill={ink} />
      <ellipse cx="262" cy="360" rx="5" ry="3.4" fill={off} opacity="0.45" />
      <ellipse cx="300" cy="540" rx="64" ry="36" fill={accent} opacity="0.14" />
      <rect x="118" y="616" width="244" height="14" fill={ink} opacity="0.1" />
    </svg>
  );
}
