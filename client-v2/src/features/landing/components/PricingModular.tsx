import { Link } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LandingPricingModule, LandingPricingPlan } from "../modules/landingModule.types";

export interface PricingModularProps {
  pricing: LandingPricingModule;
  accent: string;
  sectionTint?: string;
  titleClassName?: string;
}

function isExternal(href: string) {
  return /^(https?:|wa\.me)/i.test(href);
}

function PlanCta({
  plan,
  accent,
  className,
}: {
  plan: LandingPricingPlan;
  accent: string;
  className?: string;
}) {
  const classes = cn(
    "mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all duration-300 hover:brightness-110 active:scale-[0.98]",
    className,
  );
  const style = {
    backgroundColor: plan.highlight ? accent : "transparent",
    color: plan.highlight ? "#fff" : undefined,
    border: plan.highlight ? "none" : `1px solid ${accent}55`,
  } as const;

  if (isExternal(plan.cta.href)) {
    return (
      <a href={plan.cta.href} target="_blank" rel="noreferrer" className={classes} style={style}>
        {plan.cta.label}
        <ArrowRight className="h-3.5 w-3.5" />
      </a>
    );
  }

  return (
    <Link to={plan.cta.href} className={classes} style={style}>
      {plan.cta.label}
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}

function PlanCard({
  plan,
  accent,
  compact,
}: {
  plan: LandingPricingPlan;
  accent: string;
  compact?: boolean;
}) {
  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-2xl border border-black/5 bg-white/80 p-7 backdrop-blur-sm transition-shadow duration-300",
        plan.highlight && "bg-white",
      )}
      style={
        plan.highlight
          ? {
              borderColor: `${accent}66`,
              boxShadow: `0 2px 0 0 ${accent}, 0 20px 50px -28px ${accent}`,
            }
          : { boxShadow: `0 16px 40px -32px ${accent}` }
      }
    >
      {plan.highlight ? (
        <span
          className="absolute right-5 top-5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white"
          style={{ backgroundColor: accent }}
        >
          Popular
        </span>
      ) : null}
      <h3 className="text-[18px] font-semibold tracking-tight text-foreground">{plan.name}</h3>
      <p className="mt-1 text-[13px] text-muted-foreground">{plan.description}</p>
      <p className="mt-5 flex items-baseline gap-1 border-b border-dashed border-border/70 pb-5">
        <span className="text-[11px] text-muted-foreground">S/</span>
        <span className="font-mono text-4xl font-semibold tabular-nums tracking-tight">
          {plan.price}
        </span>
        <span className="text-[12px] text-muted-foreground">/{plan.unit}</span>
      </p>
      <ul className={cn("mt-5 space-y-2", compact && "mt-4")}>
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-[13px] text-muted-foreground">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: accent }} />
            {f}
          </li>
        ))}
      </ul>
      <div className="mt-auto">
        <PlanCta plan={plan} accent={accent} />
      </div>
    </article>
  );
}

function TierList({ pricing, accent }: PricingModularProps) {
  return (
    <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-black/5 bg-white/70 divide-y divide-border/50">
      {pricing.plans.map((plan) => (
        <div
          key={plan.id}
          className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
          style={plan.highlight ? { backgroundColor: `${accent}0c` } : undefined}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-3">
              <h3 className="text-[16px] font-semibold">{plan.name}</h3>
              <p className="font-mono text-[15px] tabular-nums">
                S/ {plan.price}
                <span className="text-[12px] text-muted-foreground">/{plan.unit}</span>
              </p>
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground">{plan.description}</p>
            <p className="mt-2 text-[12px] text-muted-foreground">{plan.features.join(" · ")}</p>
          </div>
          <PlanCta plan={plan} accent={accent} className="sm:w-auto sm:min-w-[160px]" />
        </div>
      ))}
    </div>
  );
}

function UsageMeter({ pricing, accent }: PricingModularProps) {
  const max = Math.max(...pricing.plans.map((p) => p.price), 1);
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {pricing.plans.map((plan) => {
        const width = Math.max(18, Math.round((plan.price / max) * 100));
        return (
          <div
            key={plan.id}
            className="rounded-2xl border border-black/5 bg-white/80 p-5"
            style={{ boxShadow: `0 16px 40px -32px ${accent}` }}
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-[16px] font-semibold">{plan.name}</h3>
                <p className="mt-0.5 text-[13px] text-muted-foreground">{plan.description}</p>
              </div>
              <p className="font-mono text-[22px] font-semibold tabular-nums">
                S/ {plan.price}
                <span className="text-[12px] font-normal text-muted-foreground">/{plan.unit}</span>
              </p>
            </div>
            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-black/5">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${width}%`, backgroundColor: accent }}
              />
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {plan.features.map((f) => (
                <li key={f} className="text-[12px] text-muted-foreground">
                  · {f}
                </li>
              ))}
            </ul>
            <PlanCta plan={plan} accent={accent} className="mt-4 sm:w-auto" />
          </div>
        );
      })}
    </div>
  );
}

export function PricingModular({
  pricing,
  accent,
  sectionTint,
  titleClassName,
}: PricingModularProps) {
  const cols =
    pricing.layout === "cards-2"
      ? "lg:grid-cols-2 max-w-3xl mx-auto"
      : pricing.layout === "cards-3"
        ? "lg:grid-cols-3"
        : "";

  return (
    <section
      id="pricing"
      className="border-b border-border/40 py-24 md:py-32"
      style={sectionTint ? { backgroundColor: sectionTint } : undefined}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {pricing.eyebrow}
          </span>
          <h2
            className={cn(
              "mt-3 text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.1] tracking-[-0.02em] text-foreground",
              titleClassName ?? "font-semibold",
            )}
          >
            {pricing.title}
          </h2>
          <p className="mt-3 text-[14px] text-muted-foreground">{pricing.body}</p>
        </div>

        <div className="mt-14">
          {pricing.layout === "tier-list" ? (
            <TierList pricing={pricing} accent={accent} />
          ) : pricing.layout === "usage-meter" ? (
            <UsageMeter pricing={pricing} accent={accent} />
          ) : (
            <div className={cn("grid gap-5", cols)}>
              {pricing.plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  accent={accent}
                  compact={pricing.layout === "cards-2"}
                />
              ))}
            </div>
          )}
        </div>

        {pricing.footnote ? (
          <p className="mx-auto mt-8 max-w-2xl text-center text-[12px] text-muted-foreground">
            {pricing.footnote}
          </p>
        ) : null}
      </div>
    </section>
  );
}
