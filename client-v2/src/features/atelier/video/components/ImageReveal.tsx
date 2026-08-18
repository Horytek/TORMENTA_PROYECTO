import type { ReactNode } from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { VIDEO_EASE } from "../videoConfig";

type ImageRevealProps = {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: "left" | "up";
};

/** Revela con máscara (wipe), no con fade. */
export function ImageReveal({
  children,
  delay = 0,
  duration = 28,
  direction = "left",
}: ImageRevealProps) {
  const frame = useCurrentFrame();
  const t = interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...VIDEO_EASE),
  });
  const rest = (1 - t) * 100;
  const clipPath =
    direction === "up" ? `inset(${rest}% 0 0 0)` : `inset(0 ${rest}% 0 0)`;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        clipPath,
      }}
    >
      {children}
    </div>
  );
}
