import type { CSSProperties, ReactNode } from "react";
import { ATELIER_COLORS, ATELIER_FONTS } from "../../tokens";

export function AtelierLabel({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        fontFamily: ATELIER_FONTS.sans,
        fontSize: 18,
        fontWeight: 500,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: ATELIER_COLORS.stone,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
