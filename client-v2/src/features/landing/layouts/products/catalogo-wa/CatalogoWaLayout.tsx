import { useState } from "react";
import { Check, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LandingProductModule } from "../../../modules/landingModule.types";
import { ExperienceDemo } from "../../../experiences/ExperienceDemo";
import {
  ExperienceHeroCtas,
  LayoutShell,
  PricingAndFaqCta,
  useLayoutChrome,
} from "../../layoutShared";
import { LimitsDense } from "../../sectionVariants";
import {
  CatalogoBarrioInteractive,
  CatalogoCasoInteractive,
  CatalogoPorQueInteractive,
  CatalogoSuperficiesInteractive,
} from "./catalogoWaSections";

/** Landing Catálogo WA — secciones interactivas. */
export function CatalogoWaLayout({ module }: { module: LandingProductModule }) {
  const { accent, displayClass, copy } = useLayoutChrome(module);
  const [focus, setFocus] = useState(0);
  const highlights = copy.highlights;

  return (
    <LayoutShell module={module}>
      <section
        id="hero"
        className="relative overflow-hidden border-b border-black/5"
        style={{ background: accent.surface }}
      >
        <div className="lp-hero-wash" aria-hidden />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--lp-accent) 28%, transparent) 1px, transparent 0)",
            backgroundSize: "22px 22px",
            maskImage: "linear-gradient(180deg, #000 0%, transparent 78%)",
          }}
        />

        <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16 md:py-24 lg:flex-row lg:items-stretch">
          <div className="flex flex-1 flex-col justify-center lp-rise">
            <div className="flex flex-wrap items-center gap-2">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.22em]"
                style={{ color: accent.accent }}
              >
                Horytek · {module.name}
              </p>
              <span
                className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white"
                style={{ backgroundColor: accent.accent }}
              >
                {copy.badge}
              </span>
            </div>
            <h1
              className={cn(
                displayClass,
                "mt-5 max-w-xl text-[clamp(2.4rem,5vw,3.75rem)] text-balance"
              )}
            >
              {copy.title}
              <span className="mt-1 block text-muted-foreground">{copy.titleAccent}</span>
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground text-pretty">
              {copy.body}
            </p>
            <ExperienceHeroCtas module={module} primaryLabel="Probar comercio demo" />
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
              {copy.trust.map((t) => (
                <li
                  key={t}
                  className="flex items-center gap-2 text-[12px] font-medium text-foreground/80"
                >
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: accent.accent }}
                  >
                    <Check className="h-3 w-3" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex-1 lp-fade" style={{ animationDelay: "120ms" }}>
            <ExperienceDemo
              experienceId={module.heroDemo}
              accent={accent.accent}
              theme={accent.demoTheme}
            />
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" style={{ color: accent.accent }} />
              Interactivo: arma el carrito y mira el WhatsApp que sale
            </p>
          </div>
        </div>
      </section>

      <section
        id="producto"
        className="relative overflow-hidden border-b border-white/10 py-16 text-white md:py-20"
        style={{ backgroundColor: accent.ctaBand || accent.ink }}
      >
        <div className="relative mx-auto max-w-6xl px-6">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: accent.accent }}
          >
            {module.name}
          </p>
          <h2 className={cn(displayClass, "mt-3 max-w-2xl text-[clamp(1.7rem,3.4vw,2.5rem)] text-white")}>
            {copy.title}{" "}
            <span className="text-white/55">{copy.titleAccent}</span>
          </h2>
          <div className="mt-8 flex flex-wrap gap-2">
            {highlights.map((h, i) => (
              <button
                key={h.title}
                type="button"
                onClick={() => setFocus(i)}
                className={cn(
                  "rounded-full border px-4 py-2 text-[13px] font-semibold transition-all",
                  focus === i
                    ? "border-transparent bg-white text-[#0f172a]"
                    : "border-white/20 bg-white/5 text-white/85 hover:bg-white/10"
                )}
              >
                {h.title}
              </button>
            ))}
          </div>
          <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-white/75">
            {highlights[focus]?.body}
          </p>
          <ExperienceHeroCtas module={module} primaryLabel="Probar demo" />
        </div>
      </section>

      <CatalogoBarrioInteractive module={module} />
      <CatalogoPorQueInteractive module={module} />
      <CatalogoSuperficiesInteractive module={module} />
      <CatalogoCasoInteractive module={module} />
      <LimitsDense module={module} />
      <PricingAndFaqCta module={module} />
    </LayoutShell>
  );
}
