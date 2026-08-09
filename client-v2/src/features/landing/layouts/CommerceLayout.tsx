import { cn } from "@/lib/utils";
import type { LandingProductModule } from "../modules/landingModule.types";
import { ExperienceDemo } from "../experiences/ExperienceDemo";
import { ExperienceHeroCtas, LayoutShell, useLayoutChrome } from "./layoutShared";
import { ExperienceBody } from "./ExperienceBody";

export function CommerceLayout({ module }: { module: LandingProductModule }) {
  const { accent, displayClass, copy } = useLayoutChrome(module);

  return (
    <LayoutShell module={module}>
      <section id="hero" className="border-b border-black/5" style={{ background: accent.surface }}>
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 md:py-24 lg:flex-row lg:items-stretch">
          <div className="flex flex-1 flex-col justify-center">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: accent.accent }}
            >
              {module.name}
            </p>
            <p
              className="mt-2 w-fit rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white"
              style={{ backgroundColor: accent.accent }}
            >
              {copy.badge}
            </p>
            <h1 className={cn(displayClass, "mt-5 text-[clamp(2.3rem,4.8vw,3.6rem)]")}>
              {copy.title}
              <span className="block text-muted-foreground">{copy.titleAccent}</span>
            </h1>
            <p className="mt-4 max-w-md text-[15px] text-muted-foreground">{copy.body}</p>
            <ExperienceHeroCtas module={module} primaryLabel="Probar comercio demo" />
          </div>
          <div className="flex-1">
            <ExperienceDemo
              experienceId={module.heroDemo}
              accent={accent.accent}
              theme={accent.demoTheme}
            />
          </div>
        </div>
        {(copy.integrations ?? copy.surfaces)?.length ? (
          <div className="border-t border-black/5 bg-white/40">
            <ul className="mx-auto flex max-w-6xl flex-wrap gap-6 px-6 py-6">
              {(copy.integrations ?? copy.surfaces ?? []).map((item) => {
                const name = "name" in item ? item.name : item.label;
                const role = "role" in item ? item.role : item.body;
                return (
                  <li key={name} className="min-w-[140px]">
                    <p className="text-[13px] font-semibold" style={{ color: accent.accent }}>
                      {name}
                    </p>
                    <p className="text-[12px] text-muted-foreground">{role}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </section>
      <ExperienceBody module={module} />
    </LayoutShell>
  );
}
