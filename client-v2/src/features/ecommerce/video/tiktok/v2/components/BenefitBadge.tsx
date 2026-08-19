import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

import { CREANDO_MODA_V2 } from "../tiktokConfig.v2";

type BenefitBadgeProps = {
  label: string;
  delay?: number;
  accent?: boolean;
  size?: "md" | "lg";
};

/** Sticker de beneficio — alto contraste y legible en móvil. */
export function BenefitBadge({
  label,
  delay = 0,
  accent = false,
  size = "lg",
}: BenefitBadgeProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, stiffness: 180, mass: 0.6 },
  });
  const opacity = interpolate(frame - delay, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fontSize = size === "lg" ? 30 : 26;
  const padding = size === "lg" ? "14px 26px" : "12px 22px";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding,
        borderRadius: 999,
        background: accent
          ? `linear-gradient(135deg, ${CREANDO_MODA_V2.colors.accent} 0%, ${CREANDO_MODA_V2.colors.accentDark} 100%)`
          : "rgba(255, 255, 255, 0.96)",
        color: accent ? CREANDO_MODA_V2.colors.white : CREANDO_MODA_V2.colors.ink,
        fontFamily: CREANDO_MODA_V2.fonts.body,
        fontSize,
        fontWeight: 700,
        letterSpacing: "0.03em",
        boxShadow: accent
          ? "0 10px 32px rgba(190, 24, 93, 0.45), inset 0 1px 0 rgba(255,255,255,0.2)"
          : "0 10px 32px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255,255,255,0.8)",
        border: accent ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(28,25,23,0.08)",
        transform: `scale(${pop}) translateY(${(1 - pop) * 16}px)`,
        opacity,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </div>
  );
}
