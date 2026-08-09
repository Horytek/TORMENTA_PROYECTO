import type { LandingProductModule } from "./landingModule.types";
import type { Mode } from "../data/landing.data";
import { EXPERIENCE_MODULES } from "./experienceModules.data";
import { HORYTEK_PRODUCTS } from "@/features/platform/catalog/horytekProducts";
import { SALES_WHATSAPP_URL } from "../data/landing.data";

const emptyCopy = {
  badge: "",
  title: "",
  titleAccent: "",
  body: "",
  trust: [] as string[],
  sectionTitles: {},
  story: [] as string[],
  scenario: { title: "", body: "", metrics: [] as { label: string; value: string }[] },
  antiConfusion: [] as { other: string; difference: string }[],
  highlights: [] as { title: string; body: string }[],
  steps: [] as { n: string; title: string; body: string }[],
  faqs: [] as { q: string; a: string }[],
  notIncludes: [] as string[],
};

const LEGACY: LandingProductModule[] = [
  {
    productId: "erp",
    name: "ERP",
    experienceId: "legacy",
    layoutKitId: "legacy",
    accent: {
      accent: "#1e3a5f",
      surface: "#ffffff",
      ink: "#141414",
      headerBorder: "transparent",
      headerBg: "transparent",
      ctaClass: "",
      sectionTint: "",
      labelClass: "",
      ctaBand: "#1e3a5f",
      demoTheme: "paper",
    },
    sectionOrder: ["hero", "pricing", "faq", "cta"],
    renderer: "legacy",
    legacyMode: "standard" as Mode,
    copy: { ...emptyCopy, badge: "ERP" },
    heroDemo: "legacy",
    pricing: { eyebrow: "", title: "", body: "", layout: "cards-3", plans: [] },
    interaction: { motions: [] },
    loginHref: "/login?mode=erp",
  },
  {
    productId: "pocket",
    name: "Pocket",
    experienceId: "legacy",
    layoutKitId: "legacy",
    accent: {
      accent: "#d97706",
      surface: "#fffbeb",
      ink: "#141414",
      headerBorder: "#d977064d",
      headerBg: "#d977060d",
      ctaClass: "bg-amber-600 hover:bg-amber-700",
      sectionTint: "",
      labelClass: "text-amber-600",
      ctaBand: "#d97706",
      demoTheme: "warm",
    },
    sectionOrder: ["hero", "pricing", "faq", "cta"],
    renderer: "legacy",
    legacyMode: "pocket",
    copy: { ...emptyCopy, badge: "Pocket" },
    heroDemo: "legacy",
    pricing: { eyebrow: "", title: "", body: "", layout: "cards-3", plans: [] },
    interaction: { motions: [] },
    loginHref: "/login?mode=express",
  },
  {
    productId: "ecommerce",
    name: "Ecommerce",
    experienceId: "legacy",
    layoutKitId: "legacy",
    accent: {
      accent: "#0f766e",
      surface: "#f0fdfa",
      ink: "#141414",
      headerBorder: "#0f766e4d",
      headerBg: "#0f766e0d",
      ctaClass: "bg-teal-700 hover:bg-teal-800",
      sectionTint: "",
      labelClass: "text-teal-700",
      ctaBand: "#115e59",
      demoTheme: "cool",
    },
    sectionOrder: ["hero", "pricing", "faq", "cta"],
    renderer: "legacy",
    legacyMode: "ecommerce",
    copy: { ...emptyCopy, badge: "Ecommerce" },
    heroDemo: "legacy",
    pricing: { eyebrow: "", title: "", body: "", layout: "cards-2", plans: [] },
    interaction: { motions: [] },
    loginHref: "/login?mode=ecommerce",
  },
];

const BY_ID = new Map<string, LandingProductModule>([
  ...LEGACY.map((m) => [m.productId, m] as const),
  ...EXPERIENCE_MODULES.map((m) => [m.productId, m] as const),
]);

function fallbackModule(productId: string): LandingProductModule {
  const p = HORYTEK_PRODUCTS.find((x) => x.id === productId);
  const loginHref = `/login?mode=${p?.loginMode || "erp"}`;
  return {
    productId,
    name: p?.name ?? productId,
    experienceId: "ops-board",
    layoutKitId: "rail-ops",
    accent: {
      accent: "#475569",
      surface: "#F1F5F9",
      ink: "#1c1917",
      headerBorder: "#47556933",
      headerBg: "#47556914",
      ctaClass: "text-white",
      sectionTint: "#4755690d",
      labelClass: "",
      ctaBand: "#334155",
      demoTheme: "paper",
    },
    sectionOrder: ["hero", "trust", "job", "flow", "pricing", "faq", "cta"],
    renderer: "experience",
    copy: {
      badge: p?.name ?? productId,
      title: p?.job ?? "Producto Horytek",
      titleAccent: p?.name ?? "",
      body: p?.pitch ?? "Solución Horytek para tu operación.",
      trust: ["Job claro", "Admin listo", "Soporte WA"],
      sectionTitles: {
        job: "Para tu operación",
        flow: "Cómo empezar",
        faq: "Preguntas",
        cta: "Listo para probar",
        story: "Contexto",
        scenario: "Caso",
        antiConfusion: "Límites",
      },
      story: [p?.pitch ?? "Solución Horytek para tu operación."],
      scenario: {
        title: p?.name ?? productId,
        body: p?.job ?? "",
        metrics: [{ label: "Producto", value: p?.name ?? productId }],
      },
      antiConfusion: [
        { other: "ERP genérico", difference: "Este producto tiene job y superficies propias." },
      ],
      highlights: [
        { title: "Job claro", body: p?.job ?? "" },
        { title: "Superficies", body: (p?.surfaces ?? []).join(", ") },
        { title: "BD", body: p?.database || "Según producto" },
      ],
      steps: [
        { n: "01", title: "Configura", body: "Activa el producto en tu cuenta." },
        { n: "02", title: "Opera", body: "Usa admin y portales según el job." },
        { n: "03", title: "Escala", body: "Suma bundles cuando haga falta." },
      ],
      faqs: [
        { q: "¿Dónde empiezo?", a: "Elige un plan en la landing o entra con el modo de login del producto." },
        { q: "¿Dónde está la landing?", a: `/?product=${productId}` },
        { q: "¿Demo?", a: "Usa Probar demo en la landing o el acceso demo en /login." },
      ],
      notIncludes: p?.notIncludes ?? [],
    },
    heroDemo: "ops-board",
    pricing: {
      eyebrow: `Planes · ${p?.name ?? productId}`,
      title: "Hablemos de tu operación.",
      body: "Cotización según volumen.",
      layout: "cards-2",
      plans: [
        {
          id: "start",
          name: "Empezar",
          price: 0,
          unit: "consulta",
          description: "Te armamos la propuesta.",
          features: ["Demo", "Alcance", "Onboarding"],
          highlight: true,
          cta: { label: "Contactar", href: SALES_WHATSAPP_URL },
        },
        {
          id: "login",
          name: "Ya soy cliente",
          price: 0,
          unit: "acceso",
          description: "Entra al producto.",
          features: ["Login", "Admin", "Soporte"],
          cta: { label: "Ingresar", href: loginHref },
        },
      ],
    },
    interaction: { motions: ["step-pulse", "counter"] },
    loginHref,
  };
}

export function getLandingModule(productId: string): LandingProductModule {
  return BY_ID.get(productId) ?? fallbackModule(productId);
}

export function listLandingModules(): LandingProductModule[] {
  return HORYTEK_PRODUCTS.map((p) => getLandingModule(p.id));
}
