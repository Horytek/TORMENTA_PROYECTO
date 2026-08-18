import { TRUST_CLAIMS } from "../data/landing.data";

/**
 * Franja de confianza post-hero.
 *
 * Deliberadamente sin metricas: Horytek todavia no tiene clientes pagando, asi
 * que aca no van ni conteos de usuarios ni testimonios. Lo que se afirma es
 * capacidad del producto, que si es verificable. No cambiar esto por numeros
 * hasta que existan de verdad.
 */
export function TrustStrip() {
  return (
    <section
      id="confianza"
      aria-label="Por qué confiar en Horytek"
      className="lp-band-c border-b border-border/60"
    >
      <div className="lp-container py-12">
        <p className="lp-eyebrow text-center">Hecho para PYMES del Perú</p>
        <ul className="mt-7 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_CLAIMS.map((item) => (
            <li key={item.label} className="text-center sm:text-left">
              <p className="lp-h3">{item.label}</p>
              <p className="lp-body mt-1.5">{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
