import { AbsoluteFill } from "remotion";
import { TextReveal } from "../../../../atelier/video/components/TextReveal";
import { SCENE_PICKS } from "../creandoModa.data";
import { BrandLogo } from "../components/BrandLogo";
import { CinematicImage } from "../components/CinematicImage";
import { SafeStage } from "../components/SafeStage";
import { CREANDO_MODA } from "../tiktokConfig";

/** Escena 1 — Intro de marca con banner editorial. */
export function Scene01_BrandIntro() {
  const bannerSrc = SCENE_PICKS.banner ?? "";

  return (
    <AbsoluteFill style={{ background: CREANDO_MODA.colors.ink }}>
      {bannerSrc ? (
        <CinematicImage src={bannerSrc} blurDissolve overlay={0.32} />
      ) : null}
      <SafeStage style={{ justifyContent: "flex-end", alignItems: "flex-start" }}>
        <BrandLogo delay={12} variant="light" />
        <TextReveal delay={22} duration={22}>
          <div
            style={{
              marginTop: 24,
              fontFamily: CREANDO_MODA.fonts.display,
              fontSize: 56,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: CREANDO_MODA.colors.white,
              lineHeight: 1.05,
              maxWidth: 820,
            }}
          >
            {CREANDO_MODA.copy.wordmark}
          </div>
        </TextReveal>
        <TextReveal delay={36} duration={18} direction="up">
          <div
            style={{
              marginTop: 16,
              fontFamily: CREANDO_MODA.fonts.body,
              fontSize: 28,
              fontWeight: 500,
              fontStyle: "italic",
              color: "rgba(255,255,255,0.88)",
              maxWidth: 640,
            }}
          >
            {CREANDO_MODA.copy.tagline}
          </div>
        </TextReveal>
      </SafeStage>
    </AbsoluteFill>
  );
}
