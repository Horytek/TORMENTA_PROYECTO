import { Link } from "react-router-dom";
import { ArrowRight, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SALES_WHATSAPP_URL } from "../data/landing.data";
import type { LandingProductModule } from "../modules/landingModule.types";
import { TaxiMapHero } from "../maps/TaxiMapHero";
import { DeliveryMapHero } from "../maps/DeliveryMapHero";
import {
  AntiConfusionBlock,
  LayoutShell,
  PricingAndFaqCta,
  ScenarioBlock,
  StoryBlock,
  useLayoutChrome,
} from "./layoutShared";

/** Hero mapa full-bleed + panel — Taxi / Delivery */
export function MapMobilityLayout({ module }: { module: LandingProductModule }) {
  const { accent, displayClass, copy } = useLayoutChrome(module);
  const isTaxi = module.productId === "taxi";

  return (
    <LayoutShell module={module}>
      <section id="hero" className="relative overflow-hidden border-b border-black/5">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, ${accent.surface} 0%, ${accent.sectionTint} 45%, transparent 70%)`,
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 pb-10 pt-16 md:pt-20">
          <div className="max-w-xl lp-rise">
            <span
              className="inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ borderColor: `${accent.accent}33`, color: accent.accent, background: `${accent.accent}12` }}
            >
              {copy.badge}
            </span>
            <h1 className={cn(displayClass, "mt-5 text-[clamp(2.5rem,5.5vw,4rem)]")}>
              {copy.title}{" "}
              <span className="text-muted-foreground">{copy.titleAccent}</span>
            </h1>
            <p className="mt-4 text-[15px] text-muted-foreground">{copy.body}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to={module.loginHref}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[13px] font-semibold text-white"
                style={{ backgroundColor: accent.accent }}
              >
                Empezar <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={SALES_WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white/80 px-5 py-3 text-[13px] font-semibold"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </div>
          </div>
          <div className="mt-10 lp-fade">
            {isTaxi ? (
              <TaxiMapHero accent={accent.accent} />
            ) : (
              <DeliveryMapHero accent={accent.accent} />
            )}
          </div>
        </div>
      </section>

      <section id="surfaces" className="border-b border-black/5 py-20" style={{ background: accent.sectionTint }}>
        <div className="mx-auto grid max-w-6xl gap-4 px-6 md:grid-cols-3">
          {(copy.surfaces ?? []).map((s) => (
            <div key={s.label} className="rounded-2xl border border-black/5 bg-white/80 p-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: accent.accent }}>
                {s.label}
              </p>
              <p className="mt-2 text-[14px] text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <StoryBlock module={module} />
      <ScenarioBlock module={module} />
      <AntiConfusionBlock module={module} />
      <PricingAndFaqCta module={module} />
    </LayoutShell>
  );
}
