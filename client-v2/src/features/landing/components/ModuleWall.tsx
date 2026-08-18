import { MODULE_TILES } from "../data/landing.data";

/**
 * Cuadricula completa de modulos.
 *
 * Responde de una pasada la pregunta que decide la compra: "esto alcanza para
 * mi negocio?". Cuatro pilares no la responden; ver los veintidos modulos si.
 *
 * Solo entran modulos que existen y funcionan. Los productos de plataforma
 * recien agregados (catalogo-wa, sync, mayorista, taller, crm...) quedan fuera
 * a proposito porque todavia no tienen motor.
 */
export function ModuleWall() {
  return (
    <section id="modulos" className="lp-section lp-band-a">
      <div className="lp-container">
        <div className="lp-head-center">
          <span className="lp-eyebrow">Todo incluido</span>
          <h2 className="lp-h2">
            {MODULE_TILES.length} módulos, un solo sistema.
          </h2>
          <p className="lp-lead">
            No se compran por separado ni se integran después. Vienen juntos y
            comparten la misma información.
          </p>
        </div>

        <ul className="mt-12 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MODULE_TILES.map((m, i) => {
            const Icon = m.icon;
            return (
              <li key={`${m.label}-${i}`} className="lp-tile">
                <span className="lp-tile-icon">
                  <Icon className="h-[15px] w-[15px]" aria-hidden />
                </span>
                <span className="lp-tile-label">{m.label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
