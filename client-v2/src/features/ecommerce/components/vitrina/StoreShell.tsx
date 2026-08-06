import { useEffect, type CSSProperties, type ReactNode } from "react";
import "../../styles/vitrina.css";
import type { StoreTienda } from "../../types/storefront";
import { tiendaTheme } from "../../types/storefront";
import {
  FONT_BODY_STACK,
  FONT_DISPLAY_STACK,
  PRESET_SURFACES,
  googleFontsHref,
} from "../../types/theme";

const DEFAULT_ACCENT = "#0E7C7B";

type Props = {
  tienda: StoreTienda;
  children: ReactNode;
  className?: string;
};

export function StoreShell({ tienda, children, className = "" }: Props) {
  const accent = tienda.color_primario?.trim() || DEFAULT_ACCENT;
  const theme = tiendaTheme(tienda);
  const surfaces = PRESET_SURFACES[theme.preset];

  useEffect(() => {
    document.title = `${tienda.nombre} · Tienda`;
  }, [tienda.nombre]);

  useEffect(() => {
    const id = "vitrina-fonts";
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = googleFontsHref(theme);
  }, [theme.font_display, theme.font_body]);

  const style = {
    "--vitrina-accent": accent,
    "--vitrina-accent-soft": `color-mix(in srgb, ${accent} 14%, transparent)`,
    "--vitrina-accent-glow": `color-mix(in srgb, ${accent} 35%, transparent)`,
    "--vitrina-ink": surfaces.ink,
    "--vitrina-fog": surfaces.fog,
    "--vitrina-mist": surfaces.mist,
    "--vitrina-stage-from": surfaces.stageFrom,
    "--vitrina-stage-to": surfaces.stageTo,
    "--font-vitrina-display": FONT_DISPLAY_STACK[theme.font_display],
    "--font-vitrina-body": FONT_BODY_STACK[theme.font_body],
  } as CSSProperties;

  return (
    <div
      className={`vitrina ${className}`}
      style={style}
      data-preset={theme.preset}
      data-header={theme.header_style}
    >
      {children}
    </div>
  );
}
