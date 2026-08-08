import { Link } from "react-router-dom";
import {
  ArrowRight,
  ClipboardCheck,
  MapPinned,
  MessageSquareText,
  Navigation,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LandingProductModule } from "../modules/landingModule.types";
import { ExperienceDemo } from "../experiences/ExperienceDemo";
import { CampoMapHero } from "../maps/CampoMapHero";
import {
  AntiConfusionBlock,
  LayoutShell,
  PricingAndFaqCta,
  ScenarioBlock,
  StoryBlock,
  useLayoutChrome,
} from "./layoutShared";

const CAMPO_DAY = [
  { time: "08:10", place: "Cliente Norte", status: "Check-in + nota", ok: true },
  { time: "09:40", place: "Cliente Este", status: "Check-in + foto fachada", ok: true },
  { time: "11:05", place: "Cliente Sur", status: "En ruta", ok: false },
  { time: "12:30", place: "Cliente Centro", status: "Pendiente", ok: false },
];

/** WMS / Despacho / Campo — layout ops asimétrico, denso */
export function RailOpsLayout({ module }: { module: LandingProductModule }) {
  const { accent, displayClass, copy } = useLayoutChrome(module);
  const isCampo = module.productId === "campo";

  return (
    <LayoutShell module={module}>
      <section
        id="hero"
        className="relative overflow-hidden border-b border-black/5"
        style={{ backgroundColor: accent.surface }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(${accent.accent}14 1px, transparent 1px),
              linear-gradient(90deg, ${accent.accent}14 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
            maskImage: "linear-gradient(180deg, black, transparent 85%)",
          }}
          aria-hidden
        />

        <div className="relative mx-auto grid max-w-6xl gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="flex flex-col justify-center border-b border-black/5 px-6 py-16 lg:border-b-0 lg:border-r lg:py-24">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{
                  borderColor: `${accent.accent}40`,
                  backgroundColor: `${accent.accent}14`,
                  color: accent.accent,
                }}
              >
                <Radio className="h-3 w-3" />
                {copy.badge} · ops en calle
              </span>
              {copy.trust.slice(0, 2).map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-black/5 bg-white/70 px-2.5 py-1 text-[10px] font-medium text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>

            <h1 className={cn(displayClass, "mt-5 text-[clamp(2.35rem,4.6vw,3.6rem)]")}>
              {copy.title}
              <br />
              <span className="text-muted-foreground">{copy.titleAccent}</span>
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              {copy.body}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {copy.steps.map((s) => (
                <div
                  key={s.n}
                  className="rounded-2xl border border-black/5 bg-white/80 p-3.5"
                >
                  <p className="font-mono text-[11px] tabular-nums" style={{ color: accent.accent }}>
                    {s.n}
                  </p>
                  <p className="mt-1 text-[13px] font-semibold">{s.title}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to={module.loginHref}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[13px] font-semibold text-white shadow-[0_12px_28px_-12px_var(--lp-accent)] transition-transform hover:scale-[1.02]"
                style={{ backgroundColor: accent.accent }}
              >
                Entrar a {module.name} <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-[12px] text-muted-foreground">
                Admin + vendedor · evidencia GPS
              </p>
            </div>
          </div>

          <div className="flex min-h-[400px] flex-col gap-3 p-4 lg:p-6">
            {isCampo ? (
              <CampoMapHero accent={accent.accent} />
            ) : (
              <ExperienceDemo
                experienceId={module.heroDemo}
                accent={accent.accent}
                theme={accent.demoTheme}
              />
            )}
          </div>
        </div>

        {isCampo ? (
          <div className="relative border-t border-black/5 bg-white/55">
            <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 lg:grid-cols-[1fr_1.2fr]">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Vista supervisor · mediodía
                </p>
                <h3 className={cn(displayClass, "mt-2 text-[1.35rem]")}>
                  No más “estoy en camino”.
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  Cada pin cuenta. El tablero muestra quién hizo check-in, quién dejó nota y quién
                  sigue en el aire — sin depender del CRM.
                </p>
                <ul className="mt-5 space-y-2.5">
                  {[
                    { icon: MapPinned, t: "Ruta del día cargada antes de salir" },
                    { icon: Navigation, t: "Check-in con pin GPS al llegar" },
                    { icon: MessageSquareText, t: "Nota o foto como evidencia" },
                    { icon: ClipboardCheck, t: "Cierre de visita visible para el jefe" },
                  ].map((row) => (
                    <li key={row.t} className="flex items-start gap-2.5 text-[13px]">
                      <row.icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accent.accent }} />
                      <span className="text-foreground/90">{row.t}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_20px_50px_-28px_var(--lp-accent)]">
                <div
                  className="flex items-center justify-between px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white"
                  style={{ backgroundColor: accent.ctaBand }}
                >
                  <span>Ruta Lima Este · hoy</span>
                  <span className="tabular-nums opacity-90">6 / 9</span>
                </div>
                <ul className="divide-y divide-black/5">
                  {CAMPO_DAY.map((row) => (
                    <li key={row.time} className="flex items-center gap-4 px-4 py-3.5">
                      <span className="w-12 font-mono text-[12px] tabular-nums text-muted-foreground">
                        {row.time}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold">{row.place}</p>
                        <p className="text-[11px] text-muted-foreground">{row.status}</p>
                      </div>
                      <span
                        className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]"
                        style={
                          row.ok
                            ? { backgroundColor: `${accent.accent}18`, color: accent.accent }
                            : { backgroundColor: "#0000000a", color: "#78716c" }
                        }
                      >
                        {row.ok ? "OK" : "…"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative border-t border-black/5 bg-white/40">
            <ul className="mx-auto flex max-w-6xl flex-wrap gap-6 px-6 py-8">
              {copy.highlights.map((h) => (
                <li key={h.title} className="min-w-[160px] max-w-[220px]">
                  <p className="text-[13px] font-semibold" style={{ color: accent.accent }}>
                    {h.title}
                  </p>
                  <p className="mt-1 text-[12px] text-muted-foreground">{h.body}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <StoryBlock module={module} />
      <ScenarioBlock module={module} />
      <AntiConfusionBlock module={module} />
      <PricingAndFaqCta module={module} />
    </LayoutShell>
  );
}
