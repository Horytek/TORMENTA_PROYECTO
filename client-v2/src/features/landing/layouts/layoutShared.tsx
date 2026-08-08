import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, MapPin, Shield, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SALES_WHATSAPP_URL } from "../data/landing.data";
import type { LandingProductModule } from "../modules/landingModule.types";
import { PricingModular } from "../components/PricingModular";
import "../styles/experience-landing.css";

export function useLayoutChrome(module: LandingProductModule) {
  const { accent, typography } = module;
  const displayClass =
    typography?.display === "serif"
      ? "lp-display-serif"
      : typography?.display === "mono-num"
        ? "lp-display-mono"
        : "lp-display";

  const cssVars = {
    ["--lp-accent"]: accent.accent,
    ["--lp-surface"]: accent.surface,
    ["--lp-ink"]: accent.ink,
    ["--lp-section-tint"]: accent.sectionTint,
    ["--lp-cta-band"]: accent.ctaBand,
  } as CSSProperties;

  return { accent, displayClass, cssVars, copy: module.copy };
}

export function LayoutShell({
  module,
  children,
}: {
  module: LandingProductModule;
  children: ReactNode;
}) {
  const { cssVars } = useLayoutChrome(module);
  return (
    <div className="experience-landing min-h-screen w-full" style={cssVars}>
      {children}
    </div>
  );
}

export function StoryBlock({
  module,
  className,
}: {
  module: LandingProductModule;
  className?: string;
}) {
  const { displayClass, copy, accent } = useLayoutChrome(module);
  const pull = copy.story[0] ?? copy.body;
  const rest = copy.story.slice(1);

  return (
    <section
      id="story"
      className={cn("relative overflow-hidden border-b border-black/5 py-24 md:py-32", className)}
      style={{ backgroundColor: accent.surface }}
    >
      <div
        className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full opacity-25 blur-3xl"
        style={{ backgroundColor: accent.accent }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Por qué existe
            </p>
            <h2 className={cn(displayClass, "mt-3 text-[clamp(1.85rem,3.4vw,2.6rem)]")}>
              {copy.sectionTitles.story ?? "Cómo se vive el día a día"}
            </h2>
            <blockquote
              className="mt-8 border-l-[3px] pl-5 text-[clamp(1.15rem,2vw,1.35rem)] font-medium leading-snug text-foreground"
              style={{ borderColor: accent.accent }}
            >
              {pull}
            </blockquote>
            <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
              {rest.map((p) => (
                <p key={p.slice(0, 28)}>{p}</p>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Lo que resuelve
            </p>
            {copy.highlights.map((h, i) => (
              <div
                key={h.title}
                className="rounded-2xl border border-black/5 bg-white/80 p-5 shadow-[0_16px_40px_-28px_var(--lp-accent)] transition-transform duration-300 hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[12px] font-bold text-white"
                    style={{ backgroundColor: accent.accent }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-[15px] font-semibold text-foreground">{h.title}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{h.body}</p>
                  </div>
                </div>
              </div>
            ))}
            {copy.trust.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {copy.trust.map((t) => (
                  <li
                    key={t}
                    className="inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-white/70 px-3 py-1.5 text-[11px] font-medium"
                  >
                    <Sparkles className="h-3 w-3" style={{ color: accent.accent }} />
                    {t}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ScenarioBlock({ module }: { module: LandingProductModule }) {
  const { displayClass, copy, accent } = useLayoutChrome(module);
  const s = copy.scenario;

  return (
    <section
      id="scenario"
      className="relative border-b border-black/5 py-24 md:py-32"
      style={{ backgroundColor: accent.sectionTint }}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Caso de operación
            </p>
            <h2 className={cn(displayClass, "mt-3 text-[clamp(1.85rem,3.4vw,2.6rem)]")}>
              {s.title}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{s.body}</p>
          </div>
          <div
            className="rounded-2xl border px-4 py-3 text-[12px] font-medium"
            style={{ borderColor: `${accent.accent}44`, backgroundColor: `${accent.accent}12`, color: accent.accent }}
          >
            Escenario ilustrativo · no es un cliente real
          </div>
        </div>

        <ul
          className={cn(
            "mt-12 grid gap-4",
            s.metrics.length >= 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3",
          )}
        >
          {s.metrics.map((m) => (
            <li
              key={m.label}
              className="relative overflow-hidden rounded-2xl border border-black/5 bg-white px-6 py-7"
              style={{ boxShadow: `0 24px 50px -30px ${accent.accent}` }}
            >
              <div
                className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20"
                style={{ backgroundColor: accent.accent }}
                aria-hidden
              />
              <p
                className="relative font-mono text-[clamp(2rem,4vw,2.75rem)] font-semibold tabular-nums tracking-tight"
                style={{ color: accent.accent }}
              >
                {m.value}
              </p>
              <p className="relative mt-2 text-[13px] font-medium text-foreground">{m.label}</p>
            </li>
          ))}
        </ul>

        {copy.steps.length > 0 ? (
          <div className="mt-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Cómo corre el día
            </p>
            <ol className="mt-5 grid gap-3 md:grid-cols-3">
              {copy.steps.map((step, i) => (
                <li
                  key={step.n}
                  className="rounded-2xl border border-black/5 bg-white/85 p-5"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="font-mono text-[22px] font-semibold tabular-nums"
                      style={{ color: accent.accent }}
                    >
                      {step.n}
                    </span>
                    {i < copy.steps.length - 1 ? (
                      <span className="hidden text-muted-foreground md:inline" aria-hidden>
                        →
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-3 text-[15px] font-semibold">{step.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function AntiConfusionBlock({ module }: { module: LandingProductModule }) {
  const { displayClass, copy, accent } = useLayoutChrome(module);

  return (
    <section
      id="notFor"
      className="border-b border-black/5 py-24 md:py-32"
      style={{ backgroundColor: accent.surface }}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Límites claros
          </p>
          <h2 className={cn(displayClass, "mt-3 text-[clamp(1.85rem,3.4vw,2.6rem)]")}>
            {copy.sectionTitles.antiConfusion ?? `${module.name} no es…`}
          </h2>
          <p className="mt-3 text-[15px] text-muted-foreground">
            Cada producto Horytek tiene un job. Mezclarlos es la forma más rápida de frustrar al equipo.
          </p>
        </div>

        <ul className="mt-12 grid gap-4 md:grid-cols-3">
          {copy.antiConfusion.map((row) => (
            <li
              key={row.other}
              className="flex flex-col rounded-2xl border border-black/5 bg-white/80 p-6 shadow-[0_16px_40px_-28px_var(--lp-accent)]"
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${accent.accent}18` }}
                >
                  <X className="h-4 w-4" style={{ color: accent.accent }} />
                </span>
                <p className="text-[15px] font-semibold" style={{ color: accent.accent }}>
                  No es {row.other}
                </p>
              </div>
              <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">{row.difference}</p>
            </li>
          ))}
        </ul>

        {copy.notIncludes.length > 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-black/10 bg-white/50 p-6">
            <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Shield className="h-3.5 w-3.5" style={{ color: accent.accent }} />
              Fuera de alcance
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {copy.notIncludes.map((item) => (
                <li
                  key={item}
                  className="rounded-full bg-black/[0.04] px-3 py-1.5 text-[12px] text-muted-foreground"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function PricingAndFaqCta({ module }: { module: LandingProductModule }) {
  const { accent, displayClass, copy } = useLayoutChrome(module);
  return (
    <>
      <PricingModular
        pricing={module.pricing}
        accent={accent.accent}
        sectionTint={accent.sectionTint}
        titleClassName={displayClass}
      />
      <section
        id="faq"
        className="border-b border-black/5 py-24 md:py-28"
        style={{ backgroundColor: accent.surface }}
      >
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Preguntas reales
            </p>
            <h2 className={cn(displayClass, "mt-3 text-[clamp(1.75rem,3.2vw,2.4rem)]")}>
              {copy.sectionTitles.faq ?? "Antes de empezar"}
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
              Respuestas cortas para no venderte el producto equivocado. Si tu caso es borde, escríbenos.
            </p>
            <a
              href={SALES_WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-[13px] font-semibold"
              style={{ color: accent.accent }}
            >
              Hablar con ventas <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="divide-y divide-border/50 rounded-2xl border border-black/5 bg-white/75 px-5 shadow-[0_20px_50px_-32px_var(--lp-accent)]">
            {copy.faqs.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="cursor-pointer list-none text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
                  <span className="flex items-start justify-between gap-4">
                    {f.q}
                    <span className="text-muted-foreground transition-transform duration-300 group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <section
        id="cta"
        className="relative overflow-hidden py-24 md:py-28 text-white"
        style={{ backgroundColor: accent.ctaBand }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse 50% 80% at 15% 20%, #fff6, transparent 55%), radial-gradient(ellipse 40% 60% at 90% 80%, #0002, transparent 50%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
            <MapPin className="h-3.5 w-3.5" />
            Horytek · {module.name}
          </p>
          <h2 className={cn(displayClass, "mt-4 text-[clamp(1.9rem,3.8vw,2.75rem)] text-white")}>
            {copy.sectionTitles.cta ?? `Prueba ${module.name}`}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/80">
            Entra con tu cuenta o escríbenos por WhatsApp. Configuración guiada, límites claros, sin letra chica.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={module.loginHref}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-[13px] font-semibold text-foreground transition-transform hover:scale-[1.02]"
            >
              Ir al login <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={SALES_WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/45 px-6 py-3.5 text-[13px] font-semibold text-white"
            >
              WhatsApp ventas
            </a>
          </div>
          <ul className="mx-auto mt-10 flex max-w-lg flex-wrap justify-center gap-x-5 gap-y-2 text-[12px] text-white/75">
            {copy.trust.slice(0, 3).map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
