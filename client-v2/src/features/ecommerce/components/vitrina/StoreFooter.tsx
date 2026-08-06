import { Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { monograma, type StoreTienda } from "../../types/storefront";

type Props = {
  tienda: StoreTienda;
  slug: string;
};

export function StoreFooter({ tienda, slug }: Props) {
  return (
    <footer className="mt-auto bg-[var(--vitrina-ink)] text-[var(--vitrina-fog)]">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {tienda.logo_url ? (
              <img src={tienda.logo_url} alt="" className="size-10 rounded-full object-cover" />
            ) : (
              <span
                className="size-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ background: "var(--vitrina-accent)" }}
              >
                {monograma(tienda.nombre)}
              </span>
            )}
            <span className="vitrina-display text-2xl">{tienda.nombre}</span>
          </div>
          {tienda.descripcion && (
            <p className="text-sm text-white/55 leading-relaxed max-w-sm">{tienda.descripcion}</p>
          )}
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 mb-3">Explorar</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to={`/tienda/${slug}`} className="hover:text-[var(--vitrina-accent)] transition-colors">
                Catálogo
              </Link>
            </li>
            <li>
              <a href="#catalogo" className="hover:text-[var(--vitrina-accent)] transition-colors">
                Todos los productos
              </a>
            </li>
            <li>
              <Link to={`/tienda/${slug}/carrito`} className="hover:text-[var(--vitrina-accent)] transition-colors">
                Carrito
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 mb-3">Contacto</p>
          {tienda.telefono ? (
            <a
              href={`tel:${tienda.telefono}`}
              className="inline-flex items-center gap-2 text-sm hover:text-[var(--vitrina-accent)] transition-colors"
            >
              <Phone className="size-4" />
              {tienda.telefono}
            </a>
          ) : (
            <p className="text-sm text-white/45">Consulta disponible al comprar</p>
          )}
          <p className="mt-6 text-xs text-white/30">Pago procesado de forma segura con Mercado Pago.</p>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 lg:px-8 py-4 text-center text-[11px] text-white/30">
        © {new Date().getFullYear()} {tienda.nombre}. Vitrina impulsada por Horytek.
      </div>
    </footer>
  );
}
