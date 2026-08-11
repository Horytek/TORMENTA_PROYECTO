export type ThemePreset = "nocturna" | "clara" | "retail" | "store";
export type FontDisplay = "syne" | "outfit" | "sora";
export type FontBody = "dm-sans" | "manrope" | "space-grotesk";
export type HeaderStyle = "dark" | "light" | "accent";
export type ColorSchemePref = "system" | "light" | "dark";
export type ResolvedScheme = "light" | "dark";
export type NavStyle = "text" | "pill" | "soft" | "underline";
export type NavItemKind = "all" | "category" | "link";

export type NavItem = {
  id: string;
  label: string;
  kind: NavItemKind;
  /** Filtra productos por esta categoría (kind=category) */
  category?: string | null;
  /** Ruta interna (#catalogo, /tienda/…) o URL externa (kind=link) */
  href?: string | null;
  enabled: boolean;
};

export type NavConfig = {
  show_categories: boolean;
  style: NavStyle;
  label_all: string;
  max_items: number;
  show_counts: boolean;
  /**
   * Menú personalizado. Vacío = automático desde categorías del catálogo.
   * Si hay ítems, solo se muestran los enabled (en ese orden).
   */
  items: NavItem[];
};

export type ResolvedNavEntry = {
  id: string;
  label: string;
  kind: NavItemKind;
  category: string | null;
  href: string | null;
  count?: number;
};

export type RowMode = "newest" | "category" | "ids" | "low_stock" | "price_asc";
export type BrowseFacet = "category" | "price" | "stock" | "tags";

export type StoreModule =
  | {
      id: string;
      type: "spotlight";
      enabled: boolean;
      config: { product_ids?: number[]; autoplay_ms?: number; cta_label?: string };
    }
  | {
      id: string;
      type: "featured";
      enabled: boolean;
      config: { product_ids?: number[]; layout?: "duo" | "trio" };
    }
  | {
      id: string;
      type: "rows";
      enabled: boolean;
      config: {
        rows: {
          title: string;
          eyebrow?: string;
          mode: RowMode;
          category?: string;
          product_ids?: number[];
          limit?: number;
        }[];
      };
    }
  | {
      id: string;
      type: "categories";
      enabled: boolean;
      config: { style?: "chips" | "tiles" };
    }
  | {
      id: string;
      type: "trust";
      enabled: boolean;
      config: { items?: { title: string; subtitle?: string }[] };
    }
  | {
      id: string;
      type: "promo";
      enabled: boolean;
      config: { headline: string; body?: string; image_url?: string; cta_label?: string; cta_href?: string };
    }
  | {
      id: string;
      type: "browse";
      enabled: boolean;
      config: {
        title?: string;
        layout?: "sidebar" | "topbar";
        facets?: BrowseFacet[];
        dense_default?: boolean;
      };
    }
  | {
      id: string;
      type: "faq";
      enabled: boolean;
      config: { items: { q: string; a: string }[] };
    };

export type QuickActionsConfig = {
  cart_fab?: boolean;
  quick_add?: boolean;
  whatsapp?: boolean;
};

export type StoreTheme = {
  preset: ThemePreset;
  font_display: FontDisplay;
  font_body: FontBody;
  header_style: HeaderStyle;
  nav: NavConfig;
  hero_headline: string | null;
  hero_tagline: string | null;
  banner_url: string | null;
  /** @deprecated migrado a modules */
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
  modules: StoreModule[];
  color_scheme_default: ColorSchemePref;
  allow_visitor_scheme_toggle: boolean;
  quick_actions: QuickActionsConfig;
  surfaces?: Partial<{ ink: string; fog: string; mist: string; stageFrom: string; stageTo: string }>;
};

type SurfaceSet = { ink: string; fog: string; mist: string; stageFrom: string; stageTo: string; elevated: string; border: string; muted: string };

export const PRESET_SURFACES: Record<ThemePreset, { light: SurfaceSet; dark: SurfaceSet }> = {
  nocturna: {
    light: {
      ink: "#0b1220",
      fog: "#e8eef5",
      mist: "#f4f7fb",
      stageFrom: "#0f172a",
      stageTo: "#1e293b",
      elevated: "#ffffff",
      border: "rgba(15,23,42,0.08)",
      muted: "#64748b",
    },
    dark: {
      ink: "#e8eef5",
      fog: "#1a2332",
      mist: "#0b1220",
      stageFrom: "#060a12",
      stageTo: "#121a28",
      elevated: "#141c2a",
      border: "rgba(232,238,245,0.08)",
      muted: "#94a3b8",
    },
  },
  clara: {
    light: {
      ink: "#0f172a",
      fog: "#f1f5f9",
      mist: "#ffffff",
      stageFrom: "#e2e8f0",
      stageTo: "#cbd5e1",
      elevated: "#ffffff",
      border: "rgba(15,23,42,0.08)",
      muted: "#64748b",
    },
    dark: {
      ink: "#f1f5f9",
      fog: "#1e293b",
      mist: "#0f172a",
      stageFrom: "#0f172a",
      stageTo: "#1e293b",
      elevated: "#1e293b",
      border: "rgba(241,245,249,0.08)",
      muted: "#94a3b8",
    },
  },
  retail: {
    light: {
      ink: "#111827",
      fog: "#f3f4f6",
      mist: "#fafafa",
      stageFrom: "#1f2937",
      stageTo: "#374151",
      elevated: "#ffffff",
      border: "rgba(17,24,39,0.08)",
      muted: "#6b7280",
    },
    dark: {
      ink: "#f3f4f6",
      fog: "#1f2937",
      mist: "#111827",
      stageFrom: "#030712",
      stageTo: "#1f2937",
      elevated: "#1f2937",
      border: "rgba(243,244,246,0.08)",
      muted: "#9ca3af",
    },
  },
  store: {
    light: {
      ink: "#0a0e14",
      fog: "#eef1f5",
      mist: "#f7f8fa",
      stageFrom: "#12181f",
      stageTo: "#1c2430",
      elevated: "#ffffff",
      border: "rgba(10,14,20,0.1)",
      muted: "#5c6b7a",
    },
    dark: {
      ink: "#eef1f5",
      fog: "#161b22",
      mist: "#0a0e14",
      stageFrom: "#05070a",
      stageTo: "#12181f",
      elevated: "#12181f",
      border: "rgba(238,241,245,0.08)",
      muted: "#8b9aab",
    },
  },
};

export const DEFAULT_MODULES: StoreModule[] = [
  { id: "spotlight", type: "spotlight", enabled: true, config: { autoplay_ms: 6000, cta_label: "Ver más" } },
  { id: "featured", type: "featured", enabled: true, config: { layout: "duo" } },
  {
    id: "rows",
    type: "rows",
    enabled: true,
    config: {
      rows: [
        { title: "Recién llegados", eyebrow: "Novedades", mode: "newest", limit: 10 },
        { title: "En stock", eyebrow: "Disponible", mode: "low_stock", limit: 10 },
      ],
    },
  },
  { id: "categories", type: "categories", enabled: true, config: { style: "chips" } },
  { id: "trust", type: "trust", enabled: true, config: {} },
  {
    id: "browse",
    type: "browse",
    enabled: true,
    config: {
      title: "Catálogo",
      layout: "sidebar",
      facets: ["category", "price", "stock", "tags"],
      dense_default: true,
    },
  },
];

export const DEFAULT_NAV: NavConfig = {
  show_categories: true,
  style: "soft",
  label_all: "Todo",
  max_items: 6,
  show_counts: false,
  items: [],
};

function newNavId() {
  return `nav_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function buildNavItemsFromCatalog(
  categorias: { nombre: string }[],
  labelAll = "Todo"
): NavItem[] {
  const all: NavItem = {
    id: newNavId(),
    label: labelAll,
    kind: "all",
    category: null,
    href: null,
    enabled: true,
  };
  const cats = categorias.map((c) => ({
    id: newNavId(),
    label: c.nombre,
    kind: "category" as const,
    category: c.nombre,
    href: null,
    enabled: true,
  }));
  return [all, ...cats];
}

function normalizeNavItem(raw: Record<string, unknown>): NavItem | null {
  const kinds: NavItemKind[] = ["all", "category", "link"];
  const kind = kinds.includes(raw.kind as NavItemKind) ? (raw.kind as NavItemKind) : "category";
  const label = typeof raw.label === "string" ? raw.label.trim().slice(0, 40) : "";
  if (!label) return null;
  const id = typeof raw.id === "string" && raw.id ? raw.id : newNavId();
  return {
    id,
    label,
    kind,
    category: typeof raw.category === "string" ? raw.category.trim().slice(0, 80) || null : null,
    href: typeof raw.href === "string" ? raw.href.trim().slice(0, 512) || null : null,
    enabled: raw.enabled !== false,
  };
}

/** Resuelve qué se muestra en el header: menú custom o auto desde catálogo. */
export function resolveNavEntries(
  nav: NavConfig,
  categorias: { nombre: string; count: number }[]
): ResolvedNavEntry[] {
  const max = Math.min(12, Math.max(1, nav.max_items || 6));
  const countOf = (nombre: string | null) => {
    if (!nombre) return categorias.reduce((s, c) => s + c.count, 0);
    return categorias.find((c) => c.nombre === nombre)?.count;
  };

  const custom = (nav.items || []).filter((i) => i.enabled !== false);
  if (custom.length > 0) {
    return custom.slice(0, max).map((i) => ({
      id: i.id,
      label: i.label,
      kind: i.kind,
      category: i.kind === "category" ? i.category || null : null,
      href: i.kind === "link" ? i.href || null : null,
      count: i.kind === "category" ? countOf(i.category || null) : i.kind === "all" ? countOf(null) : undefined,
    }));
  }

  const all: ResolvedNavEntry = {
    id: "auto-all",
    label: nav.label_all || "Todo",
    kind: "all",
    category: null,
    href: null,
    count: countOf(null),
  };
  const cats = categorias.slice(0, max).map((c) => ({
    id: `auto-${c.nombre}`,
    label: c.nombre,
    kind: "category" as const,
    category: c.nombre,
    href: null,
    count: c.count,
  }));
  return [all, ...cats];
}

export const DEFAULT_THEME: StoreTheme = {
  preset: "store",
  font_display: "outfit",
  font_body: "manrope",
  header_style: "dark",
  nav: { ...DEFAULT_NAV },
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
  modules: DEFAULT_MODULES,
  color_scheme_default: "system",
  allow_visitor_scheme_toggle: true,
  quick_actions: { cart_fab: true, quick_add: true, whatsapp: true },
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

function sectionsToModules(sections: StoreTheme["sections"]): StoreModule[] {
  return [
    { id: "spotlight", type: "spotlight", enabled: sections.stage, config: { autoplay_ms: 6000 } },
    { id: "featured", type: "featured", enabled: sections.stories, config: { layout: "duo" } },
    {
      id: "rows",
      type: "rows",
      enabled: sections.rails,
      config: {
        rows: [
          { title: "Recién llegados", eyebrow: "Novedades", mode: "newest", limit: 10 },
          { title: "Selección", eyebrow: "Catálogo", mode: "newest", limit: 10 },
        ],
      },
    },
    { id: "categories", type: "categories", enabled: sections.categories, config: { style: "chips" } },
    { id: "trust", type: "trust", enabled: sections.trust, config: {} },
    {
      id: "browse",
      type: "browse",
      enabled: true,
      config: { title: "Catálogo", layout: "sidebar", facets: ["category", "price", "stock", "tags"], dense_default: true },
    },
  ];
}

function normalizeModule(raw: Record<string, unknown>): StoreModule | null {
  const typeMap: Record<string, StoreModule["type"]> = {
    stage: "spotlight",
    spotlight: "spotlight",
    stories: "featured",
    featured: "featured",
    rails: "rows",
    rows: "rows",
    categories: "categories",
    trust: "trust",
    promo: "promo",
    browse: "browse",
    catalog: "browse",
    faq: "faq",
  };
  const rawType = String(raw.type || "");
  const type = typeMap[rawType];
  if (!type) return null;
  const id = typeof raw.id === "string" ? raw.id : type;
  const enabled = raw.enabled !== false;
  const config = (raw.config && typeof raw.config === "object" ? raw.config : {}) as StoreModule["config"];
  return { id, type, enabled, config } as StoreModule;
}

export function resolveTheme(partial?: Partial<StoreTheme> | null): StoreTheme {
  const base = {
    ...DEFAULT_THEME,
    sections: { ...DEFAULT_THEME.sections },
    trust: { ...DEFAULT_THEME.trust },
    nav: { ...DEFAULT_THEME.nav },
    quick_actions: { ...DEFAULT_THEME.quick_actions },
    modules: [...DEFAULT_THEME.modules],
  };
  if (!partial) return base;

  const sections = {
    ...DEFAULT_THEME.sections,
    ...(partial.sections || {}),
  };

  let modules: StoreModule[];
  if (Array.isArray((partial as { modules?: unknown }).modules) && (partial as { modules: unknown[] }).modules.length > 0) {
    modules = (partial as { modules: Record<string, unknown>[] }).modules
      .map(normalizeModule)
      .filter((m): m is StoreModule => Boolean(m));
    if (modules.length === 0) modules = sectionsToModules(sections);
  } else if (partial.sections) {
    modules = sectionsToModules(sections);
  } else {
    modules = [...DEFAULT_MODULES];
  }

  const preset = (partial.preset as ThemePreset) || DEFAULT_THEME.preset;
  const validPresets: ThemePreset[] = ["nocturna", "clara", "retail", "store"];
  const navStyles: NavStyle[] = ["text", "pill", "soft", "underline"];
  const navPartial = partial.nav || {};
  const navStyle = navStyles.includes(navPartial.style as NavStyle)
    ? (navPartial.style as NavStyle)
    : DEFAULT_NAV.style;
  const rawItems = Array.isArray(navPartial.items) ? navPartial.items : DEFAULT_NAV.items;
  const navItems = rawItems
    .map((it) => normalizeNavItem(it as unknown as Record<string, unknown>))
    .filter((it): it is NavItem => Boolean(it))
    .slice(0, 20);

  return {
    preset: validPresets.includes(preset) ? preset : "store",
    font_display: partial.font_display ?? DEFAULT_THEME.font_display,
    font_body: partial.font_body ?? DEFAULT_THEME.font_body,
    header_style: partial.header_style ?? DEFAULT_THEME.header_style,
    nav: {
      show_categories: navPartial.show_categories ?? DEFAULT_NAV.show_categories,
      style: navStyle,
      label_all: (navPartial.label_all?.trim() || DEFAULT_NAV.label_all).slice(0, 40),
      max_items: Math.min(12, Math.max(2, Number(navPartial.max_items) || DEFAULT_NAV.max_items)),
      show_counts: navPartial.show_counts ?? DEFAULT_NAV.show_counts,
      items: navItems,
    },
    hero_headline: partial.hero_headline ?? null,
    hero_tagline: partial.hero_tagline ?? null,
    banner_url: partial.banner_url ?? null,
    sections,
    trust: { ...DEFAULT_THEME.trust, ...(partial.trust || {}) },
    modules,
    color_scheme_default: partial.color_scheme_default ?? DEFAULT_THEME.color_scheme_default,
    allow_visitor_scheme_toggle:
      partial.allow_visitor_scheme_toggle ?? DEFAULT_THEME.allow_visitor_scheme_toggle,
    quick_actions: { ...DEFAULT_THEME.quick_actions, ...(partial.quick_actions || {}) },
    surfaces: partial.surfaces,
  };
}

export function resolveScheme(
  pref: ColorSchemePref,
  systemDark: boolean
): ResolvedScheme {
  if (pref === "light") return "light";
  if (pref === "dark") return "dark";
  return systemDark ? "dark" : "light";
}

export function surfacesFor(theme: StoreTheme, scheme: ResolvedScheme): SurfaceSet {
  const pack = PRESET_SURFACES[theme.preset] || PRESET_SURFACES.store;
  const base = pack[scheme];
  if (!theme.surfaces) return base;
  return { ...base, ...theme.surfaces };
}

export function googleFontsHref(theme: StoreTheme): string {
  const families: string[] = [];
  if (theme.font_display === "syne") families.push("Syne:wght@500;600;700;800");
  if (theme.font_display === "outfit") families.push("Outfit:wght@500;600;700;800");
  if (theme.font_display === "sora") families.push("Sora:wght@500;600;700;800");
  if (theme.font_body === "dm-sans")
    families.push("DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400");
  if (theme.font_body === "manrope") families.push("Manrope:wght@400;500;600;700");
  if (theme.font_body === "space-grotesk") families.push("Space+Grotesk:wght@400;500;600;700");
  return `https://fonts.googleapis.com/css2?${families.map((f) => `family=${f}`).join("&")}&display=swap`;
}

export const SCHEME_STORAGE_PREFIX = "vitrina-scheme:";
