import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LandingProductModule } from "../modules/landingModule.types";
import { FleetMapHero } from "../maps/FleetMapHero";
import {
  AntiConfusionBlock,
  LayoutShell,
  PricingAndFaqCta,
  ScenarioBlock,
  StoryBlock,
  useLayoutChrome,
} from "./layoutShared";

export function MapFleetLayout({ module }: { module: LandingProductModule }) {
  const { accent, displayClass, copy } = useLayoutChrome(module);

  return (
    <LayoutShell module={module}>
      <section
        id="hero"
        className="border-b border-black/5"
        style={{ backgroundColor: accent.surface }}
      >
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-24">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {copy.badge}
            </p>
            <h1 className={cn(displayClass, "mt-3 text-[clamp(2.3rem,4.5vw,3.6rem)]")}>
              {copy.title}{" "}
              <span style={{ color: accent.accent }}>{copy.titleAccent}</span>
            </h1>
            <p className="mt-4 text-[15px] text-muted-foreground">{copy.body}</p>
            <Link
              to={module.loginHref}
              className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[13px] font-semibold text-white"
              style={{ backgroundColor: accent.accent }}
            >
              Abrir Flotas <ArrowRight className="h-4 w-4" />
            </Link>
            <ul className="mt-8 space-y-2">
              {(copy.integrations ?? []).map((i) => (
                <li key={i.name} className="flex gap-2 text-[13px]">
                  <span className="font-semibold" style={{ color: accent.accent }}>
                    {i.name}
                  </span>
                  <span className="text-muted-foreground">{i.role}</span>
                </li>
              ))}
            </ul>
          </div>
          <FleetMapHero accent={accent.accent} />
        </div>
      </section>
      <StoryBlock module={module} />
      <ScenarioBlock module={module} />
      <AntiConfusionBlock module={module} />
      <PricingAndFaqCta module={module} />
    </LayoutShell>
  );
}
