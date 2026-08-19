import type { CSSProperties, ReactNode } from "react";

import { AbsoluteFill, Img } from "remotion";

import { CREANDO_MODA_SAFE_V2, CREANDO_MODA_V2 } from "../tiktokConfig.v2";

type FullFrameLayoutProps = {
  imageSrc?: string;
  objectPosition?: string;
  /** Imagen desenfocada de respaldo cuando hay UI encima. */
  blurBackground?: boolean;
  /** Capa full-bleed personalizada (Ken Burns, DetailZoom, EditorialImage). */
  backgroundLayer?: ReactNode;
  /** Gradiente de marca en lugar de foto (CTA). */
  gradient?: string;
  gradientOpacity?: number;
  /** Solo texto/UI encima — sin fondo ink que tape capas inferiores. */
  overlayOnly?: boolean;
  children?: ReactNode;
  contentStyle?: CSSProperties;
};

/** Wrapper v2: fondo full viewport + safe zone para UI. */
export function FullFrameLayout({
  imageSrc,
  objectPosition = "50% 35%",
  blurBackground = false,
  backgroundLayer,
  gradient,
  gradientOpacity = 0.55,
  overlayOnly = false,
  children,
  contentStyle,
}: FullFrameLayoutProps) {
  const rootBg = overlayOnly ? "transparent" : CREANDO_MODA_V2.colors.ink;

  return (
    <AbsoluteFill style={{ background: rootBg }}>
      {!overlayOnly && backgroundLayer ? (
        <AbsoluteFill style={{ overflow: "hidden" }}>{backgroundLayer}</AbsoluteFill>
      ) : null}

      {!overlayOnly && !backgroundLayer && gradient ? (
        <AbsoluteFill style={{ background: gradient }} />
      ) : null}

      {!overlayOnly && !backgroundLayer && imageSrc ? (
        <>
          <AbsoluteFill style={{ overflow: "hidden" }}>
            <Img
              src={imageSrc}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition,
                transform: blurBackground ? "scale(1.12)" : "scale(1.08)",
                filter: blurBackground ? "blur(28px) brightness(0.55)" : undefined,
              }}
            />
          </AbsoluteFill>
          {!blurBackground ? (
            <AbsoluteFill
              style={{
                background: `linear-gradient(to top, rgba(28,25,23,${gradientOpacity}) 0%, rgba(28,25,23,0.12) 40%, transparent 65%)`,
              }}
            />
          ) : (
            <AbsoluteFill style={{ background: "rgba(28, 25, 23, 0.35)" }} />
          )}
        </>
      ) : null}

      {children ? (
        <AbsoluteFill
          style={{
            paddingTop: CREANDO_MODA_SAFE_V2.top,
            paddingBottom: CREANDO_MODA_SAFE_V2.bottom,
            paddingLeft: CREANDO_MODA_SAFE_V2.left,
            paddingRight: CREANDO_MODA_SAFE_V2.right,
            pointerEvents: overlayOnly ? "none" : undefined,
            ...contentStyle,
          }}
        >
          {children}
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
}

/** Capa de texto/UI transparente sobre escenas compuestas. */
export function SafeTextOverlay({
  children,
  contentStyle,
}: {
  children?: ReactNode;
  contentStyle?: CSSProperties;
}) {
  return (
    <FullFrameLayout overlayOnly contentStyle={contentStyle}>
      {children}
    </FullFrameLayout>
  );
}
