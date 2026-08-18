import { PRODUCT_FACTS } from "../data/landing.data";

/**
 * Banda de cifras bajo el hero.
 *
 * Es la pieza que le faltaba a la pagina para "sonar": una superficie oscura de
 * pleno color que corta el scroll y pone cuatro numeros grandes. La landing
 * entera vivia en gris claro, asi que nada destacaba sobre nada.
 *
 * Las cifras son hechos del producto -tipos de comprobante, canales, planes-,
 * NO prueba social. Ver el comentario de PRODUCT_FACTS: mientras no haya
 * clientes pagando, aca no van usuarios ni anios de trayectoria.
 */
export function ProductFacts() {
  return (
    <section id="cifras" className="lp-fill-ink">
      <div className="lp-container py-14 md:py-16">
        <dl className="grid gap-9 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCT_FACTS.map((f) => (
            <div key={f.label}>
              <dt className="sr-only">{f.label}</dt>
              <dd>
                <p className="lp-stat">{f.valor}</p>
                <p className="lp-stat-label">{f.label}</p>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
