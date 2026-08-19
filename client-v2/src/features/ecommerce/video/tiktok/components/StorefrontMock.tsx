import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { TextReveal } from "../../../../atelier/video/components/TextReveal";
import type { CreandoModaProduct } from "../creandoModa.data";
import { BRAND } from "../creandoModa.data";
import { CREANDO_MODA } from "../tiktokConfig";

type StorefrontMockProps = {
  product: CreandoModaProduct;
};

/** Mock de vitrina ecommerce — sin teléfono, datos reales. */
export function StorefrontMock({ product }: StorefrontMockProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cardIn = spring({ frame: frame - 8, fps, config: { damping: 18, stiffness: 80 } });
  const ctaPulse = spring({ frame: frame - 48, fps, config: { damping: 14, stiffness: 90 } });
  const tallas = product.tallas.length ? product.tallas : ["28", "30", "32", "34"];
  const swatches = product.tonalidad.slice(0, 5);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: CREANDO_MODA.colors.bg,
        display: "flex",
        flexDirection: "column",
        padding: "0 8px",
        position: "relative",
      }}
    >
      <TextReveal delay={0} duration={16}>
        <div
          style={{
            fontFamily: CREANDO_MODA.fonts.body,
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: CREANDO_MODA.colors.muted,
            marginBottom: 20,
          }}
        >
          {BRAND.name}
        </div>
      </TextReveal>

      <div
        style={{
          flex: 1,
          transform: `translateY(${(1 - cardIn) * 40}px)`,
          opacity: cardIn,
          background: CREANDO_MODA.colors.white,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(28,25,23,0.12)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ height: "52%", overflow: "hidden", position: "relative" }}>
          <Img
            src={product.image}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 16,
              right: 16,
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "#25D366",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(37,211,102,0.4)",
            }}
          >
            <span style={{ fontSize: 26 }}>💬</span>
          </div>
        </div>

        <div style={{ padding: "28px 32px 32px", flex: 1, display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontFamily: CREANDO_MODA.fonts.display,
              fontSize: 36,
              fontWeight: 600,
              color: CREANDO_MODA.colors.ink,
              lineHeight: 1.1,
            }}
          >
            {product.name}
          </div>
          <div
            style={{
              marginTop: 8,
              fontFamily: CREANDO_MODA.fonts.body,
              fontSize: 30,
              fontWeight: 700,
              color: CREANDO_MODA.colors.accent,
            }}
          >
            {product.priceLabel}
          </div>

          <div style={{ marginTop: 20 }}>
            <div
              style={{
                fontFamily: CREANDO_MODA.fonts.body,
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: CREANDO_MODA.colors.muted,
                marginBottom: 10,
              }}
            >
              Tonalidad
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {swatches.map((s) => (
                <div
                  key={s.nombre}
                  title={s.nombre}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: s.hex,
                    border: "2px solid rgba(28,25,23,0.12)",
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <div
              style={{
                fontFamily: CREANDO_MODA.fonts.body,
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: CREANDO_MODA.colors.muted,
                marginBottom: 10,
              }}
            >
              Talla
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {tallas.map((t, i) => (
                <div
                  key={t}
                  style={{
                    minWidth: 44,
                    height: 40,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                    border: `1.5px solid ${i === 0 ? CREANDO_MODA.colors.accent : "rgba(28,25,23,0.15)"}`,
                    background: i === 0 ? `${CREANDO_MODA.colors.accent}12` : "transparent",
                    fontFamily: CREANDO_MODA.fonts.body,
                    fontSize: 18,
                    fontWeight: 600,
                    color: CREANDO_MODA.colors.ink,
                  }}
                >
                  {t}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              marginTop: "auto",
              transform: `scale(${0.94 + ctaPulse * 0.06})`,
              height: 56,
              borderRadius: 12,
              background: CREANDO_MODA.colors.accent,
              color: CREANDO_MODA.colors.white,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: CREANDO_MODA.fonts.body,
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            Agregar al carrito
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          display: "flex",
          justifyContent: "space-between",
          fontFamily: CREANDO_MODA.fonts.body,
          fontSize: 15,
          color: CREANDO_MODA.colors.muted,
        }}
      >
        <span>{BRAND.trust.envio}</span>
        <span>{BRAND.trust.pago}</span>
        <span>{BRAND.trust.soporte}</span>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 120,
          right: 48,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: CREANDO_MODA.colors.accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 24px rgba(190,24,93,0.35)",
          transform: `scale(${0.9 + interpolate(frame, [30, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * 0.1})`,
        }}
      >
        <span style={{ fontSize: 22, color: CREANDO_MODA.colors.white }}>🛒</span>
        <div
          style={{
            position: "absolute",
            top: -4,
            right: -4,
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: CREANDO_MODA.colors.ink,
            color: CREANDO_MODA.colors.white,
            fontSize: 13,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: CREANDO_MODA.fonts.body,
          }}
        >
          1
        </div>
      </div>
    </div>
  );
}
