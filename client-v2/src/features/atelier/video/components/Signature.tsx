import type { CSSProperties } from "react";
import { ATELIER_COLORS, ATELIER_FONTS } from "../../tokens";

export function Signature({
  name,
  mark,
  style,
}: {
  name: string;
  mark?: string;
  style?: CSSProperties;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, ...style }}>
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "rgba(44, 40, 36, 0.08)",
          color: ATELIER_COLORS.ink,
          fontFamily: ATELIER_FONTS.serif,
          fontSize: 26,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {name.slice(0, 1)}
      </div>
      <div>
        <div
          style={{
            fontFamily: ATELIER_FONTS.serif,
            fontSize: 36,
            color: ATELIER_COLORS.ink,
            letterSpacing: "-0.03em",
            lineHeight: 1,
          }}
        >
          {name}
        </div>
        {mark ? (
          <div
            style={{
              marginTop: 8,
              fontFamily: ATELIER_FONTS.sans,
              fontSize: 16,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: ATELIER_COLORS.stone,
            }}
          >
            {mark}
          </div>
        ) : null}
      </div>
    </div>
  );
}
