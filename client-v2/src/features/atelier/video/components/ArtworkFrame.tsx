import type { CSSProperties, ReactNode } from "react";
import { ATELIER_COLORS } from "../../tokens";

type ArtworkFrameProps = {
  children: ReactNode;
  width?: number;
  height?: number;
  pad?: number;
  style?: CSSProperties;
};

export function ArtworkFrame({
  children,
  width = 520,
  height = 680,
  pad = 28,
  style,
}: ArtworkFrameProps) {
  return (
    <div
      style={{
        width,
        height,
        padding: pad,
        background: ATELIER_COLORS.offwhite,
        boxShadow: "0 28px 70px rgba(44, 40, 36, 0.14)",
        ...style,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          overflow: "hidden",
          background: ATELIER_COLORS.paper,
        }}
      >
        {children}
      </div>
    </div>
  );
}
