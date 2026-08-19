import type { CSSProperties, ReactNode } from "react";

type GlassPanelProps = {
  children: ReactNode;
  style?: CSSProperties;
  /** Oscuro sobre foto clara; claro sobre fondo oscuro */
  tone?: "dark" | "light";
};

/** Panel glass para legibilidad de texto sobre imágenes. */
export function GlassPanel({ children, style, tone = "dark" }: GlassPanelProps) {
  const isDark = tone === "dark";

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "22px 32px",
        borderRadius: 20,
        background: isDark ? "rgba(12, 10, 9, 0.72)" : "rgba(255, 255, 255, 0.94)",
        border: isDark
          ? "1px solid rgba(255, 255, 255, 0.14)"
          : "1px solid rgba(255, 255, 255, 0.65)",
        boxShadow: isDark
          ? "0 16px 48px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.08)"
          : "0 16px 48px rgba(0, 0, 0, 0.28)",
        backdropFilter: "blur(12px)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
