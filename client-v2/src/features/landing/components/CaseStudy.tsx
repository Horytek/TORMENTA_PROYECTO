import { Database, Radio, LayoutDashboard, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { POCKET_CASE_STUDY, TECH_STACK, type Mode } from "../data/landing.data";

interface Props {
  mode: Mode;
}

export function CaseStudy({ mode }: Props) {
  const isPocket = mode === "pocket";

  return (
    <section
      id="rendimiento"
      className={cn(
        "relative border-b border-border/60 py-24 md:py-32",
        isPocket ? "bg-amber-500/[0.04]" : "bg-background",
      )}
    >
      <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-10">
          <div>
            <div
              className={cn(
                "num mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]",
                isPocket ? "text-amber-600" : "text-emerald-600",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 animate-pulse rounded-full",
                  isPocket ? "bg-amber-500" : "bg-emerald-500",
                )}
              />
              {isPocket ? POCKET_CASE_STUDY.eyebrow : "Rendimiento Comprobado"}
            </div>
            <h2 className="text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
              {isPocket ? POCKET_CASE_STUDY.title : "Arquitectura diseñada para velocidad y escala."}
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              {isPocket ? POCKET_CASE_STUDY.body : "Olvida las cargas lentas. Nuestra infraestructura basada en WebSockets y caché inteligente garantiza que tu operación nunca se detenga."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {(isPocket ? POCKET_CASE_STUDY.stats : [
              { label: "Latencia de red", value: "<100ms", chip: "Tiempo real" },
              { label: "Disponibilidad", value: "99.9%", chip: "SLA garantizado" },
            ]).map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-brand/40"
              >
                <p className="num text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {stat.label}
                </p>
                <p className="num mt-2 text-3xl font-semibold leading-none tracking-tight text-foreground sm:text-4xl">
                  {stat.value}
                </p>
                <span
                  className={cn(
                    "num mt-3 inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-medium",
                    isPocket
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      isPocket ? "bg-amber-500" : "bg-emerald-500",
                    )}
                  />
                  {stat.chip}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-border bg-secondary/20 p-6 md:p-8">
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
              backgroundSize: "30px 30px",
            }}
          />
          <div className="relative space-y-3">
            {TECH_STACK.map((tech) => (
              <StackCard key={tech.title} tech={tech} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

interface StackTech {
  title: string;
  subtitle: string;
  status: string;
  tone: "blue" | "neutral" | "purple";
}

const TONE_STYLES: Record<StackTech["tone"], { icon: LucideIcon; chip: string; iconBg: string; iconColor: string }> = {
  blue: {
    icon: Database,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    chip: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
  },
  neutral: {
    icon: Radio,
    iconBg: "bg-secondary",
    iconColor: "text-foreground",
    chip: "text-foreground bg-foreground/5 border-foreground/10",
  },
  purple: {
    icon: LayoutDashboard,
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-500",
    chip: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
  },
};

function StackCard({ tech }: { tech: StackTech }) {
  const tone = TONE_STYLES[tech.tone];
  const Icon = tone.icon;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-[0_1px_0_0_hsl(var(--border))]">
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border",
          tone.iconBg,
          tone.iconColor,
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[14px] font-semibold leading-tight tracking-tight text-foreground">
          {tech.title}
        </p>
        <p className="num text-[11px] text-muted-foreground">{tech.subtitle}</p>
      </div>
      <span
        className={cn(
          "num ml-auto rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em]",
          tone.chip,
        )}
      >
        {tech.status}
      </span>
    </div>
  );
}