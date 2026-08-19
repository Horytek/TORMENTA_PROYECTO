import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

import { TextReveal } from "../../../../../atelier/video/components/TextReveal";
import { productsForSceneV2 } from "../../creandoModa.data";
import { EditorialImage } from "../components/EditorialImage";
import { FashionTransitionV2 } from "../components/FashionTransitionV2";
import { FullFrameLayout, SafeTextOverlay } from "../components/FullFrameLayout";
import { PricePill } from "../components/PricePill";
import { TypographyHero } from "../components/TypographyHero";
import { CREANDO_MODA_V2, CREANDO_MODA_V2_COPY } from "../tiktokConfig.v2";

const MODES = ["morphScale", "maskReveal", "parallaxSlide"] as const;

/** Nombre + precio arriba — no compite con "NUEVA TEMPORADA" abajo. */
function ProductCutLabel({ name, price }: { name: string; price: string }) {
  const frame = useCurrentFrame();
  const y = interpolate(frame, [0, 14], [-28, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-start",
        alignItems: "center",
        paddingTop: CREANDO_MODA_V2.safe.top + 8,
        paddingLeft: CREANDO_MODA_V2.safe.left,
        paddingRight: CREANDO_MODA_V2.safe.right,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${y}px)`,
          width: "100%",
          maxWidth: 880,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          padding: "18px 28px",
          borderRadius: 18,
          background: "rgba(12, 10, 9, 0.78)",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
        }}
      >
        <div
          style={{
            fontFamily: CREANDO_MODA_V2.fonts.display,
            fontSize: 44,
            fontWeight: 800,
            color: "#fff",
            lineHeight: 1.08,
            textTransform: "uppercase",
            textAlign: "center",
            letterSpacing: "0.04em",
          }}
        >
          {name}
        </div>
        <PricePill price={price} size="md" />
      </div>
    </AbsoluteFill>
  );
}

/** Escena 2 — producto arriba, titular colección abajo (sin solapamiento). */
export function Scene02_Collection() {
  const products = productsForSceneV2("collection");
  const { durationInFrames } = useVideoConfig();
  const cutDuration = Math.floor(durationInFrames / Math.max(products.length, 1));

  return (
    <AbsoluteFill>
      {products.map((product, i) => (
        <Sequence key={product.id_producto} from={i * cutDuration} durationInFrames={cutDuration}>
          <FashionTransitionV2 mode={MODES[i % MODES.length]} duration={12}>
            <FullFrameLayout
              backgroundLayer={
                <EditorialImage
                  src={product.image}
                  objectPosition={product.objectPosition ?? "50% 35%"}
                  from={1.06}
                  to={1.14}
                  accentBar={i === 0}
                />
              }
            />
          </FashionTransitionV2>
          <ProductCutLabel name={product.name} price={product.priceLabel} />
        </Sequence>
      ))}

      <SafeTextOverlay contentStyle={{ justifyContent: "flex-end", alignItems: "center" }}>
        <TypographyHero delay={6} align="center" size={80}>
          {CREANDO_MODA_V2_COPY.collectionHeadline}
        </TypographyHero>
        <TextReveal delay={18} duration={16} direction="up">
          <div
            style={{
              marginTop: 14,
              fontFamily: CREANDO_MODA_V2.fonts.body,
              fontSize: 28,
              fontWeight: 600,
              fontStyle: "italic",
              color: CREANDO_MODA_V2.colors.muted,
              textAlign: "center",
              textShadow: "0 2px 16px rgba(0,0,0,0.5)",
            }}
          >
            {CREANDO_MODA_V2_COPY.collectionTagline}
          </div>
        </TextReveal>
      </SafeTextOverlay>
    </AbsoluteFill>
  );
}
