import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { LandingProductModule } from "../../modules/landingModule.types";
import { ExperienceDemo } from "../../experiences/ExperienceDemo";
import {
  ExperienceHeroCtas,
  LayoutShell,
  PricingAndFaqCta,
  useLayoutChrome,
} from "../layoutShared";
import { LimitsCards, LimitsDense } from "../sectionVariants";

type LimitsMode = "dense" | "cards";

/** Shell común: hero + body interactivo + límites + pricing/faq. */
export function ProductExperienceShell({
  module,
  primaryLabel,
  heroExtra,
  heroMedia,
  limits = "dense",
  children,
}: {
  module: LandingProductModule;
  primaryLabel?: string;
  heroExtra?: ReactNode;
  /** Si se omite, usa ExperienceDemo del módulo. */
  heroMedia?: ReactNode;
  limits?: LimitsMode;
  children: ReactNode;
}) {
  const { accent, displayClass, copy } = useLayoutChrome(module);

  return (
    <LayoutShell module={module}>
      <section
        id="hero"
        className="relative overflow-hidden border-b border-black/5"
        style={{ background: accent.surface }}
      >
        <div className="lp-hero-wash" aria-hidden />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 md:py-24 lg:flex-row lg:items-stretch">
          <div className="flex flex-1 flex-col justify-center lp-rise">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: accent.accent }}
            >
              Horytek · {module.name}
            </p>
            <span
              className="mt-2 w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white"
              style={{ backgroundColor: accent.accent }}
            >
              {copy.badge}
            </span>
            <h1
              className={cn(
                displayClass,
                "mt-5 max-w-xl text-[clamp(2.2rem,4.8vw,3.5rem)] text-balance"
              )}
            >
              {copy.title}
              <span className="mt-1 block text-muted-foreground">{copy.titleAccent}</span>
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground text-pretty">
              {copy.body}
            </p>
            <ExperienceHeroCtas module={module} primaryLabel={primaryLabel} />
            {heroExtra}
          </div>
          <div className="flex-1 lp-fade">
            {heroMedia ?? (
              <ExperienceDemo
                experienceId={module.heroDemo}
                accent={accent.accent}
                theme={accent.demoTheme}
              />
            )}
          </div>
        </div>
      </section>
      {children}
      {limits === "cards" ? <LimitsCards module={module} /> : <LimitsDense module={module} />}
      <PricingAndFaqCta module={module} />
    </LayoutShell>
  );
}
