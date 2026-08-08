import type { Mode } from "../data/landing.data";

export type LandingSectionId =
  | "hero"
  | "trust"
  | "surfaces"
  | "job"
  | "flow"
  | "proof"
  | "integrations"
  | "includes"
  | "notFor"
  | "pricing"
  | "faq"
  | "cta";

export type LayoutKitId =
  | "legacy"
  | "map-mobility"
  | "map-fleet"
  | "rail-ops"
  | "plant"
  | "commerce"
  | "pipeline"
  | "learn-book"
  | "ship";

export type ExperienceId =
  | "legacy"
  | "mobility-taxi"
  | "mobility-delivery"
  | "ops-board"
  | "ops-wms"
  | "ops-field"
  | "ops-fleet"
  | "commerce-b2b"
  | "commerce-sync"
  | "commerce-wa"
  | "pipeline-crm"
  | "pipeline-hire"
  | "learn-path"
  | "book-slot"
  | "ship-track"
  | "plant-ot"
  | "plant-taller"
  | "preorder";

export type DemoTheme = "ink" | "paper" | "warm" | "cool";

export type PricingLayout = "cards-3" | "cards-2" | "tier-list" | "usage-meter";

export interface LandingPricingPlan {
  id: string;
  name: string;
  price: number;
  unit: string;
  description: string;
  features: string[];
  highlight?: boolean;
  cta: { label: string; href: string };
}

export interface LandingPricingModule {
  eyebrow: string;
  title: string;
  body: string;
  billingToggle?: "monthlyAnnual" | "none";
  layout: PricingLayout;
  plans: LandingPricingPlan[];
  footnote?: string;
}

export interface LandingAccent {
  accent: string;
  surface: string;
  ink: string;
  headerBorder: string;
  headerBg: string;
  ctaClass: string;
  sectionTint: string;
  labelClass: string;
  ctaBand: string;
  demoTheme: DemoTheme;
}

export interface LandingSectionTitles {
  job?: string;
  flow?: string;
  proof?: string;
  surfaces?: string;
  integrations?: string;
  includes?: string;
  notFor?: string;
  pricing?: string;
  faq?: string;
  cta?: string;
  story?: string;
  scenario?: string;
  antiConfusion?: string;
}

export interface AntiConfusionRow {
  other: string;
  difference: string;
}

export interface LandingScenario {
  title: string;
  body: string;
  metrics: { label: string; value: string }[];
}

export interface LandingCopy {
  badge: string;
  title: string;
  titleAccent: string;
  body: string;
  trust: string[];
  sectionTitles: LandingSectionTitles;
  /** Narrativa de escenario (2–3 párrafos). */
  story: string[];
  scenario: LandingScenario;
  antiConfusion: AntiConfusionRow[];
  highlights: { title: string; body: string }[];
  steps: { n: string; title: string; body: string }[];
  faqs: { q: string; a: string }[];
  notIncludes: string[];
  surfaces?: { label: string; body: string }[];
  proofStats?: { value: string; label: string }[];
  integrations?: { name: string; role: string }[];
  audience?: { title: string; body: string }[];
}

export interface LandingProductModule {
  productId: string;
  name: string;
  experienceId: ExperienceId;
  layoutKitId: LayoutKitId;
  accent: LandingAccent;
  typography?: { display?: "serif" | "sans-tight" | "mono-num" };
  sectionOrder: LandingSectionId[];
  renderer: "legacy" | "experience";
  legacyMode?: Mode;
  copy: LandingCopy;
  heroDemo: ExperienceId;
  pricing: LandingPricingModule;
  interaction: {
    motions: Array<
      "path-draw" | "step-pulse" | "lane-slide" | "counter" | "pin-drop" | "progress-fill"
    >;
  };
  loginHref: string;
}
