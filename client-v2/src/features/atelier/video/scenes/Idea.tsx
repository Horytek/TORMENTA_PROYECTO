import { AbsoluteFill } from "remotion";
import { ATELIER_COLORS, ATELIER_FONTS } from "../../tokens";
import { ArtworkFrame } from "../components/ArtworkFrame";
import { AtelierLabel } from "../components/AtelierLabel";
import { TextReveal } from "../components/TextReveal";
import { BriefSheet } from "../assets/frames";
import { VIDEO_COPY } from "../videoConfig";

export function Idea() {
  return (
    <AbsoluteFill
      style={{
        background: ATELIER_COLORS.offwhite,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 140px",
      }}
    >
      <div style={{ maxWidth: 720 }}>
        <AtelierLabel>La idea</AtelierLabel>
        <TextReveal delay={6} duration={22}>
          <div
            style={{
              marginTop: 16,
              fontFamily: ATELIER_FONTS.serif,
              fontSize: 92,
              letterSpacing: "-0.035em",
              lineHeight: 1.02,
              color: ATELIER_COLORS.ink,
            }}
          >
            {VIDEO_COPY.briefTitle}
          </div>
        </TextReveal>
        <TextReveal delay={18} duration={16}>
          <div
            style={{
              marginTop: 20,
              fontFamily: ATELIER_FONTS.sans,
              fontSize: 28,
              color: ATELIER_COLORS.stone,
            }}
          >
            {VIDEO_COPY.briefMeta}
          </div>
        </TextReveal>
        <TextReveal delay={32} duration={16} direction="up">
          <div
            style={{
              marginTop: 36,
              fontFamily: ATELIER_FONTS.serif,
              fontSize: 32,
              fontStyle: "italic",
              color: ATELIER_COLORS.ink,
            }}
          >
            {VIDEO_COPY.briefNote}
          </div>
        </TextReveal>
      </div>
      <ArtworkFrame width={460} height={580}>
        <BriefSheet />
      </ArtworkFrame>
    </AbsoluteFill>
  );
}
