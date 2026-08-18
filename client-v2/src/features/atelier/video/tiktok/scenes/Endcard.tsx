import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ATELIER_COLORS, ATELIER_FONTS } from "../../../tokens";
import { AtelierLabel } from "../../components/AtelierLabel";
import { TextReveal } from "../../components/TextReveal";
import { SafeStage } from "../components/SafeStage";
import { TIKTOK_COPY } from "../tiktokConfig";

export function Endcard() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cta = spring({
    frame: Math.max(0, frame - 42),
    fps,
    config: { damping: 16, stiffness: 90, mass: 0.7 },
  });

  return (
    <AbsoluteFill style={{ background: ATELIER_COLORS.paper }}>
      <SafeStage style={{ justifyContent: "center", alignItems: "flex-start" }}>
        <AtelierLabel>{TIKTOK_COPY.wordmarkKicker}</AtelierLabel>
        <TextReveal delay={6} duration={22}>
          <div
            style={{
              marginTop: 10,
              fontFamily: ATELIER_FONTS.serif,
              fontSize: 118,
              fontWeight: 550,
              letterSpacing: "-0.04em",
              lineHeight: 0.92,
              color: ATELIER_COLORS.ink,
            }}
          >
            {TIKTOK_COPY.wordmark}
          </div>
        </TextReveal>
        <TextReveal delay={24} duration={18} direction="up">
          <div
            style={{
              marginTop: 28,
              fontFamily: ATELIER_FONTS.serif,
              fontSize: 36,
              fontStyle: "italic",
              lineHeight: 1.25,
              color: ATELIER_COLORS.ink,
              maxWidth: 720,
            }}
          >
            {TIKTOK_COPY.reveal}
          </div>
        </TextReveal>
        <TextReveal delay={36} duration={14}>
          <div
            style={{
              marginTop: 14,
              fontFamily: ATELIER_FONTS.sans,
              fontSize: 22,
              color: ATELIER_COLORS.stone,
            }}
          >
            {TIKTOK_COPY.tagline}
          </div>
        </TextReveal>
        <div
          style={{
            marginTop: 56,
            transform: `scale(${0.92 + cta * 0.08})`,
            opacity: Math.min(1, cta),
            display: "inline-flex",
            alignItems: "center",
            height: 72,
            padding: "0 36px",
            background: ATELIER_COLORS.accent,
            color: ATELIER_COLORS.accentInk,
            fontFamily: ATELIER_FONTS.sans,
            fontSize: 24,
            fontWeight: 500,
          }}
        >
          {TIKTOK_COPY.cta}
        </div>
      </SafeStage>
    </AbsoluteFill>
  );
}
