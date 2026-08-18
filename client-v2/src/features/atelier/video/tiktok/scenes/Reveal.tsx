import { AbsoluteFill } from "remotion";
import { ATELIER_COLORS, ATELIER_FONTS } from "../../../tokens";
import { AtelierLabel } from "../../components/AtelierLabel";
import { ImageReveal } from "../../components/ImageReveal";
import { KenBurns } from "../../components/KenBurns";
import { Signature } from "../../components/Signature";
import { TextReveal } from "../../components/TextReveal";
import { InkCatWash } from "../assets/inkCat";
import { SafeStage } from "../components/SafeStage";
import { TIKTOK_COPY } from "../tiktokConfig";

export function Reveal() {
  return (
    <AbsoluteFill style={{ background: ATELIER_COLORS.offwhite }}>
      <AbsoluteFill style={{ padding: "172px 80px 500px 56px" }}>
        <div
          style={{
            width: "100%",
            height: "100%",
            padding: 22,
            background: ATELIER_COLORS.paper,
            boxShadow: "0 28px 70px rgba(44, 40, 36, 0.14)",
          }}
        >
          <KenBurns from={1.02} to={1.1} drift={12}>
            <ImageReveal delay={2} duration={34} direction="up">
              <InkCatWash />
            </ImageReveal>
          </KenBurns>
        </div>
      </AbsoluteFill>
      <SafeStage style={{ justifyContent: "flex-end" }}>
        <AtelierLabel>{TIKTOK_COPY.obraLabel}</AtelierLabel>
        <TextReveal delay={16} duration={20}>
          <div
            style={{
              marginTop: 10,
              fontFamily: ATELIER_FONTS.serif,
              fontSize: 48,
              letterSpacing: "-0.035em",
              lineHeight: 1.05,
              color: ATELIER_COLORS.ink,
            }}
          >
            {TIKTOK_COPY.obraTitle}
          </div>
        </TextReveal>
        <TextReveal delay={26} duration={14} direction="up">
          <div
            style={{
              marginTop: 10,
              fontFamily: ATELIER_FONTS.serif,
              fontSize: 26,
              fontStyle: "italic",
              color: ATELIER_COLORS.ink,
              opacity: 0.75,
            }}
          >
            {TIKTOK_COPY.obraNote}
          </div>
        </TextReveal>
        <TextReveal delay={30} duration={16} direction="up">
          <div style={{ marginTop: 18 }}>
            <Signature name={TIKTOK_COPY.artistName} mark={TIKTOK_COPY.artistMark} />
          </div>
        </TextReveal>
      </SafeStage>
    </AbsoluteFill>
  );
}
