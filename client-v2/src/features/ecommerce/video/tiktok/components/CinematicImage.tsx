import type { CSSProperties } from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { KenBurns } from "../../../../atelier/video/components/KenBurns";

type CinematicImageProps = {
  src: string;
  objectPosition?: string;
  overlay?: number;
  blurDissolve?: boolean;
  style?: CSSProperties;
};

/** Imagen editorial con Ken Burns y overlay oscuro. */
export function CinematicImage({
  src,
  objectPosition = "50% 35%",
  overlay = 0.28,
  blurDissolve = false,
  style,
}: CinematicImageProps) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const blur = blurDissolve
    ? interpolate(frame, [0, durationInFrames * 0.35], [12, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  const opacity = blurDissolve
    ? interpolate(frame, [0, durationInFrames * 0.25], [0.55, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;

  return (
    <AbsoluteFill style={style}>
      <KenBurns from={1.04} to={1.1} drift={10}>
        <Img
          src={src}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
            opacity,
          }}
        />
      </KenBurns>
      <AbsoluteFill
        style={{
          background: `rgba(28, 25, 23, ${overlay})`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(28,25,23,0.35) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
}
