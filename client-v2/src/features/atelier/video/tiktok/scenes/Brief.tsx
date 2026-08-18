import { AbsoluteFill } from "remotion";
import { ATELIER_COLORS, ATELIER_FONTS } from "../../../tokens";
import { ArtworkFrame } from "../../components/ArtworkFrame";
import { AtelierLabel } from "../../components/AtelierLabel";
import { KenBurns } from "../../components/KenBurns";
import { TextReveal } from "../../components/TextReveal";
import { DoorwayVoid } from "../assets/inkCat";
import { SafeStage } from "../components/SafeStage";
import { TIKTOK_COPY } from "../tiktokConfig";

export function Brief() {
  return (
    <AbsoluteFill style={{ background: ATELIER_COLORS.offwhite }}>
      <SafeStage style={{ justifyContent: "space-between" }}>
        <div>
          <AtelierLabel>{TIKTOK_COPY.commission}</AtelierLabel>
          <TextReveal delay={6} duration={20}>
            <div
              style={{
                marginTop: 18,
                fontFamily: ATELIER_FONTS.serif,
                fontSize: 76,
                letterSpacing: "-0.035em",
                lineHeight: 1.02,
                color: ATELIER_COLORS.ink,
                maxWidth: 820,
              }}
            >
              {TIKTOK_COPY.briefTitle}
            </div>
          </TextReveal>
          <TextReveal delay={20} duration={16}>
            <div
              style={{
                marginTop: 18,
                fontFamily: ATELIER_FONTS.sans,
                fontSize: 26,
                color: ATELIER_COLORS.stone,
              }}
            >
              {TIKTOK_COPY.briefMeta}
            </div>
          </TextReveal>
          <TextReveal delay={32} duration={16} direction="up">
            <div
              style={{
                marginTop: 28,
                fontFamily: ATELIER_FONTS.serif,
                fontSize: 30,
                fontStyle: "italic",
                color: ATELIER_COLORS.ink,
              }}
            >
              {TIKTOK_COPY.briefNote}
            </div>
          </TextReveal>
        </div>
        <ArtworkFrame width={760} height={640} pad={22}>
          <KenBurns from={1.02} to={1.08} drift={8}>
            <DoorwayVoid />
          </KenBurns>
        </ArtworkFrame>
      </SafeStage>
    </AbsoluteFill>
  );
}
