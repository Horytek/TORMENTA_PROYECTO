import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { CREANDO_MODA_SAFE } from "../tiktokConfig";

/** Safe zone TikTok para el video Creando Moda. */
export function SafeStage({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <AbsoluteFill
      style={{
        paddingTop: CREANDO_MODA_SAFE.top,
        paddingBottom: CREANDO_MODA_SAFE.bottom,
        paddingLeft: CREANDO_MODA_SAFE.left,
        paddingRight: CREANDO_MODA_SAFE.right,
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
}
