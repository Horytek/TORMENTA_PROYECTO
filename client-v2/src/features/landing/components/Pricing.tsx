import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PLANS,
  POCKET_PLANS,
  type Mode,
  type Plan,
  type PocketPlan,
} from "../data/landing.data";

interface Props {
  mode: Mode;
}

export function Pricing({ mode }: Props) {
  const isPocket = mode === "pocket";
  const [annual, setAnnual] = useState(false);

  return (
    <section
      id="planes"
      className={cn(
        "border-b border-border/60 py-24 md:py-32",
        isPocket ? "bg-amber-500/[0.03]" : "bg-secondary/20",
      )}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Planes · {isPocket ? "Pocket" : "ERP"}
          </span>
          <h2 className="mt-3 text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
            {isPocket ? "Elige cómo quieres empezar." : "Precios simples, en soles, sin letra chica."}
          </h2>
          <p className="mt-3 text-[14px] text-muted-foreground">
            {isPocket
              ? "Sin contratos forzosos. Empieza hoy y termina cuando quieras."
              : "Pago mensual o anual. Cancela cuando quieras."}
          </p>

          {!isPocket && <BillingToggle annual={annual} setAnnual={setAnnual} />}
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {isPocket ? (
            POCKET_PLANS.map((plan) => (
              <PocketPlanCard key={plan.id} plan={plan} />
            ))
          ) : (
            PLANS.map((plan) => <StandardPlanCard key={plan.id} plan={plan} annual={annual} />)
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Standard ──────────────────────────────────────────────────────────────

interface BillingToggleProps {
  annual: boolean;
  setAnnual: React.Dispatch<React.SetStateAction<boolean>>;
}

function BillingToggle({ annual, setAnnual }: BillingToggleProps) {
  return (
    <div className="mt-8 flex items-center justify-center gap-4 text-[12px] font-medium uppercase tracking-[0.12em]">
      <span
        className={cn(
          "cursor-pointer transition-colors",
          !annual ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
        onClick={() => setAnnual(false)}
      >
        Mensual
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={annual}
        aria-label="Cambiar a facturación anual"
        onClick={() => setAnnual((v) => !v)}
        className="relative h-7 w-12 rounded-full border border-border bg-card p-0.5 transition-colors hover:border-foreground/30"
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-foreground transition-transform",
            annual && "translate-x-5",
          )}
        />
      </button>
      <span
        className={cn(
          "flex cursor-pointer items-center gap-2 transition-colors",
          annual ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
        onClick={() => setAnnual(true)}
      >
        Anual
        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand">
          -17%
        </span>
      </span>
    </div>
  );
}

function StandardPlanCard({ plan, annual }: { plan: Plan; annual: boolean }) {
  // Para que el card "highlight" (Pro) destaque, lo elevamos ligeramente y le
  // damos borde de marca. Sigue siendo sobrio — sin sombras dramáticas.
  const isHighlight = plan.highlight;

  return (
    <article
      className={cn(
        "relative flex flex-col rounded-xl border bg-card p-7 transition-colors",
        isHighlight
          ? "border-primary lg:-mt-3 shadow-[0_2px_0_0_hsl(var(--primary))]"
          : "border-border hover:border-foreground/20",
      )}
    >
      {isHighlight && (
        <span className="absolute -top-2.5 left-7 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-foreground">
          Más elegido
        </span>
      )}

      <header>
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {plan.name}
        </h3>
        <p className="mt-2 min-h-[2.5rem] text-[13px] leading-snug text-muted-foreground">
          {plan.description}
        </p>
      </header>

      <div className="mt-6 border-t border-dashed border-border pt-5">
        <div className="flex items-baseline gap-1">
          <span className="num text-[2.5rem] font-semibold tracking-[-0.02em] text-foreground transition-all duration-200">
            S/ {annual ? Math.round(plan.yearly / 12) : plan.monthly}
          </span>
          <span className="text-[13px] text-muted-foreground">/ mes</span>
        </div>
        <p className="num mt-1 text-[12px] text-muted-foreground transition-all duration-200">
          {annual ? `Facturado anualmente (S/ ${plan.yearly}/año)` : `o S/ ${plan.yearly} al año`}
        </p>
      </div>

      <ul className="mt-6 flex-1 space-y-2.5">
        {plan.features.map((f) => (
          <li
            key={f}
            className="flex items-start gap-2.5 text-[13.5px] leading-snug text-foreground/90"
          >
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
            {f}
          </li>
        ))}
      </ul>

      <Button asChild className="mt-7" variant={isHighlight ? "default" : "outline"}>
        <Link to={`/registro?plan=${plan.id}&period=${annual ? "año" : "mes"}`}>Empezar ahora</Link>
      </Button>
    </article>
  );
}

// ─── Pocket ────────────────────────────────────────────────────────────────

function PocketPlanCard({ plan }: { plan: PocketPlan }) {
  return (
    <article
      className={cn(
        "relative flex flex-col rounded-xl border bg-card p-7 transition-colors",
        plan.highlight
          ? "border-amber-500 lg:-mt-3 shadow-[0_2px_0_0_rgb(245_158_11)]"
          : "border-border hover:border-amber-500/40",
      )}
    >
      {plan.highlight && (
        <span className="absolute -top-2.5 right-7 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
          Popular
        </span>
      )}

      <header>
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {plan.name}
        </h3>
        <p className="mt-2 min-h-[2.5rem] text-[13px] leading-snug text-muted-foreground">
          {plan.description}
        </p>
      </header>

      <div className="mt-6 border-t border-dashed border-border pt-5">
        <div className="flex items-baseline gap-1">
          <span className="num text-[2rem] font-semibold tracking-[-0.02em] text-foreground">
            S/ {plan.price}
          </span>
          <span className="text-[13px] text-muted-foreground">/ {plan.unit}</span>
        </div>
      </div>

      <ul className="mt-6 flex-1 space-y-2.5">
        {plan.features.map((f) => (
          <li
            key={f}
            className="flex items-start gap-2.5 text-[13.5px] leading-snug text-foreground/90"
          >
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
            {f}
          </li>
        ))}
      </ul>

      <Button
        asChild
        className={cn(
          "mt-7 gap-1.5",
          plan.highlight
            ? "bg-amber-600 text-white hover:bg-amber-700"
            : "",
        )}
        variant={plan.highlight ? "default" : "outline"}
      >
        <Link to={`/login?mode=express&register=1&plan=${plan.id}`}>
          {plan.ctaLabel} <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </article>
  );
}