import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

import type { CreandoModaProduct } from "../../creandoModa.data";

import { CREANDO_MODA_V2 } from "../tiktokConfig.v2";

import { PricePill } from "./PricePill";

type CatalogScrollerProps = {
  products: CreandoModaProduct[];
};

const CARD_GAP = 14;
const CARD_IMAGE_H = 248;
const CARD_BODY_H = 118;
const CARD_TOTAL = CARD_IMAGE_H + CARD_BODY_H + CARD_GAP;

/** Catálogo compacto — llena el phone sin bandas vacías. */
export function CatalogScroller({ products }: CatalogScrollerProps) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const scrollY = interpolate(
    frame,
    [0, durationInFrames],
    [0, -((products.length - 1) * CARD_TOTAL)],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ background: "#141210", overflow: "hidden" }}>
      {/* Header fijo dentro del phone */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 5,
          padding: "10px 16px 12px",
          background: "linear-gradient(180deg, #141210 70%, transparent)",
          borderBottom: `2px solid ${CREANDO_MODA_V2.colors.accent}`,
        }}
      >
        <div
          style={{
            fontFamily: CREANDO_MODA_V2.fonts.display,
            fontSize: 26,
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "0.12em",
            textAlign: "center",
            textTransform: "uppercase",
          }}
        >
          Colección
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 52,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            transform: `translateY(${scrollY}px)`,
            padding: "8px 12px 80px",
            display: "flex",
            flexDirection: "column",
            gap: CARD_GAP,
          }}
        >
          {products.map((product, i) => (
            <div
              key={product.id_producto}
              style={{
                borderRadius: 16,
                overflow: "hidden",
                background: "#1f1c1a",
                border: `2px solid ${i === 0 ? CREANDO_MODA_V2.colors.accent : "rgba(255,255,255,0.1)"}`,
                boxShadow:
                  i === 0
                    ? "0 6px 28px rgba(190,24,93,0.35)"
                    : "0 4px 16px rgba(0,0,0,0.3)",
                flexShrink: 0,
              }}
            >
              <div style={{ height: CARD_IMAGE_H, overflow: "hidden", position: "relative" }}>
                <Img
                  src={product.image}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: product.objectPosition ?? "50% 35%",
                  }}
                />
                {i === 0 ? (
                  <div
                    style={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      background: CREANDO_MODA_V2.colors.accent,
                      color: "#fff",
                      fontFamily: CREANDO_MODA_V2.fonts.body,
                      fontSize: 16,
                      fontWeight: 800,
                      padding: "5px 10px",
                      borderRadius: 6,
                      letterSpacing: "0.1em",
                    }}
                  >
                    NUEVO
                  </div>
                ) : null}
              </div>
              <div
                style={{
                  height: CARD_BODY_H,
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    fontFamily: CREANDO_MODA_V2.fonts.display,
                    fontSize: 28,
                    fontWeight: 800,
                    color: "#fff",
                    lineHeight: 1.05,
                    textTransform: "uppercase",
                    textAlign: "center",
                    letterSpacing: "0.03em",
                  }}
                >
                  {product.name}
                </div>
                <PricePill price={product.priceLabel} variant="dark" size="md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
}
