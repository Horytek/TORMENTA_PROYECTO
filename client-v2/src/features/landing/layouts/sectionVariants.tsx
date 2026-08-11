import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LandingProductModule } from "../modules/landingModule.types";
import { ExperienceHeroCtas, useLayoutChrome } from "./layoutShared";

/** Banda signature tipo EcommerceSection — id="producto" */
export function SignatureBand({ module }: { module: LandingProductModule }) {
  const { accent, displayClass, copy } = useLayoutChrome(module);
  const bullets = copy.trust.slice(0, 3);
  const benefits = copy.highlights.slice(0, 4);

  return (
    <section
      id="producto"
      className="relative overflow-hidden border-b border-white/10 py-20 text-white md:py-28"
      style={{ backgroundColor: accent.ctaBand || accent.ink }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: accent.accent }}
      />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1fr]">
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: accent.accent }}
            >
              {module.name}
            </p>
            <span className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/85">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              {copy.badge}
            </span>
            <h2 className={cn(displayClass, "mt-5 text-[clamp(1.85rem,3.8vw,2.85rem)] text-white")}>
              {copy.title}{" "}
              <span className="text-white/55">{copy.titleAccent}</span>
            </h2>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/70">{copy.body}</p>
            <ul className="mt-6 space-y-2.5">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-[13px] text-white/90">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${accent.accent}55` }}
                  >
                    <Check className="h-3 w-3" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
            <ExperienceHeroCtas module={module} primaryLabel="Probar demo" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {benefits.map((h) => (
              <div
                key={h.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
              >
                <p className="text-[14px] font-semibold text-white">{h.title}</p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-white/65">{h.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Story en dos columnas con quote — variante “editorial” */
export function StoryEditorial({ module }: { module: LandingProductModule }) {
  const { accent, displayClass, copy } = useLayoutChrome(module);
  return (
    <section id="story" className="border-b border-black/5 py-20 md:py-28" style={{ background: accent.surface }}>
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Por qué existe
        </p>
        <h2 className={cn(displayClass, "mt-3 max-w-2xl text-[clamp(1.75rem,3.2vw,2.5rem)]")}>
          {copy.sectionTitles.story ?? "Vender donde ya habla tu cliente"}
        </h2>
        <blockquote
          className="mt-8 max-w-3xl border-l-[3px] pl-5 text-[clamp(1.1rem,1.8vw,1.3rem)] font-medium leading-snug"
          style={{ borderColor: accent.accent }}
        >
          {copy.story[0]}
        </blockquote>
        <div className="mt-6 max-w-2xl space-y-4 text-[15px] text-muted-foreground">
          {copy.story.slice(1).map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Features numeradas en rail vertical (no cards 01/02/03 genéricas del StoryBlock) */
export function FeatureTaxonomy({ module }: { module: LandingProductModule }) {
  const { accent, copy } = useLayoutChrome(module);
  const items = copy.surfaces?.length ? copy.surfaces : copy.highlights;
  return (
    <section id="incluye" className="border-b border-black/5 bg-background py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Lo que resuelve
        </p>
        <h2 className="mt-2 text-[clamp(1.5rem,2.8vw,2.1rem)] font-semibold tracking-tight">
          {copy.sectionTitles.surfaces ?? copy.sectionTitles.includes ?? "Capas del producto"}
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {items.map((item, i) => (
            <div
              key={"title" in item ? item.title : item.label}
              className="relative overflow-hidden rounded-2xl border border-black/5 bg-white p-6"
            >
              <span
                className="font-mono text-[28px] font-bold tabular-nums opacity-20"
                style={{ color: accent.accent }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="mt-2 text-[16px] font-semibold">
                {"title" in item ? item.title : item.label}
              </p>
              <p className="mt-2 text-[13px] text-muted-foreground">
                {"body" in item ? item.body : ""}
              </p>
            </div>
          ))}
        </div>
        {copy.trust.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {copy.trust.map((t) => (
              <span
                key={t}
                className="rounded-full px-3 py-1 text-[11px] font-medium"
                style={{ backgroundColor: `${accent.accent}18`, color: accent.ink }}
              >
                # {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/** Caso de operación — variante métricas grandes */
export function CaseMetrics({ module }: { module: LandingProductModule }) {
  const { accent, displayClass, copy } = useLayoutChrome(module);
  const sc = copy.scenario;
  return (
    <section id="flujo" className="border-b border-black/5 bg-background py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Caso de operación
            </p>
            <h2 className={cn(displayClass, "mt-2 text-[clamp(1.6rem,3vw,2.2rem)]")}>{sc.title}</h2>
            <p className="mt-3 max-w-xl text-[14px] text-muted-foreground">{sc.body}</p>
          </div>
          <span
            className="rounded-full px-3 py-1 text-[11px] font-medium text-white"
            style={{ backgroundColor: accent.accent }}
          >
            Escenario ilustrativo · no es un cliente real
          </span>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {sc.metrics.map((m) => (
            <div
              key={m.label}
              className="relative overflow-hidden rounded-2xl border border-black/5 bg-white p-6 shadow-sm"
            >
              <div
                className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-20"
                style={{ backgroundColor: accent.accent }}
              />
              <p className="text-[2rem] font-bold tabular-nums" style={{ color: accent.accent }}>
                {m.value}
              </p>
              <p className="mt-1 text-[13px] text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Cómo corre el día
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {copy.steps.map((s) => (
            <div key={s.n} className="rounded-xl border border-black/5 bg-white/80 p-4">
              <p className="font-mono text-[13px] font-semibold" style={{ color: accent.accent }}>
                {s.n} →
              </p>
              <p className="mt-1 text-[14px] font-semibold">{s.title}</p>
              <p className="mt-1 text-[12px] text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Journey horizontal tipo board (pipeline / ops) */
export function JourneyBoard({ module }: { module: LandingProductModule }) {
  const { accent, copy } = useLayoutChrome(module);
  return (
    <section id="flujo" className="border-b border-black/5 py-20" style={{ background: accent.sectionTint }}>
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Flujo
        </p>
        <h2 className="mt-2 text-[clamp(1.5rem,2.8vw,2.1rem)] font-semibold">
          {copy.sectionTitles.flow ?? "De punta a punta"}
        </h2>
        <div className="mt-8 flex gap-3 overflow-x-auto pb-2">
          {copy.steps.map((s, i) => (
            <div
              key={s.n}
              className="min-w-[200px] flex-1 rounded-2xl border border-black/5 bg-white p-5"
            >
              <div
                className="mb-3 h-1.5 w-12 rounded-full"
                style={{ backgroundColor: accent.accent, opacity: 0.4 + i * 0.2 }}
              />
              <p className="text-[12px] font-mono" style={{ color: accent.accent }}>
                {s.n}
              </p>
              <p className="mt-1 text-[15px] font-semibold">{s.title}</p>
              <p className="mt-2 text-[12px] text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Límites — variante lista densa vs cards */
export function LimitsDense({ module }: { module: LandingProductModule }) {
  const { accent, copy } = useLayoutChrome(module);
  return (
    <section className="border-b border-black/5 bg-background py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Límites claros</p>
        <h2 className="mt-2 text-[clamp(1.5rem,2.8vw,2.1rem)] font-semibold">
          {copy.sectionTitles.antiConfusion ?? `${module.name} no es…`}
        </h2>
        <p className="mt-3 max-w-xl text-[14px] text-muted-foreground">
          Cada producto Horytek tiene un job. Mezclarlos frustra al equipo.
        </p>
        <div className="mt-8 divide-y divide-black/5 rounded-2xl border border-black/5 bg-white">
          {copy.antiConfusion.map((row) => (
            <div key={row.other} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-baseline sm:gap-6">
              <p className="min-w-[140px] text-[13px] font-semibold" style={{ color: accent.accent }}>
                No es {row.other}
              </p>
              <p className="text-[13px] text-muted-foreground">{row.difference}</p>
            </div>
          ))}
        </div>
        {copy.notIncludes.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-black/15 px-4 py-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Fuera de alcance
            </span>
            {copy.notIncludes.map((n) => (
              <span
                key={n}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground"
              >
                <X className="h-3 w-3" /> {n}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function LimitsCards({ module }: { module: LandingProductModule }) {
  const { accent, copy } = useLayoutChrome(module);
  return (
    <section className="border-b border-black/5 py-20" style={{ background: accent.surface }}>
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Límites claros</p>
        <h2 className="mt-2 text-[clamp(1.5rem,2.8vw,2.1rem)] font-semibold">
          {module.name} no es…
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {copy.antiConfusion.map((row) => (
            <div key={row.other} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: accent.accent }}
              >
                <X className="h-4 w-4" />
              </span>
              <p className="mt-3 text-[14px] font-semibold" style={{ color: accent.accent }}>
                No es {row.other}
              </p>
              <p className="mt-2 text-[13px] text-muted-foreground">{row.difference}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
