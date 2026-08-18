import { AbsoluteFill } from "remotion";
import { ATELIER_COLORS, ATELIER_FONTS } from "../../tokens";
import { AtelierLabel } from "../components/AtelierLabel";
import { TextReveal } from "../components/TextReveal";
import { VIDEO_COPY } from "../videoConfig";

export function Intro() {
  return (
    <AbsoluteFill
      style={{
        background: ATELIER_COLORS.paper,
        justifyContent: "center",
        padding: "0 140px",
      }}
    >
      <AtelierLabel>{VIDEO_COPY.wordmarkKicker}</AtelierLabel>
      <TextReveal delay={10} duration={24}>
        <div
          style={{
            marginTop: 18,
            fontFamily: ATELIER_FONTS.serif,
            fontSize: 168,
            fontWeight: 550,
            letterSpacing: "-0.035em",
            lineHeight: 0.92,
            color: ATELIER_COLORS.ink,
          }}
        >
          {VIDEO_COPY.wordmark}
        </div>
      </TextReveal>
      <TextReveal delay={28} duration={18} direction="up">
        <div
          style={{
            marginTop: 28,
            maxWidth: 640,
            fontFamily: ATELIER_FONTS.serif,
            fontSize: 42,
            fontStyle: "italic",
            color: ATELIER_COLORS.ink,
            opacity: 0.72,
          }}
        >
          Un estudio para encargar el trazo.
        </div>
      </TextReveal>
    </AbsoluteFill>
  );
}
