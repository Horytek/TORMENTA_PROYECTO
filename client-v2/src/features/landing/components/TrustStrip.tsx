import { TRUST_CLAIMS } from "../data/landing.data";

/** Franja de confianza post-hero (claims defendibles, sin métricas inventadas). */
export function TrustStrip() {
  return (
    <section
      id="confianza"
      aria-label="Por qué confiar en Horytek"
      className="border-b border-border/60 bg-secondary/40"
    >
      <div className="mx-auto max-w-6xl px-6 py-10 md:py-12">
        <p className="text-center text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Hecho para PYMES del Perú
        </p>
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_CLAIMS.map((item) => (
            <li key={item.label} className="text-center sm:text-left">
              <p className="text-[15px] font-semibold tracking-tight text-foreground">
                {item.label}
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
