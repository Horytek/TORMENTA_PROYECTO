import type { CSSProperties, ReactNode } from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { VIDEO_EASE } from "../videoConfig";

type KenBurnsProps = {
  children: ReactNode;
  from?: number;
  to?: number;
  drift?: number;
  style?: CSSProperties;
};

/** Zoom lento sobre papel. El easing es el mismo del anuncio 16:9. */
export function KenBurns({
  children,
  from = 1,
  to = 1.07,
  drift = 14,
  style,
}: KenBurnsProps) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const scale = interpolate(frame, [0, durationInFrames], [from, to], {
    easing: Easing.bezier(...VIDEO_EASE),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [0, durationInFrames], [drift, -drift], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden", ...style }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `translateY(${y}px) scale(${scale})`,
          transformOrigin: "50% 42%",
        }}
      >
        {children}
      </div>
    </div>
  );
}
