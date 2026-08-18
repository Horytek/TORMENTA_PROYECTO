import { AbsoluteFill } from "remotion";
import { ATELIER_COLORS, ATELIER_FONTS } from "../../tokens";
import { ArtworkFrame } from "../components/ArtworkFrame";
import { AtelierLabel } from "../components/AtelierLabel";
import { ImageReveal } from "../components/ImageReveal";
import { TextReveal } from "../components/TextReveal";
import { WashPortrait } from "../assets/frames";
import { VIDEO_COPY } from "../videoConfig";

export function Artwork() {
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
      <ArtworkFrame width={520} height={680}>
        <ImageReveal delay={4} duration={36}>
          <WashPortrait />
        </ImageReveal>
      </ArtworkFrame>
      <div style={{ maxWidth: 680 }}>
        <AtelierLabel>La obra</AtelierLabel>
        <TextReveal delay={18} duration={22}>
          <div
            style={{
              marginTop: 16,
              fontFamily: ATELIER_FONTS.serif,
              fontSize: 80,
              letterSpacing: "-0.035em",
              lineHeight: 1.05,
              color: ATELIER_COLORS.ink,
            }}
          >
            {VIDEO_COPY.obraTitle}
          </div>
        </TextReveal>
        <TextReveal delay={36} duration={16} direction="up">
          <div
            style={{
              marginTop: 28,
              fontFamily: ATELIER_FONTS.serif,
              fontSize: 34,
              fontStyle: "italic",
              color: ATELIER_COLORS.ink,
            }}
          >
            El pigmento cubre el lápiz.
          </div>
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
}
