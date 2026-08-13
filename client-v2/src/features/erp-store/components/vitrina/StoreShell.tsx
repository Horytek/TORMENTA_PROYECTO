import { createContext, useContext, useEffect, type CSSProperties, type ReactNode } from "react";
import "../../styles/vitrina.css";
import type { StoreTienda } from "../../types/storefront";
import { tiendaTheme } from "../../types/storefront";
import {
  FONT_BODY_STACK,
  FONT_DISPLAY_STACK,
  googleFontsHref,
  surfacesFor,
  type ColorSchemePref,
  type ResolvedScheme,
  type StoreTheme,
} from "../../types/theme";
import { useVisitorColorScheme } from "./hooks/useVisitorColorScheme";

const DEFAULT_ACCENT = "#0E7C7B";

type SchemeCtx = {
  pref: ColorSchemePref;
  resolved: ResolvedScheme;
  cycle: () => void;
  allowToggle: boolean;
  theme: StoreTheme;
};

const ColorSchemeContext = createContext<SchemeCtx | null>(null);

export function useStoreColorScheme() {
  const ctx = useContext(ColorSchemeContext);
  if (!ctx) throw new Error("useStoreColorScheme outside StoreShell");
  return ctx;
}

type Props = {
  tienda: StoreTienda;
  slug?: string;
  children: ReactNode;
  className?: string;
};

export function StoreShell({ tienda, slug, children, className = "" }: Props) {
  const accent = tienda.color_primario?.trim() || DEFAULT_ACCENT;
  const theme = tiendaTheme(tienda);
  const schemeSlug = slug || tienda.slug;
  const { pref, cycle, resolved, allowToggle } = useVisitorColorScheme(schemeSlug, theme);
  const surfaces = surfacesFor(theme, resolved);

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
    "--vitrina-accent-glow": `color-mix(in srgb, ${accent} 28%, transparent)`,
    "--vitrina-ink": surfaces.ink,
    "--vitrina-fog": surfaces.fog,
    "--vitrina-mist": surfaces.mist,
    "--vitrina-elevated": surfaces.elevated,
    "--vitrina-border": surfaces.border,
    "--vitrina-muted": surfaces.muted,
    "--vitrina-stage-from": surfaces.stageFrom,
    "--vitrina-stage-to": surfaces.stageTo,
    "--font-vitrina-display": FONT_DISPLAY_STACK[theme.font_display],
    "--font-vitrina-body": FONT_BODY_STACK[theme.font_body],
  } as CSSProperties;

  return (
    <ColorSchemeContext.Provider value={{ pref, resolved, cycle, allowToggle, theme }}>
      <div
        className={`vitrina ${className}`}
        style={style}
        data-preset={theme.preset}
        data-header={theme.header_style}
        data-color-scheme={resolved}
      >
        {children}
      </div>
    </ColorSchemeContext.Provider>
  );
}
