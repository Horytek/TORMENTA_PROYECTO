import { Img, interpolate, useCurrentFrame } from "remotion";
import { TextReveal } from "../../../../atelier/video/components/TextReveal";
import { BRAND } from "../creandoModa.data";
import { CREANDO_MODA } from "../tiktokConfig";

type BrandLogoProps = {
  delay?: number;
  variant?: "light" | "dark";
};

/** Logo ImageKit o wordmark tipográfico. */
export function BrandLogo({ delay = 0, variant = "light" }: BrandLogoProps) {
  const frame = useCurrentFrame();
  const scale = interpolate(frame - delay, [0, 18], [0.92, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const color = variant === "light" ? CREANDO_MODA.colors.white : CREANDO_MODA.colors.ink;

  if (BRAND.logoUrl) {
    return (
      <TextReveal delay={delay} duration={18}>
        <Img
          src={BRAND.logoUrl}
          style={{
            height: 72,
            width: "auto",
            objectFit: "contain",
            transform: `scale(${scale})`,
            filter: variant === "light" ? "brightness(0) invert(1)" : undefined,
          }}
        />
      </TextReveal>
    );
  }

  return (
    <TextReveal delay={delay} duration={18}>
      <div
        style={{
          fontFamily: CREANDO_MODA.fonts.display,
          fontSize: 36,
          fontWeight: 700,
          letterSpacing: "0.12em",
          color,
          transform: `scale(${scale})`,
        }}
      >
        CREANDO MODA
      </div>
    </TextReveal>
  );
}
