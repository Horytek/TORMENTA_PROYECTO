import { BENEFIT_PILLARS } from "../data/landing.data";

/**
 * Cuatro pilares de valor (inventario, POS, reportes, SUNAT).
 *
 * Los tamanos y radios vienen de `landing-system.css`: la seccion no elige
 * ninguno propio. Los pilares pasaron de lista suelta a tarjetas porque en una
 * pagina larga el texto sin contenedor se lee como relleno, no como producto.
 */
export function BenefitPillars() {
  return (
    <section id="beneficios" className="lp-section lp-band-a">
      <div className="lp-container">
        <div className="lp-head-center">
          <span className="lp-eyebrow">Qué ganas</span>
          <h2 className="lp-h2">
            Controla inventario, vende y factura{" "}
            <span className="lp-acento">desde un solo sistema.</span>
          </h2>
          <p className="lp-lead">
            Pensado para dueños de negocio que necesitan orden diario — no un ERP
            eterno de implementación.
          </p>
        </div>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2">
          {BENEFIT_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <li key={pillar.title} className="lp-card p-6">
                <span className="lp-icon">
                  <Icon className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <h3 className="lp-h3 mt-4">{pillar.title}</h3>
                <p className="lp-body mt-2">{pillar.body}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
