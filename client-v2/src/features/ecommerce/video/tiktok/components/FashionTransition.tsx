import type { ReactNode } from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { VIDEO_EASE } from "../../../../atelier/video/videoConfig";

type FashionTransitionProps = {
  children: ReactNode;
  mode?: "whip" | "zoom" | "crossfade";
  delay?: number;
  duration?: number;
};

/** Transición reutilizable entre cortes de moda. */
export function FashionTransition({
  children,
  mode = "crossfade",
  delay = 0,
  duration = 12,
}: FashionTransitionProps) {
  const frame = useCurrentFrame();
  const t = interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(VIDEO_EASE[0], VIDEO_EASE[1], VIDEO_EASE[2], VIDEO_EASE[3]),
  });

  if (mode === "crossfade") {
    return <div style={{ width: "100%", height: "100%", opacity: t }}>{children}</div>;
  }

  if (mode === "zoom") {
    const scale = interpolate(t, [0, 1], [1.12, 1]);
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${scale})`,
          opacity: t,
        }}
      >
        {children}
      </div>
    );
  }

  const x = interpolate(t, [0, 1], [80, 0]);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        transform: `translateX(${x}px)`,
        opacity: t,
      }}
    >
      {children}
    </div>
  );
}
