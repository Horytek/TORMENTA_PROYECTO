import { Easing, interpolate, useCurrentFrame } from "remotion";
import type { ReactNode } from "react";
import { VIDEO_EASE } from "../videoConfig";

type TextRevealProps = {
  children: ReactNode;
  delay?: number;
  duration?: number;
  /** Máscara, no fade. */
  direction?: "left" | "up";
};

export function TextReveal({
  children,
  delay = 0,
  duration = 20,
  direction = "left",
}: TextRevealProps) {
  const frame = useCurrentFrame();
  const t = interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...VIDEO_EASE),
  });
  const rest = (1 - t) * 100;
  const clipPath =
    direction === "up" ? `inset(${rest}% 0 0 0)` : `inset(0 ${rest}% 0 0)`;

  return <div style={{ clipPath }}>{children}</div>;
}
