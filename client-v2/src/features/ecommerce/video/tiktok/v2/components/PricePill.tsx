import type { CSSProperties } from "react";

import { CREANDO_MODA_V2 } from "../tiktokConfig.v2";

type PricePillProps = {
  price: string;
  variant?: "light" | "dark";
  size?: "md" | "lg";
  style?: CSSProperties;
};

/** Precio en pastilla contrastada — legible sobre cualquier fondo. */
export function PricePill({ price, variant = "light", size = "lg", style }: PricePillProps) {
  const isLight = variant === "light";
  const fontSize = size === "lg" ? CREANDO_MODA_V2.type.price + 4 : CREANDO_MODA_V2.type.price;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: size === "lg" ? "16px 36px" : "12px 28px",
        borderRadius: 12,
        background: isLight
          ? "linear-gradient(180deg, #FFFFFF 0%, #F5F5F4 100%)"
          : "linear-gradient(180deg, rgba(28,25,23,0.95) 0%, rgba(12,10,9,0.98) 100%)",
        border: isLight
          ? `2px solid ${CREANDO_MODA_V2.colors.accent}`
          : "2px solid rgba(190, 24, 93, 0.65)",
        boxShadow: isLight
          ? "0 12px 40px rgba(0, 0, 0, 0.32), inset 0 1px 0 rgba(255,255,255,0.9)"
          : "0 12px 40px rgba(190, 24, 93, 0.35), inset 0 1px 0 rgba(255,255,255,0.1)",
        fontFamily: CREANDO_MODA_V2.fonts.body,
        fontSize,
        fontWeight: 800,
        color: isLight ? CREANDO_MODA_V2.colors.accent : CREANDO_MODA_V2.colors.white,
        letterSpacing: "0.04em",
        ...style,
      }}
    >
      {price}
    </div>
  );
}
