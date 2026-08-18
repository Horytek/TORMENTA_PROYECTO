import { AbsoluteFill } from "remotion";
import { ATELIER_COLORS, ATELIER_FONTS } from "../../tokens";
import { TextReveal } from "../components/TextReveal";
import { VIDEO_COPY } from "../videoConfig";

export function Outro() {
  return (
    <AbsoluteFill
      style={{
        background: ATELIER_COLORS.paper,
        justifyContent: "center",
        padding: "0 140px",
      }}
    >
      <TextReveal delay={4} duration={22}>
        <div
          style={{
            fontFamily: ATELIER_FONTS.serif,
            fontSize: 92,
            letterSpacing: "-0.035em",
            lineHeight: 1.02,
            color: ATELIER_COLORS.ink,
            maxWidth: 1200,
          }}
        >
          {VIDEO_COPY.reveal}
        </div>
      </TextReveal>
      <TextReveal delay={22} duration={18} direction="up">
        <div
          style={{
            marginTop: 28,
            fontFamily: ATELIER_FONTS.serif,
            fontSize: 40,
            fontStyle: "italic",
            color: ATELIER_COLORS.ink,
          }}
        >
          {VIDEO_COPY.tagline}
        </div>
      </TextReveal>
      <TextReveal delay={40} duration={16}>
        <div
          style={{
            marginTop: 56,
            display: "inline-flex",
            alignItems: "center",
            height: 64,
            padding: "0 32px",
            background: ATELIER_COLORS.accent,
            color: ATELIER_COLORS.accentInk,
            fontFamily: ATELIER_FONTS.sans,
            fontSize: 22,
            fontWeight: 500,
          }}
        >
          {VIDEO_COPY.cta}
        </div>
      </TextReveal>
    </AbsoluteFill>
  );
}
