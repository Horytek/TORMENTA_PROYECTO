import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { TextReveal } from "../../../../atelier/video/components/TextReveal";
import { CREANDO_MODA } from "../tiktokConfig";

/** Cierre con URL, precio desde, y hint WhatsApp (sin número). */
export function CTASection() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const btn = spring({ frame: frame - 36, fps, config: { damping: 16, stiffness: 90 } });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: CREANDO_MODA.colors.bg,
      }}
    >
      <TextReveal delay={4} duration={22}>
        <div
          style={{
            fontFamily: CREANDO_MODA.fonts.display,
            fontSize: 64,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.02,
            color: CREANDO_MODA.colors.ink,
            maxWidth: 820,
          }}
        >
          {CREANDO_MODA.copy.concept}
        </div>
      </TextReveal>

      <TextReveal delay={18} duration={18} direction="up">
        <div
          style={{
            marginTop: 28,
            fontFamily: CREANDO_MODA.fonts.body,
            fontSize: 28,
            fontWeight: 600,
            color: CREANDO_MODA.colors.accent,
          }}
        >
          {CREANDO_MODA.copy.priceFrom}
        </div>
      </TextReveal>

      <TextReveal delay={28} duration={16}>
        <div
          style={{
            marginTop: 40,
            fontFamily: CREANDO_MODA.fonts.body,
            fontSize: 22,
            color: CREANDO_MODA.colors.muted,
            lineHeight: 1.5,
          }}
        >
          {CREANDO_MODA.copy.whatsappHint}
        </div>
      </TextReveal>

      <div
        style={{
          marginTop: 48,
          transform: `scale(${0.92 + btn * 0.08})`,
          opacity: Math.min(1, btn),
          display: "inline-flex",
          alignSelf: "flex-start",
          alignItems: "center",
          height: 64,
          padding: "0 32px",
          borderRadius: 12,
          background: CREANDO_MODA.colors.accent,
          color: CREANDO_MODA.colors.white,
          fontFamily: CREANDO_MODA.fonts.body,
          fontSize: 22,
          fontWeight: 600,
        }}
      >
        {CREANDO_MODA.copy.ctaUrl}
      </div>
    </div>
  );
}
