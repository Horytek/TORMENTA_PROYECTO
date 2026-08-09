import { cn } from "@/lib/utils";
import type { LandingProductModule } from "../modules/landingModule.types";
import { ExperienceDemo } from "../experiences/ExperienceDemo";
import { ExperienceHeroCtas, LayoutShell, useLayoutChrome } from "./layoutShared";
import { ExperienceBody } from "./ExperienceBody";

export function PipelineLayout({ module }: { module: LandingProductModule }) {
  const { accent, displayClass, copy } = useLayoutChrome(module);

  return (
    <LayoutShell module={module}>
      <section id="hero" className="border-b border-black/5 py-16 md:py-20" style={{ background: accent.surface }}>
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: accent.accent }}
          >
            {module.name}
          </p>
          <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{copy.badge}</p>
          <h1 className={cn(displayClass, "mx-auto mt-3 max-w-3xl text-[clamp(2.3rem,5vw,3.8rem)]")}>
            {copy.title}{" "}
            <span style={{ color: accent.accent }}>{copy.titleAccent}</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] text-muted-foreground">{copy.body}</p>
          <div className="flex justify-center">
            <ExperienceHeroCtas module={module} primaryLabel="Probar embudo demo" />
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-4xl px-6">
          <ExperienceDemo
            experienceId={module.heroDemo}
            accent={accent.accent}
            theme={accent.demoTheme}
          />
        </div>
        <ol className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-2 px-6">
          {copy.steps.map((s, i) => (
            <li
              key={s.n}
              className="flex items-center gap-2 rounded-full border border-black/5 bg-white/80 px-4 py-2 text-[12px] font-medium"
            >
              <span style={{ color: accent.accent }}>{s.title}</span>
              {i < copy.steps.length - 1 ? <span className="text-muted-foreground">→</span> : null}
            </li>
          ))}
        </ol>
      </section>
      <ExperienceBody module={module} />
    </LayoutShell>
  );
}
