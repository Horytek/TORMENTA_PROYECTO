import { BENEFIT_PILLARS } from "../data/landing.data";

/** Cuatro pilares de valor (inventario, POS, reportes, SUNAT). */
export function BenefitPillars() {
  return (
    <section
      id="beneficios"
      className="border-b border-border/60 bg-background py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Qué ganas
          </span>
          <h2 className="mt-3 text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
            Controla inventario, vende y factura desde un solo sistema.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Pensado para dueños de negocio que necesitan orden diario — no un ERP eterno de implementación.
          </p>
        </div>

        <ul className="mt-14 grid gap-10 sm:grid-cols-2">
          {BENEFIT_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <li key={pillar.title} className="relative">
                <span className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-secondary text-foreground">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-[17px] font-semibold tracking-tight text-foreground">
                  {pillar.title}
                </h3>
                <p className="mt-2 max-w-md text-[14px] leading-relaxed text-muted-foreground">
                  {pillar.body}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
