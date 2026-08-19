import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";

import { productsForSceneV2 } from "../../creandoModa.data";
import { BenefitBadge } from "../components/BenefitBadge";
import { DetailZoom } from "../components/DetailZoom";
import { FashionAccent } from "../components/FashionAccent";
import { FullFrameLayout, SafeTextOverlay } from "../components/FullFrameLayout";
import { GlassPanel } from "../components/GlassPanel";
import { PricePill } from "../components/PricePill";
import { TypographyHero } from "../components/TypographyHero";
import { CREANDO_MODA_V2, CREANDO_MODA_V2_COPY } from "../tiktokConfig.v2";

const DEFAULT_REGIONS = {
  full: { objectPosition: "50% 35%", scale: 1.08 },
  detail: { objectPosition: "50% 62%", scale: 1.45 },
  texture: { objectPosition: "50% 48%", scale: 1.7 },
};

/** Escena 3 — 3 planos DetailZoom + info producto en panel glass. */
export function Scene03_ProductHero() {
  const products = productsForSceneV2("productHero");
  const product = products[0];
  const { durationInFrames } = useVideoConfig();
  const planeDuration = Math.floor(durationInFrames / 3);

  if (!product) return null;

  const regions = product.cropRegions ?? DEFAULT_REGIONS;
  const tallasLabel =
    product.tallas.length > 0
      ? `${CREANDO_MODA_V2_COPY.chips.tallas} ${product.tallas[0]}–${product.tallas[product.tallas.length - 1]}`
      : CREANDO_MODA_V2_COPY.chips.tallas;

  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={planeDuration}>
        <FullFrameLayout
          backgroundLayer={
            <AbsoluteFill style={{ overflow: "hidden" }}>
              <DetailZoom src={product.image} region={regions.full} duration={planeDuration} />
              <AbsoluteFill
                style={{
                  background:
                    "linear-gradient(to top, rgba(28,25,23,0.62) 0%, rgba(28,25,23,0.15) 45%, transparent 70%)",
                  pointerEvents: "none",
                }}
              />
            </AbsoluteFill>
          }
        />
      </Sequence>
      <Sequence from={planeDuration} durationInFrames={planeDuration}>
        <FullFrameLayout
          backgroundLayer={
            <AbsoluteFill style={{ overflow: "hidden" }}>
              <DetailZoom src={product.image} region={regions.detail} duration={planeDuration} />
              <AbsoluteFill
                style={{
                  background:
                    "linear-gradient(to top, rgba(28,25,23,0.62) 0%, rgba(28,25,23,0.15) 45%, transparent 70%)",
                  pointerEvents: "none",
                }}
              />
            </AbsoluteFill>
          }
        />
      </Sequence>
      <Sequence from={planeDuration * 2} durationInFrames={planeDuration}>
        <FullFrameLayout
          backgroundLayer={
            <AbsoluteFill style={{ overflow: "hidden" }}>
              <DetailZoom src={product.image} region={regions.texture} duration={planeDuration} />
              <AbsoluteFill
                style={{
                  background:
                    "linear-gradient(to top, rgba(28,25,23,0.62) 0%, rgba(28,25,23,0.15) 45%, transparent 70%)",
                  pointerEvents: "none",
                }}
              />
            </AbsoluteFill>
          }
        />
      </Sequence>

      <SafeTextOverlay contentStyle={{ justifyContent: "flex-end", alignItems: "center" }}>
        <FashionAccent label="Destacado" delay={4} />
        <GlassPanel tone="dark" style={{ width: "100%", maxWidth: 880, marginBottom: 8 }}>
          <TypographyHero delay={8} size={CREANDO_MODA_V2.type.product + 4} align="center">
            {product.name.toUpperCase()}
          </TypographyHero>
          <div style={{ marginTop: 22 }}>
            <PricePill price={product.priceLabel} />
          </div>
          <div
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              justifyContent: "center",
              marginTop: 22,
            }}
          >
            <BenefitBadge label={CREANDO_MODA_V2_COPY.chips.disponible} delay={20} />
            <BenefitBadge label={tallasLabel} delay={26} />
            <BenefitBadge label={CREANDO_MODA_V2_COPY.chips.colores} delay={32} accent />
          </div>
        </GlassPanel>
      </SafeTextOverlay>
    </AbsoluteFill>
  );
}
