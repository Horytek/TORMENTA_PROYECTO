import { AbsoluteFill } from "remotion";
import { ATELIER_COLORS, ATELIER_FONTS } from "../../tokens";
import { ArtworkFrame } from "../components/ArtworkFrame";
import { AtelierLabel } from "../components/AtelierLabel";
import { Signature } from "../components/Signature";
import { TextReveal } from "../components/TextReveal";
import { PaperWash } from "../assets/frames";
import { VIDEO_COPY } from "../videoConfig";

export function Artist() {
  return (
    <AbsoluteFill
      style={{
        background: ATELIER_COLORS.paper,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 140px",
      }}
    >
      <ArtworkFrame width={480} height={620}>
        <PaperWash />
      </ArtworkFrame>
      <div style={{ maxWidth: 680 }}>
        <AtelierLabel>El artista</AtelierLabel>
        <TextReveal delay={8} duration={20}>
          <div style={{ marginTop: 28 }}>
            <Signature name={VIDEO_COPY.artistName} mark={VIDEO_COPY.artistMark} />
          </div>
        </TextReveal>
        <TextReveal delay={24} duration={18} direction="up">
          <div
            style={{
              marginTop: 40,
              fontFamily: ATELIER_FONTS.serif,
              fontSize: 40,
              lineHeight: 1.25,
              color: ATELIER_COLORS.ink,
              maxWidth: 520,
            }}
          >
            El papel espera. El encargo tiene nombre.
          </div>
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
}
