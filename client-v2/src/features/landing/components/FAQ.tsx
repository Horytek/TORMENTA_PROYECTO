import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FAQS,
  POCKET_FAQS,
  ECOMMERCE_FAQS,
  STANDARD_FAQ_CARDS,
  type Mode,
} from "../data/landing.data";

interface Props {
  mode: Mode;
}

/**
 * FAQ con tres formatos según producto.
 */
export function FAQ({ mode }: Props) {
  const isPocket = mode === "pocket";
  const isEcommerce = mode === "ecommerce";

  return (
    <section
      id="preguntas"
      className={cn(
        "border-b border-border/60 py-24 md:py-32",
        isPocket
          ? "bg-amber-500/[0.03]"
          : isEcommerce
            ? "bg-teal-700/[0.03]"
            : "bg-background",
      )}
    >
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {isPocket
              ? "Dudas Frecuentes · Pocket"
              : isEcommerce
                ? "Dudas · Ecommerce"
                : "Preguntas frecuentes"}
          </span>
          <h2 className="mt-3 text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
            {isPocket
              ? "Resolvemos tus dudas en segundos."
              : isEcommerce
                ? "Cómo funciona tu tienda online."
                : "Lo que preguntan antes de empezar."}
          </h2>
        </div>

        {isPocket ? (
          <PocketCards />
        ) : isEcommerce ? (
          <EcommerceAccordion />
        ) : (
          <StandardAccordion />
        )}
      </div>
    </section>
  );
}

function StandardAccordion() {
  return (
    <div className="mt-12 divide-y divide-border border-y border-border">
      {FAQS.map((item) => (
        <details key={item.q} className="group py-5">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[15px] font-medium text-foreground">
            <span>{item.q}</span>
            <Plus
              className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-45"
              aria-hidden
            />
          </summary>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
            {item.a}
          </p>
        </details>
      ))}
    </div>
  );
}

function EcommerceAccordion() {
  return (
    <div className="mt-12 divide-y divide-border border-y border-border">
      {ECOMMERCE_FAQS.map((item) => (
        <details key={item.q} className="group py-5">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[15px] font-medium text-foreground">
            <span>{item.q}</span>
            <Plus
              className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-45"
              aria-hidden
            />
          </summary>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
            {item.a}
          </p>
        </details>
      ))}
    </div>
  );
}

function PocketCards() {
  return (
    <div className="mt-12 grid max-w-5xl gap-5 md:grid-cols-3">
      {STANDARD_FAQ_CARDS.map((card, i) => {
        const pocketQ = POCKET_FAQS[i]?.q ?? card.q;
        const pocketA = POCKET_FAQS[i]?.a ?? card.a;
        return (
          <article
            key={pocketQ}
            className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-amber-500/40 hover:bg-amber-500/[0.03]"
          >
            <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-foreground">
              {pocketQ}
            </h3>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
              {pocketA}
            </p>
          </article>
        );
      })}
    </div>
  );
}