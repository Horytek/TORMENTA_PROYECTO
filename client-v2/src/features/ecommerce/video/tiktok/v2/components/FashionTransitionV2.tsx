import type { ReactNode } from "react";

import { Easing, interpolate, useCurrentFrame } from "remotion";

import { CREANDO_MODA_V2 } from "../tiktokConfig.v2";

type FashionTransitionV2Props = {
  children: ReactNode;
  mode?: "maskReveal" | "parallaxSlide" | "blurFocus" | "morphScale";
  delay?: number;
  duration?: number;
};

/** Transiciones v2 — sin fade a opacidad 0 (evita frames negros). */
export function FashionTransitionV2({
  children,
  mode = "morphScale",
  delay = 0,
  duration = 14,
}: FashionTransitionV2Props) {
  const frame = useCurrentFrame();
  const t = interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...CREANDO_MODA_V2.ease),
  });

  if (mode === "maskReveal") {
    const clip = interpolate(t, [0, 1], [100, 0]);
    return (
      <div style={{ width: "100%", height: "100%", clipPath: `inset(${clip}% 0 0 0)` }}>
        {children}
      </div>
    );
  }

  if (mode === "parallaxSlide") {
    const x = interpolate(t, [0, 1], [80, 0]);
    const opacity = interpolate(t, [0, 0.2, 1], [0.75, 1, 1]);
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `translateX(${x}px)`,
          opacity,
        }}
      >
        {children}
      </div>
    );
  }

  if (mode === "blurFocus") {
    const blur = interpolate(t, [0, 1], [10, 0]);
    const opacity = interpolate(t, [0, 0.25, 1], [0.8, 0.95, 1]);
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          filter: `blur(${blur}px)`,
          opacity,
        }}
      >
        {children}
      </div>
    );
  }

  const scale = interpolate(t, [0, 1], [1.14, 1]);
  const opacity = interpolate(t, [0, 0.18, 1], [0.82, 1, 1]);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      {children}
    </div>
  );
}
