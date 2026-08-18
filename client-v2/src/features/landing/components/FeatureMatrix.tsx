import { FEATURE_GROUPS } from "../data/landing.data";

/**
 * Inventario de capacidades agrupado por trabajo: vender, operar, decidir.
 *
 * Es la seccion que faltaba. Una landing de software se juzga primero por si el
 * producto "alcanza" para el negocio de quien mira, y eso no se transmite con
 * cuatro pilares: se transmite viendo la lista completa de una sola pasada.
 *
 * `FEATURE_GROUPS` ya existia en landing.data.ts con el copy escrito, pero
 * ningun componente lo renderizaba — el dato estaba muerto en el repo.
 */
export function FeatureMatrix() {
  return (
    <section id="capacidades" className="lp-section lp-band-b">
      <div className="lp-container">
        <div className="lp-head-center">
          <span className="lp-eyebrow">Todo lo que incluye</span>
          <h2 className="lp-h2">
            Un sistema para vender, operar y decidir.
          </h2>
          <p className="lp-lead">
            No son módulos sueltos que compras aparte: es la misma información
            recorriendo la caja, el almacén y los reportes.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {FEATURE_GROUPS.map((group) => (
            <div key={group.title} className="lp-card flex flex-col p-6">
              <h3 className="text-[19px] font-semibold tracking-[-0.015em] text-foreground">
                {group.title}
              </h3>
              <p className="lp-body mt-1.5">{group.blurb}</p>

              <ul className="mt-6 space-y-5 border-t border-border/60 pt-6">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.name} className="flex gap-3.5">
                      <span className="lp-icon shrink-0">
                        <Icon className="h-[18px] w-[18px]" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="lp-h3">{item.name}</p>
                        <p className="lp-body mt-1">{item.body}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
