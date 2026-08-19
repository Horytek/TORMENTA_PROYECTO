import { productsForSceneV2 } from "../../creandoModa.data";
import { EditorialImage } from "../components/EditorialImage";
import { FashionAccent } from "../components/FashionAccent";
import { FullFrameLayout, SafeTextOverlay } from "../components/FullFrameLayout";
import { TypographyHero } from "../components/TypographyHero";
import { CREANDO_MODA_V2_COPY } from "../tiktokConfig.v2";

/** Escena 1 — Hook impacto frame 0, editorial full-bleed. */
export function Scene01_Hook() {
  const products = productsForSceneV2("hook");
  const product = products[0];

  if (!product) return null;

  return (
    <>
      <FullFrameLayout
        backgroundLayer={
          <EditorialImage
            src={product.image}
            objectPosition={product.objectPosition ?? "50% 35%"}
            impactZoom
            accentBar
            overlay={0.18}
          />
        }
      />
      <SafeTextOverlay contentStyle={{ justifyContent: "flex-end", alignItems: "center" }}>
        <FashionAccent label="Creando Moda" delay={4} />
        <TypographyHero delay={12} align="center">
          {CREANDO_MODA_V2_COPY.hookHeadline}
        </TypographyHero>
      </SafeTextOverlay>
    </>
  );
}
