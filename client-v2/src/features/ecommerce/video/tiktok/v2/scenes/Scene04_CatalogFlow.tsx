import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

import { productsForSceneV2 } from "../../creandoModa.data";
import { CatalogScroller } from "../components/CatalogScroller";
import { EditorialImage } from "../components/EditorialImage";
import { FullFrameLayout } from "../components/FullFrameLayout";
import { PhoneMockup } from "../components/PhoneMockup";

/** Escena 4 — Catálogo editorial en phone grande sobre fondo cinematográfico. */
export function Scene04_CatalogFlow() {
  const products = productsForSceneV2("catalogScroll");
  const bgProduct = products[0];
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const phoneTilt = interpolate(frame, [0, durationInFrames], [-2, 2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <FullFrameLayout
      backgroundLayer={
        bgProduct ? (
          <EditorialImage
            src={bgProduct.image}
            objectPosition={bgProduct.objectPosition ?? "50% 35%"}
            from={1.1}
            to={1.18}
            overlay={0.45}
            duotone
          />
        ) : undefined
      }
      contentStyle={{ padding: 0 }}
    >
      <PhoneMockup
        heightRatio={0.9}
        style={{
          transform: `rotate(${phoneTilt}deg)`,
        }}
      >
        <CatalogScroller products={products} />
      </PhoneMockup>

      {/* Brillo decorativo detrás del phone */}
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background: `radial-gradient(ellipse 55% 45% at 50% 52%, rgba(190,24,93,0.22) 0%, transparent 70%)`,
        }}
      />
    </FullFrameLayout>
  );
}
