import type { CSSProperties, ReactNode } from "react";

import { spring, useCurrentFrame, useVideoConfig } from "remotion";

import { TextReveal } from "../../../../../atelier/video/components/TextReveal";

import { CREANDO_MODA_V2 } from "../tiktokConfig.v2";

const READABLE_SHADOW =
  "0 2px 4px rgba(0,0,0,0.85), 0 6px 24px rgba(0,0,0,0.55), 0 0 60px rgba(0,0,0,0.35)";

type TypographyHeroProps = {
  children: ReactNode;
  delay?: number;
  size?: number;
  align?: "left" | "center";
  color?: string;
  style?: CSSProperties;
};

/** Hero tipográfico grande con sombra de lectura reforzada. */
export function TypographyHero({
  children,
  delay = 0,
  size = CREANDO_MODA_V2.type.hero,
  align = "center",
  color = CREANDO_MODA_V2.colors.white,
  style,
}: TypographyHeroProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({
    frame: frame - delay,
    fps,
    config: { damping: 16, stiffness: 200, mass: 0.55 },
  });

  return (
    <TextReveal delay={delay} duration={20} direction="up">
      <div
        style={{
          fontFamily: CREANDO_MODA_V2.fonts.display,
          fontSize: size,
          fontWeight: 800,
          lineHeight: 1.04,
          letterSpacing: "0.03em",
          textTransform: "uppercase",
          textAlign: align,
          color,
          textShadow: READABLE_SHADOW,
          transform: `scale(${0.9 + pop * 0.1}) translateY(${(1 - pop) * 24}px)`,
          ...style,
        }}
      >
        {children}
      </div>
    </TextReveal>
  );
}
