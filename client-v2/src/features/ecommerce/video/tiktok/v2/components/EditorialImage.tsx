import type { CSSProperties } from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { KenBurns } from "../../../../../atelier/video/components/KenBurns";
import { CREANDO_MODA_V2 } from "../tiktokConfig.v2";

type EditorialImageProps = {
  src: string;
  objectPosition?: string;
  /** Ken Burns scale range */
  from?: number;
  to?: number;
  drift?: number;
  /** Oscurecimiento base 0–1 */
  overlay?: number;
  /** Tinte duotone magenta sutil */
  duotone?: boolean;
  /** Barra vertical de acento a la izquierda */
  accentBar?: boolean;
  style?: CSSProperties;
  /** Zoom extra al inicio (hook) */
  impactZoom?: boolean;
};

/** Imagen editorial full-bleed: Ken Burns + viñeta + duotone de marca. */
export function EditorialImage({
  src,
  objectPosition = "50% 35%",
  from = 1.08,
  to = 1.16,
  drift = 16,
  overlay = 0.22,
  duotone = true,
  accentBar = false,
  style,
  impactZoom = false,
}: EditorialImageProps) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const impactScale = impactZoom
    ? interpolate(frame, [0, durationInFrames], [1.12, 1.0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;

  return (
    <AbsoluteFill style={style}>
      <KenBurns from={from * impactScale} to={to} drift={drift}>
        <Img
          src={src}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition,
          }}
        />
      </KenBurns>

      {duotone ? (
        <AbsoluteFill
          style={{
            background: `linear-gradient(135deg, rgba(190,24,93,0.18) 0%, transparent 55%, rgba(28,25,23,0.35) 100%)`,
            mixBlendMode: "multiply",
            pointerEvents: "none",
          }}
        />
      ) : null}

      <AbsoluteFill
        style={{
          background: `rgba(28, 25, 23, ${overlay})`,
          pointerEvents: "none",
        }}
      />

      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 90% 80% at 50% 45%, transparent 35%, rgba(28,25,23,0.45) 100%)",
          pointerEvents: "none",
        }}
      />

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to top, rgba(28,25,23,0.65) 0%, rgba(28,25,23,0.12) 42%, transparent 68%)",
          pointerEvents: "none",
        }}
      />

      {accentBar ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "18%",
            width: 6,
            height: "38%",
            background: CREANDO_MODA_V2.colors.accent,
            boxShadow: "0 0 32px rgba(190,24,93,0.55)",
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
}
