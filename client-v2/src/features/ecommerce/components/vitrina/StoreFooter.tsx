import { Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { monograma, type StoreTienda } from "../../types/storefront";
import { ContactQuick } from "./quick/ContactQuick";

type Props = {
  tienda: StoreTienda;
  slug: string;
};

export function StoreFooter({ tienda, slug }: Props) {
  return (
    <footer className="mt-auto border-t store-hairline bg-[var(--vitrina-elevated)] text-[var(--vitrina-ink)]">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 flex flex-col sm:flex-row gap-8 sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {tienda.logo_url ? (
            <img src={tienda.logo_url} alt="" className="store-logo size-9 object-cover" />
          ) : (
            <span
              className="store-logo size-9 flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "var(--vitrina-accent)" }}
            >
              {monograma(tienda.nombre)}
            </span>
          )}
          <div className="min-w-0">
            <p className="font-semibold truncate">{tienda.nombre}</p>
            <p className="text-xs store-muted">Pago seguro · Mercado Pago</p>
          </div>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm">
          <Link to={`/tienda/${slug}`} className="store-nav-btn px-2.5 py-1.5 hover:text-[var(--vitrina-accent)]">
            Catálogo
          </Link>
          <Link to={`/tienda/${slug}/carrito`} className="store-nav-btn px-2.5 py-1.5 hover:text-[var(--vitrina-accent)]">
            Carrito
          </Link>
          <Link to={`/tienda/${slug}/opiniones`} className="store-nav-btn px-2.5 py-1.5 hover:text-[var(--vitrina-accent)]">
            Opiniones
          </Link>
          {tienda.telefono && (
            <a href={`tel:${tienda.telefono}`} className="store-nav-btn inline-flex items-center gap-1 px-2.5 py-1.5 hover:text-[var(--vitrina-accent)]">
              <Phone className="size-3.5" />
              {tienda.telefono}
            </a>
          )}
          <ContactQuick telefono={tienda.telefono} />
        </nav>
      </div>
      <div className="border-t store-hairline px-4 py-3 text-center text-[11px] store-muted">
        © {new Date().getFullYear()} {tienda.nombre} · Horytek
      </div>
    </footer>
  );
}
