import { cn } from "@/lib/utils";
import type { LandingProductModule } from "../modules/landingModule.types";
import { ExperienceDemo } from "../experiences/ExperienceDemo";
import { ExperienceHeroCtas, LayoutShell, useLayoutChrome } from "./layoutShared";
import { ExperienceBody } from "./ExperienceBody";

export function PlantLayout({ module }: { module: LandingProductModule }) {
  const { accent, displayClass, copy } = useLayoutChrome(module);

  return (
    <LayoutShell module={module}>
      <section id="hero" className="border-b border-black/5 py-16 md:py-24" style={{ background: accent.surface }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-end">
            <div>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.22em]"
                style={{ color: accent.accent }}
              >
                {module.name}
              </p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{copy.badge}</p>
              <h1 className={cn(displayClass, "mt-3 text-[clamp(2.4rem,5vw,3.8rem)]")}>
                {copy.title}{" "}
                <em className="not-italic" style={{ color: accent.accent }}>
                  {copy.titleAccent}
                </em>
              </h1>
              <p className="mt-4 text-[15px] text-muted-foreground">{copy.body}</p>
              <ExperienceHeroCtas module={module} primaryLabel="Abrir planta demo" />
            </div>
            <div className="rounded-2xl border border-black/5 bg-white/50 p-2">
              <ExperienceDemo
                experienceId={module.heroDemo}
                accent={accent.accent}
                theme={accent.demoTheme}
              />
            </div>
          </div>
          <div
            className={cn(
              "mt-12 grid gap-px overflow-hidden rounded-2xl border border-black/5 bg-black/5",
              copy.steps.length >= 4 ? "md:grid-cols-4" : "md:grid-cols-3",
            )}
          >
            {copy.steps.map((s) => (
              <div key={s.n} className="bg-white/90 p-5">
                <p className="font-mono text-[20px]" style={{ color: accent.accent }}>
                  {s.n}
                </p>
                <p className="mt-2 text-[14px] font-semibold">{s.title}</p>
                <p className="mt-1 text-[12px] text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <ExperienceBody module={module} />
    </LayoutShell>
  );
}
