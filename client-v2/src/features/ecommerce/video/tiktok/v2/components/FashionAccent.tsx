import { interpolate, useCurrentFrame } from "remotion";
import { CREANDO_MODA_V2 } from "../tiktokConfig.v2";

type FashionAccentProps = {
  label: string;
  delay?: number;
  side?: "left" | "right";
};

/** Etiqueta vertical editorial — estilo revista de moda. */
export function FashionAccent({ label, delay = 0, side = "left" }: FashionAccentProps) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame - delay, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const slide = interpolate(frame - delay, [0, 18], [side === "left" ? -24 : 24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        [side]: 56,
        top: "24%",
        transform: `translateX(${slide}px) rotate(-90deg)`,
        transformOrigin:         side === "left" ? "left center" : "right center",
        opacity,
        fontFamily: CREANDO_MODA_V2.fonts.display,
        fontSize: 24,
        fontWeight: 800,
        letterSpacing: "0.28em",
        color: "rgba(255,255,255,0.55)",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        pointerEvents: "none",
      }}
    >
      {label}
    </div>
  );
}
