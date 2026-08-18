import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { ATELIER_COLORS, ATELIER_FONTS } from "../../../tokens";
import { KenBurns } from "../../components/KenBurns";
import { TextReveal } from "../../components/TextReveal";
import { DoorwayVoid } from "../assets/inkCat";
import { SafeStage } from "../components/SafeStage";
import { TIKTOK_COPY } from "../tiktokConfig";

export function Hook() {
  const frame = useCurrentFrame();
  const line = interpolate(frame, [6, 32], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: ATELIER_COLORS.paper }}>
      <AbsoluteFill style={{ height: "58%", overflow: "hidden", opacity: 0.72 }}>
        <KenBurns from={1.12} to={1.2} drift={8}>
          <DoorwayVoid />
        </KenBurns>
      </AbsoluteFill>
      <SafeStage
        style={{
          justifyContent: "flex-end",
        }}
      >
        <div
          style={{
            width: `${line * 42}%`,
            height: 2,
            background: ATELIER_COLORS.ink,
            marginBottom: 36,
          }}
        />
        <TextReveal delay={18} duration={20}>
          <div
            style={{
              fontFamily: ATELIER_FONTS.serif,
              fontSize: 72,
              fontWeight: 550,
              letterSpacing: "-0.035em",
              lineHeight: 1.02,
              color: ATELIER_COLORS.ink,
              maxWidth: 820,
            }}
          >
            {TIKTOK_COPY.hookLine1}
          </div>
        </TextReveal>
        <TextReveal delay={34} duration={18} direction="up">
          <div
            style={{
              marginTop: 16,
              fontFamily: ATELIER_FONTS.serif,
              fontSize: 40,
              fontStyle: "italic",
              color: ATELIER_COLORS.ink,
              opacity: 0.78,
            }}
          >
            {TIKTOK_COPY.hookLine2}
          </div>
        </TextReveal>
      </SafeStage>
    </AbsoluteFill>
  );
}
