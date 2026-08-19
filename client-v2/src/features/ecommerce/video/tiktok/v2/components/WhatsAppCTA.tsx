import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

import { BRAND } from "../../creandoModa.data";

import { CREANDO_MODA_V2 } from "../tiktokConfig.v2";

/** Outro centrado: logo grande + gancho + botón perfil + hint WA. */
export function WhatsAppCTA() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const btnPop = spring({
    frame: frame - 24,
    fps,
    config: { damping: 14, stiffness: 160 },
  });

  const logoScale = spring({
    frame: frame - 4,
    fps,
    config: { damping: 16, stiffness: 140 },
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 32,
        padding: "0 48px",
      }}
    >
      {BRAND.logoUrl ? (
        <Img
          src={BRAND.logoUrl}
          style={{
            height: 200,
            width: "auto",
            maxWidth: "85%",
            objectFit: "contain",
            filter: "brightness(0) invert(1) drop-shadow(0 8px 32px rgba(0,0,0,0.35))",
            transform: `scale(${0.88 + logoScale * 0.12})`,
            marginBottom: 8,
          }}
        />
      ) : (
        <div
          style={{
            fontFamily: CREANDO_MODA_V2.fonts.display,
            fontSize: 48,
            fontWeight: 800,
            letterSpacing: "0.14em",
            color: CREANDO_MODA_V2.colors.white,
          }}
        >
          CREANDO MODA
        </div>
      )}

      <div
        style={{
          fontFamily: CREANDO_MODA_V2.fonts.display,
          fontSize: CREANDO_MODA_V2.type.hero,
          fontWeight: 800,
          color: CREANDO_MODA_V2.colors.white,
          lineHeight: 1.06,
          maxWidth: 920,
          textShadow: "0 4px 32px rgba(0,0,0,0.4)",
        }}
      >
        {CREANDO_MODA_V2.copy.ctaHook}
      </div>

      <div
        style={{
          fontFamily: CREANDO_MODA_V2.fonts.body,
          fontSize: CREANDO_MODA_V2.type.secondary + 6,
          fontWeight: 700,
          color: "rgba(255,255,255,0.92)",
          letterSpacing: "0.02em",
        }}
      >
        {CREANDO_MODA_V2.copy.ctaPriceFrom}
      </div>

      <div
        style={{
          width: "78%",
          minHeight: 84,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 18,
          background: "linear-gradient(180deg, #FFFFFF 0%, #F5F5F4 100%)",
          color: CREANDO_MODA_V2.colors.accent,
          fontFamily: CREANDO_MODA_V2.fonts.body,
          fontSize: CREANDO_MODA_V2.type.ctaButton + 2,
          fontWeight: 800,
          letterSpacing: "0.05em",
          boxShadow: "0 16px 48px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.9)",
          border: `2px solid rgba(255,255,255,0.5)`,
          transform: `scale(${0.92 + btnPop * 0.08})`,
          opacity: interpolate(frame - 20, [0, 12], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        {CREANDO_MODA_V2.copy.ctaButton}
      </div>

      <div
        style={{
          fontFamily: CREANDO_MODA_V2.fonts.body,
          fontSize: CREANDO_MODA_V2.type.micro + 2,
          fontWeight: 600,
          color: "rgba(255,255,255,0.82)",
          maxWidth: 760,
          lineHeight: 1.45,
        }}
      >
        {CREANDO_MODA_V2.copy.whatsappHint}
      </div>
    </div>
  );
}
