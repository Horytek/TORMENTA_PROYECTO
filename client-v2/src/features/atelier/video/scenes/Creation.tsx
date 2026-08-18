import { AbsoluteFill } from "remotion";
import { ATELIER_COLORS, ATELIER_FONTS } from "../../tokens";
import { AtelierLabel } from "../components/AtelierLabel";
import { TextReveal } from "../components/TextReveal";
import { VIDEO_COPY } from "../videoConfig";

function Bubble({
  who,
  text,
  align,
}: {
  who: string;
  text: string;
  align: "left" | "right";
}) {
  return (
    <div
      style={{
        alignSelf: align === "right" ? "flex-end" : "flex-start",
        maxWidth: 720,
        padding: "28px 36px",
        background: align === "right" ? ATELIER_COLORS.ink : ATELIER_COLORS.offwhite,
        color: align === "right" ? ATELIER_COLORS.offwhite : ATELIER_COLORS.ink,
      }}
    >
      <div
        style={{
          fontFamily: ATELIER_FONTS.sans,
          fontSize: 14,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          opacity: 0.65,
          marginBottom: 10,
        }}
      >
        {who}
      </div>
      <div
        style={{
          fontFamily: ATELIER_FONTS.serif,
          fontSize: 40,
          letterSpacing: "-0.02em",
          lineHeight: 1.2,
        }}
      >
        {text}
      </div>
    </div>
  );
}

export function Creation() {
  return (
    <AbsoluteFill
      style={{
        background: ATELIER_COLORS.paper,
        padding: "100px 140px",
        justifyContent: "center",
      }}
    >
      <AtelierLabel>{VIDEO_COPY.commission}</AtelierLabel>
      <div
        style={{
          marginTop: 12,
          fontFamily: ATELIER_FONTS.sans,
          fontSize: 20,
          color: ATELIER_COLORS.stone,
        }}
      >
        IDEA → BOCETO → OBRA
      </div>
      <div
        style={{
          marginTop: 48,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <TextReveal delay={8} duration={16}>
          <Bubble who="Artista" text={VIDEO_COPY.chatArtist} align="left" />
        </TextReveal>
        <TextReveal delay={28} duration={16}>
          <Bubble who="Cliente" text={VIDEO_COPY.chatClient} align="right" />
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
}
