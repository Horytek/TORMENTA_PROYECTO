import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LandingProductModule } from "../modules/landingModule.types";
import { ShipMapHero } from "../maps/ShipMapHero";
import {
  AntiConfusionBlock,
  LayoutShell,
  PricingAndFaqCta,
  ScenarioBlock,
  StoryBlock,
  useLayoutChrome,
} from "./layoutShared";

export function ShipLayout({ module }: { module: LandingProductModule }) {
  const { accent, displayClass, copy } = useLayoutChrome(module);

  return (
    <LayoutShell module={module}>
      <section id="hero" className="border-b border-black/5 py-16 md:py-24" style={{ background: accent.surface }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: accent.accent }}>
              {copy.badge}
            </p>
            <h1 className={cn(displayClass, "mt-3 text-[clamp(2.3rem,4.8vw,3.7rem)]")}>
              {copy.title} <span className="text-muted-foreground">{copy.titleAccent}</span>
            </h1>
            <p className="mt-4 text-[15px] text-muted-foreground">{copy.body}</p>
            <Link
              to={module.loginHref}
              className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[13px] font-semibold text-white"
              style={{ backgroundColor: accent.accent }}
            >
              Ver guías <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10">
            <ShipMapHero accent={accent.accent} />
          </div>
        </div>
      </section>
      <StoryBlock module={module} />
      <ScenarioBlock module={module} />
      <AntiConfusionBlock module={module} />
      <PricingAndFaqCta module={module} />
    </LayoutShell>
  );
}
