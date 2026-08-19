import { AbsoluteFill, Img, Sequence, useVideoConfig } from "remotion";
import { TextReveal } from "../../../../atelier/video/components/TextReveal";
import { productsForScene } from "../creandoModa.data";
import { FashionTransition } from "../components/FashionTransition";
import { SafeStage } from "../components/SafeStage";
import { CREANDO_MODA } from "../tiktokConfig";

/** Escena 2 — 6 cortes rápidos con nombre + precio. */
export function Scene02_VisualImpact() {
  const products = productsForScene("impact");
  const { durationInFrames } = useVideoConfig();
  const cutDuration = Math.floor(durationInFrames / Math.max(products.length, 1));
  const modes = ["whip", "zoom", "crossfade"] as const;

  return (
    <AbsoluteFill style={{ background: CREANDO_MODA.colors.bg }}>
      {products.map((product, i) => (
        <Sequence key={product.id_producto} from={i * cutDuration} durationInFrames={cutDuration}>
          <FashionTransition mode={modes[i % modes.length]} duration={10}>
            <AbsoluteFill>
              <Img
                src={product.image}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: product.objectPosition ?? "50% 35%",
                }}
              />
              <AbsoluteFill
                style={{
                  background: "linear-gradient(to top, rgba(28,25,23,0.55) 0%, transparent 50%)",
                }}
              />
            </AbsoluteFill>
          </FashionTransition>
          <SafeStage style={{ justifyContent: "flex-end" }}>
            <div
              style={{
                fontFamily: CREANDO_MODA.fonts.display,
                fontSize: 44,
                fontWeight: 600,
                color: CREANDO_MODA.colors.white,
                lineHeight: 1.05,
              }}
            >
              {product.name}
            </div>
            <div
              style={{
                marginTop: 6,
                fontFamily: CREANDO_MODA.fonts.body,
                fontSize: 28,
                fontWeight: 600,
                color: CREANDO_MODA.colors.accent,
              }}
            >
              {product.priceLabel}
            </div>
          </SafeStage>
        </Sequence>
      ))}

      <SafeStage
        style={{
          justifyContent: "flex-start",
          pointerEvents: "none",
        }}
      >
        <TextReveal delay={4} duration={16}>
          <div
            style={{
              fontFamily: CREANDO_MODA.fonts.display,
              fontSize: 38,
              fontWeight: 700,
              color: CREANDO_MODA.colors.white,
              textShadow: "0 2px 16px rgba(0,0,0,0.35)",
              maxWidth: 720,
            }}
          >
            {CREANDO_MODA.copy.heroHeadline}
          </div>
        </TextReveal>
      </SafeStage>
    </AbsoluteFill>
  );
}
