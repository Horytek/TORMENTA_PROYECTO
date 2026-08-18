import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { ATELIER_COLORS, ATELIER_FONTS } from "../../../tokens";
import { AtelierLabel } from "../../components/AtelierLabel";
import { TextReveal } from "../../components/TextReveal";
import { InkCatLine } from "../assets/inkCat";
import { SafeStage } from "../components/SafeStage";
import { TIKTOK_COPY, TIKTOK_SCENE_FRAMES } from "../tiktokConfig";

export function Ink() {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [6, TIKTOK_SCENE_FRAMES.ink - 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: ATELIER_COLORS.offwhite }}>
      <AbsoluteFill
        style={{
          padding: "280px 80px 340px 56px",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            padding: 22,
            background: ATELIER_COLORS.paper,
            boxShadow: "0 28px 70px rgba(44, 40, 36, 0.14)",
          }}
        >
          <InkCatLine progress={progress} />
        </div>
      </AbsoluteFill>
      <SafeStage>
        <div>
          <AtelierLabel>{TIKTOK_COPY.inkLabel}</AtelierLabel>
          <TextReveal delay={4} duration={16}>
            <div
              style={{
                marginTop: 10,
                fontFamily: ATELIER_FONTS.serif,
                fontSize: 42,
                letterSpacing: "-0.03em",
                color: ATELIER_COLORS.ink,
              }}
            >
              {TIKTOK_COPY.inkTitle}
            </div>
          </TextReveal>
        </div>
      </SafeStage>
    </AbsoluteFill>
  );
}
