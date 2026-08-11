import { MapPin, MessageCircle, Search, ShoppingCart, Store, X } from "lucide-react";
import { normalizarTelefono } from "../lib/whatsapp";
import type { CatalogoNegocio } from "../types";

type Props = {
  negocio: CatalogoNegocio;
  busqueda: string;
  onBusqueda: (v: string) => void;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  hasWhatsApp: boolean;
};

export function CatalogHeader({
  negocio,
  busqueda,
  onBusqueda,
  cartCount,
  cartTotal,
  onOpenCart,
  hasWhatsApp,
}: Props) {
  const numero = normalizarTelefono(negocio.telefono);
  const waHref = hasWhatsApp && numero ? `https://wa.me/${numero}` : null;

  return (
    <header className="sticky top-0 z-40 border-b cx-hairline bg-[color-mix(in_srgb,var(--cx-elevated)_92%,transparent)] backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-2 sm:py-0 sm:h-14 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {negocio.logo ? (
              <img
                src={negocio.logo}
                alt=""
                className="size-8 sm:size-9 rounded-[var(--cx-radius-sm)] object-cover shrink-0"
              />
            ) : (
              <span className="size-8 sm:size-9 shrink-0 rounded-[var(--cx-radius-sm)] flex items-center justify-center bg-[color-mix(in_srgb,var(--cx-accent)_14%,transparent)] text-[var(--cx-accent)]">
                <Store className="size-4" />
              </span>
            )}
            <div className="min-w-0">
              <p className="cx-display text-xs sm:text-sm font-semibold truncate max-w-[11rem] sm:max-w-[14rem]">
                {negocio.nombre}
              </p>
              {negocio.direccion && (
                <p className="cx-muted text-[9px] sm:text-[10px] flex items-center gap-1 truncate max-w-[14rem]">
                  <MapPin className="size-2.5 shrink-0" />
                  <span className="truncate">{negocio.direccion}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 sm:hidden">
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="cx-focus size-10 rounded-full border cx-hairline flex items-center justify-center"
                aria-label="Consultar WhatsApp"
              >
                <MessageCircle className="size-4 text-[var(--cx-accent)]" />
              </a>
            )}
            <button
              type="button"
              onClick={onOpenCart}
              className="cx-focus relative size-10 rounded-full flex items-center justify-center text-white"
              style={{ background: "var(--cx-accent)" }}
              aria-label="Abrir pedido"
            >
              <ShoppingCart className="size-4" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center bg-[var(--cx-cta)] text-[var(--cx-cta-ink)]">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="relative flex-1 min-w-0 w-full sm:max-w-xl sm:mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 cx-muted" />
          <input
            value={busqueda}
            onChange={(e) => onBusqueda(e.target.value)}
            placeholder="Buscar productos…"
            className="cx-focus w-full h-10 pl-9 pr-9 rounded-full border cx-hairline bg-[var(--cx-elevated)] text-sm outline-none"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => onBusqueda("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 cx-muted hover:text-[var(--cx-ink)]"
              aria-label="Limpiar búsqueda"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="cx-focus hidden md:inline-flex items-center gap-1.5 h-10 px-3 rounded-full text-xs font-semibold border cx-hairline hover:bg-black/[0.03]"
            >
              <MessageCircle className="size-4 text-[var(--cx-accent)]" />
              Consultar
            </a>
          )}
          <button
            type="button"
            onClick={onOpenCart}
            className="cx-focus relative inline-flex items-center gap-2 h-10 px-3.5 rounded-full text-sm font-semibold text-white"
            style={{ background: "var(--cx-accent)" }}
            aria-label="Abrir pedido"
          >
            <ShoppingCart className="size-4" />
            <span>{cartCount > 0 ? `S/ ${cartTotal.toFixed(2)}` : "Pedido"}</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center bg-[var(--cx-cta)] text-[var(--cx-cta-ink)]">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
