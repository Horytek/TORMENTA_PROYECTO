import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { TIKTOK_SAFE } from "../tiktokConfig";

/** Hueco para username, botones y caption de TikTok. */
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
        paddingTop: TIKTOK_SAFE.top,
        paddingBottom: TIKTOK_SAFE.bottom,
        paddingLeft: TIKTOK_SAFE.left,
        paddingRight: TIKTOK_SAFE.right,
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
}
