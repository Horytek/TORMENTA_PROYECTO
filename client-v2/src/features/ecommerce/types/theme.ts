export type ThemePreset = "nocturna" | "clara" | "retail";
export type FontDisplay = "syne" | "outfit" | "sora";
export type FontBody = "dm-sans" | "manrope" | "space-grotesk";
export type HeaderStyle = "dark" | "light" | "accent";

export type StoreTheme = {
  preset: ThemePreset;
  font_display: FontDisplay;
  font_body: FontBody;
  header_style: HeaderStyle;
  hero_headline: string | null;
  hero_tagline: string | null;
  banner_url: string | null;
  sections: {
    stage: boolean;
    categories: boolean;
    trust: boolean;
    stories: boolean;
    rails: boolean;
  };
  trust: {
    envio: string;
    pago: string;
    soporte: string;
  };
};

export const DEFAULT_THEME: StoreTheme = {
  preset: "nocturna",
  font_display: "syne",
  font_body: "dm-sans",
  header_style: "dark",
  hero_headline: null,
  hero_tagline: null,
  banner_url: null,
  sections: {
    stage: true,
    categories: true,
    trust: true,
    stories: true,
    rails: true,
  },
  trust: {
    envio: "Envío a coordinar",
    pago: "Pago Mercado Pago",
    soporte: "Soporte directo",
  },
};

export const PRESET_SURFACES: Record<
  ThemePreset,
  { ink: string; fog: string; mist: string; stageFrom: string; stageTo: string }
> = {
  nocturna: {
    ink: "#0b1220",
    fog: "#e8eef5",
    mist: "#f4f7fb",
    stageFrom: "#0f172a",
    stageTo: "#1e293b",
  },
  clara: {
    ink: "#0f172a",
    fog: "#f1f5f9",
    mist: "#ffffff",
    stageFrom: "#e2e8f0",
    stageTo: "#cbd5e1",
  },
  retail: {
    ink: "#111827",
    fog: "#f3f4f6",
    mist: "#fafafa",
    stageFrom: "#1f2937",
    stageTo: "#374151",
  },
};

export const FONT_DISPLAY_STACK: Record<FontDisplay, string> = {
  syne: '"Syne", ui-sans-serif, system-ui, sans-serif',
  outfit: '"Outfit", ui-sans-serif, system-ui, sans-serif',
  sora: '"Sora", ui-sans-serif, system-ui, sans-serif',
};

export const FONT_BODY_STACK: Record<FontBody, string> = {
  "dm-sans": '"DM Sans", ui-sans-serif, system-ui, sans-serif',
  manrope: '"Manrope", ui-sans-serif, system-ui, sans-serif',
  "space-grotesk": '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
};

export function resolveTheme(partial?: Partial<StoreTheme> | null): StoreTheme {
  if (!partial) return { ...DEFAULT_THEME, sections: { ...DEFAULT_THEME.sections }, trust: { ...DEFAULT_THEME.trust } };
  return {
    preset: partial.preset ?? DEFAULT_THEME.preset,
    font_display: partial.font_display ?? DEFAULT_THEME.font_display,
    font_body: partial.font_body ?? DEFAULT_THEME.font_body,
    header_style: partial.header_style ?? DEFAULT_THEME.header_style,
    hero_headline: partial.hero_headline ?? null,
    hero_tagline: partial.hero_tagline ?? null,
    banner_url: partial.banner_url ?? null,
    sections: {
      ...DEFAULT_THEME.sections,
      ...(partial.sections || {}),
    },
    trust: {
      ...DEFAULT_THEME.trust,
      ...(partial.trust || {}),
    },
  };
}

export function googleFontsHref(theme: StoreTheme): string {
  const families: string[] = [];
  if (theme.font_display === "syne") families.push("Syne:wght@500;600;700;800");
  if (theme.font_display === "outfit") families.push("Outfit:wght@500;600;700;800");
  if (theme.font_display === "sora") families.push("Sora:wght@500;600;700;800");
  if (theme.font_body === "dm-sans") families.push("DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400");
  if (theme.font_body === "manrope") families.push("Manrope:wght@400;500;600;700");
  if (theme.font_body === "space-grotesk") families.push("Space+Grotesk:wght@400;500;600;700");
  return `https://fonts.googleapis.com/css2?${families.map((f) => `family=${f}`).join("&")}&display=swap`;
}
