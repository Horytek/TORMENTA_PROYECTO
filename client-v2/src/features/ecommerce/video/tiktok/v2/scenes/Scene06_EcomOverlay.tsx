import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

import { productsForSceneV2 } from "../../creandoModa.data";
import { BenefitBadge } from "../components/BenefitBadge";
import { EditorialImage } from "../components/EditorialImage";
import { FullFrameLayout } from "../components/FullFrameLayout";
import { PhoneMockup } from "../components/PhoneMockup";
import { PricePill } from "../components/PricePill";
import { CREANDO_MODA_V2, CREANDO_MODA_V2_COPY } from "../tiktokConfig.v2";

/** Escena 6 — phone ancho full, contenido flex sin huecos, badges dentro. */
export function Scene06_EcomOverlay() {
  const bgProducts = productsForSceneV2("overlay-background");
  const cardProducts = productsForSceneV2("overlay-card");
  const bg = bgProducts[0];
  const card = cardProducts[0];
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  if (!bg || !card) return null;

  const tallasRange =
    card.tallas.length > 0
      ? `${card.tallas[0]}–${card.tallas[card.tallas.length - 1]}`
      : "28–34";

  const floatY = interpolate(frame, [0, durationInFrames], [6, -6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <FullFrameLayout
      backgroundLayer={
        <EditorialImage
          src={bg.image}
          objectPosition={bg.objectPosition ?? "50% 35%"}
          from={1.1}
          to={1.16}
          drift={10}
          overlay={0.38}
        />
      }
      contentStyle={{ padding: 0 }}
    >
      <PhoneMockup
        heightRatio={0.84}
        style={{ transform: `translateY(${floatY}px)` }}
      >
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            background: "#141210",
          }}
        >
          {/* Header */}
          <div
            style={{
              flexShrink: 0,
              padding: "14px 16px 12px",
              textAlign: "center",
              borderBottom: `2px solid ${CREANDO_MODA_V2.colors.accent}`,
            }}
          >
            <div
              style={{
                fontFamily: CREANDO_MODA_V2.fonts.display,
                fontSize: 32,
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {CREANDO_MODA_V2_COPY.overlayHeadline}
            </div>
          </div>

          {/* Badges dentro del phone — no se cortan */}
          <div
            style={{
              flexShrink: 0,
              display: "flex",
              justifyContent: "center",
              gap: 10,
              padding: "12px 14px",
              flexWrap: "wrap",
            }}
          >
            <BenefitBadge label={`Tallas ${tallasRange}`} delay={4} size="md" />
            <BenefitBadge label="Yape · Tarjeta" delay={10} accent size="md" />
          </div>

          {/* Imagen — ocupa el espacio restante */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              margin: "0 12px",
              borderRadius: 18,
              overflow: "hidden",
              border: `3px solid ${CREANDO_MODA_V2.colors.accent}`,
              boxShadow: "0 12px 40px rgba(190,24,93,0.35)",
            }}
          >
            <Img
              src={card.image}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: card.objectPosition ?? "50% 35%",
              }}
            />
          </div>

          {/* Footer compacto */}
          <div
            style={{
              flexShrink: 0,
              padding: "16px 18px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: CREANDO_MODA_V2.fonts.display,
                  fontSize: 34,
                  fontWeight: 800,
                  color: "#fff",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  lineHeight: 1.05,
                }}
              >
                {card.name}
              </div>
              <div style={{ marginTop: 10 }}>
                <PricePill price={card.priceLabel} variant="dark" size="md" />
              </div>
            </div>

            <div
              style={{
                flexShrink: 0,
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #25D366, #128C7E)",
                boxShadow: "0 8px 24px rgba(37,211,102,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                border: "2px solid rgba(255,255,255,0.3)",
              }}
            >
              💬
            </div>
          </div>
        </AbsoluteFill>
      </PhoneMockup>
    </FullFrameLayout>
  );
}
