import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { ATELIER_COLORS, ATELIER_FONTS } from "../../tokens";
import { ArtworkFrame } from "../components/ArtworkFrame";
import { AtelierLabel } from "../components/AtelierLabel";
import { TextReveal } from "../components/TextReveal";
import { LinePortrait } from "../assets/frames";
import { SCENE_FRAMES } from "../videoConfig";

export function Sketch() {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [8, SCENE_FRAMES.sketch - 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
      <div style={{ maxWidth: 640 }}>
        <AtelierLabel>El boceto</AtelierLabel>
        <TextReveal delay={4} duration={18}>
          <div
            style={{
              marginTop: 16,
              fontFamily: ATELIER_FONTS.serif,
              fontSize: 88,
              letterSpacing: "-0.035em",
              lineHeight: 1,
              color: ATELIER_COLORS.ink,
            }}
          >
            Primero, el trazo.
          </div>
        </TextReveal>
        <TextReveal delay={22} duration={16} direction="up">
          <div
            style={{
              marginTop: 28,
              fontFamily: ATELIER_FONTS.sans,
              fontSize: 26,
              color: ATELIER_COLORS.stone,
              maxWidth: 420,
              lineHeight: 1.45,
            }}
          >
            Construcción a lápiz. Todavía no es la obra.
          </div>
        </TextReveal>
      </div>
      <ArtworkFrame width={500} height={640}>
        <LinePortrait progress={progress} />
      </ArtworkFrame>
    </AbsoluteFill>
  );
}
