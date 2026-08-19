import { AbsoluteFill } from "remotion";
import { TextReveal } from "../../../../atelier/video/components/TextReveal";
import { productsForScene } from "../creandoModa.data";
import { CinematicImage } from "../components/CinematicImage";
import { SafeStage } from "../components/SafeStage";
import { CREANDO_MODA } from "../tiktokConfig";

/** Escena 4 — Momento cinematográfico con producto story. */
export function Scene04_CinematicMoment() {
  const [product] = productsForScene("cinematic");
  if (!product) return null;

  return (
    <AbsoluteFill style={{ background: CREANDO_MODA.colors.ink }}>
      <CinematicImage src={product.image} objectPosition={product.objectPosition} overlay={0.35} />
      <SafeStage style={{ justifyContent: "flex-end", alignItems: "flex-start" }}>
        <TextReveal delay={8} duration={22}>
          <div
            style={{
              fontFamily: CREANDO_MODA.fonts.display,
              fontSize: 52,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: CREANDO_MODA.colors.white,
              lineHeight: 1.05,
            }}
          >
            {CREANDO_MODA.copy.cinematicLine1}
          </div>
        </TextReveal>
        <TextReveal delay={22} duration={20} direction="up">
          <div
            style={{
              marginTop: 10,
              fontFamily: CREANDO_MODA.fonts.display,
              fontSize: 44,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.82)",
            }}
          >
            {CREANDO_MODA.copy.cinematicLine2}
          </div>
        </TextReveal>
        <TextReveal delay={36} duration={16}>
          <div
            style={{
              marginTop: 28,
              fontFamily: CREANDO_MODA.fonts.body,
              fontSize: 26,
              fontWeight: 500,
              color: CREANDO_MODA.colors.white,
            }}
          >
            {product.name} · {product.priceLabel}
          </div>
        </TextReveal>
      </SafeStage>
    </AbsoluteFill>
  );
}
