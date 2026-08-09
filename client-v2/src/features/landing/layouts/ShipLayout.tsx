import { cn } from "@/lib/utils";
import type { LandingProductModule } from "../modules/landingModule.types";
import { ShipMapHero } from "../maps/ShipMapHero";
import { ExperienceHeroCtas, LayoutShell, useLayoutChrome } from "./layoutShared";
import { ExperienceBody } from "./ExperienceBody";

export function ShipLayout({ module }: { module: LandingProductModule }) {
  const { accent, displayClass, copy } = useLayoutChrome(module);

  return (
    <LayoutShell module={module}>
      <section id="hero" className="border-b border-black/5 py-16 md:py-24" style={{ background: accent.surface }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: accent.accent }}
            >
              {module.name}
            </p>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {copy.badge}
            </p>
            <h1 className={cn(displayClass, "mt-3 text-[clamp(2.3rem,4.8vw,3.7rem)]")}>
              {copy.title} <span className="text-muted-foreground">{copy.titleAccent}</span>
            </h1>
            <p className="mt-4 text-[15px] text-muted-foreground">{copy.body}</p>
            <ExperienceHeroCtas module={module} primaryLabel="Seguir guía demo" />
          </div>
          <div className="mt-10">
            <ShipMapHero accent={accent.accent} />
          </div>
        </div>
      </section>
      <ExperienceBody module={module} />
    </LayoutShell>
  );
}
