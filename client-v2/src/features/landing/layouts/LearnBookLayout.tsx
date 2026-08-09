import { cn } from "@/lib/utils";
import type { LandingProductModule } from "../modules/landingModule.types";
import { ExperienceDemo } from "../experiences/ExperienceDemo";
import { ExperienceHeroCtas, LayoutShell, useLayoutChrome } from "./layoutShared";
import { ExperienceBody } from "./ExperienceBody";

export function LearnBookLayout({ module }: { module: LandingProductModule }) {
  const { accent, displayClass, copy } = useLayoutChrome(module);
  const isAgenda = module.productId === "agenda";

  return (
    <LayoutShell module={module}>
      <section
        id="hero"
        className="relative overflow-hidden border-b border-black/5 py-20 md:py-28"
        style={{ background: accent.surface }}
      >
        <div
          className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full opacity-30 blur-3xl"
          style={{ background: accent.accent }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: accent.accent }}
            >
              {module.name}
            </p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{copy.badge}</p>
            <h1 className={cn(displayClass, "mt-4 text-[clamp(2.5rem,5vw,3.9rem)]")}>
              {copy.title}
              <span className="mt-2 block text-muted-foreground">{copy.titleAccent}</span>
            </h1>
            <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">{copy.body}</p>
            <ExperienceHeroCtas
              module={module}
              primaryLabel={isAgenda ? "Reservar cita demo" : "Entrar como alumno demo"}
            />
          </div>
          <ExperienceDemo
            experienceId={module.heroDemo}
            accent={accent.accent}
            theme={accent.demoTheme}
          />
        </div>
      </section>
      <ExperienceBody module={module} />
    </LayoutShell>
  );
}
