import { Sequence, useVideoConfig } from "remotion";

import { productsForSceneV2 } from "../../creandoModa.data";
import { EditorialImage } from "../components/EditorialImage";
import { FullFrameLayout, SafeTextOverlay } from "../components/FullFrameLayout";
import { TypographyHero } from "../components/TypographyHero";
import { CREANDO_MODA_V2_COPY } from "../tiktokConfig.v2";

/** Escena 5 — una frase por mitad de escena, anclada abajo. */
export function Scene05_Experience() {
  const products = productsForSceneV2("experience");
  const product = products[0];
  const { durationInFrames } = useVideoConfig();
  const half = Math.floor(durationInFrames / 2);

  if (!product) return null;

  return (
    <>
      <FullFrameLayout
        backgroundLayer={
          <EditorialImage
            src={product.image}
            objectPosition={product.objectPosition ?? "50% 35%"}
            from={1.1}
            to={1.22}
            drift={18}
            overlay={0.15}
            accentBar
          />
        }
      />

      <SafeTextOverlay contentStyle={{ justifyContent: "flex-end", alignItems: "center" }}>
        <Sequence from={0} durationInFrames={half}>
          <TypographyHero delay={8} align="center" size={88}>
            {CREANDO_MODA_V2_COPY.experienceLine1}
          </TypographyHero>
        </Sequence>
        <Sequence from={half} durationInFrames={durationInFrames - half}>
          <TypographyHero delay={4} align="center" size={80}>
            {CREANDO_MODA_V2_COPY.experienceLine2}
          </TypographyHero>
        </Sequence>
      </SafeTextOverlay>
    </>
  );
}
