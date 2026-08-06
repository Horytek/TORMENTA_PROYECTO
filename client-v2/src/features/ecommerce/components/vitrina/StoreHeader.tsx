import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ShoppingBag, Menu, X, Phone } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { monograma, tiendaTheme, type StoreTienda } from "../../types/storefront";

type Props = {
  tienda: StoreTienda;
  slug: string;
  cartCount: number;
  categorias: { nombre: string; count: number }[];
  search: string;
  onSearchChange: (v: string) => void;
  onCategoria: (cat: string | null) => void;
  categoriaActiva: string | null;
  compactSearch?: boolean;
};

export function StoreHeader({
  tienda,
  slug,
  cartCount,
  categorias,
  search,
  onSearchChange,
  onCategoria,
  categoriaActiva,
  compactSearch = false,
}: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const headerStyle = tiendaTheme(tienda).header_style;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goCategoria = (cat: string | null) => {
    onCategoria(cat);
    setSheetOpen(false);
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
  };

  const isLight = headerStyle === "light";
  const isAccent = headerStyle === "accent";

  const headerBg = isAccent
    ? scrolled
      ? "bg-[var(--vitrina-accent)] text-white shadow-lg"
      : "bg-[var(--vitrina-accent)] text-white"
    : isLight
      ? scrolled
        ? "bg-white/95 text-[var(--vitrina-ink)] backdrop-blur-xl shadow-md border-b border-slate-200/80"
        : "bg-white/90 text-[var(--vitrina-ink)] backdrop-blur-md border-b border-slate-200/60"
      : scrolled
        ? "bg-[color-mix(in_srgb,var(--vitrina-ink)_88%,transparent)] text-white backdrop-blur-xl shadow-lg shadow-black/10"
        : "bg-[color-mix(in_srgb,var(--vitrina-ink)_72%,transparent)] text-white backdrop-blur-md";

  const muted = isLight ? "text-slate-500" : "text-white/60";
  const borderMuted = isLight ? "border-slate-200" : "border-white/10";
  const hoverBg = isLight ? "hover:bg-slate-100" : "hover:bg-white/10";
  const inputCls = isLight
    ? "bg-slate-100 border-slate-200 text-[var(--vitrina-ink)] placeholder:text-slate-400"
    : "bg-white/10 border-white/15 text-white placeholder:text-white/40";
  const navIdle = isLight ? "text-slate-600 hover:bg-slate-100" : "text-white/70 hover:text-white hover:bg-white/10";
  const navActive = isLight ? "bg-slate-900 text-white" : "bg-white/15 text-white";
  const searchIcon = isLight ? "text-slate-400" : "text-white/40";

  return (
    <header className={`sticky top-0 z-40 transition-[background,box-shadow,backdrop-filter] duration-300 ${headerBg}`}>
      <div
        className={`hidden sm:flex items-center justify-between gap-4 px-4 lg:px-8 text-[11px] tracking-wide ${muted} border-b ${borderMuted} transition-all ${
          scrolled ? "h-0 overflow-hidden opacity-0 border-0" : "h-8"
        }`}
      >
        <span>Pago seguro con Mercado Pago</span>
        {tienda.telefono && (
          <a
            href={`tel:${tienda.telefono}`}
            className={`inline-flex items-center gap-1.5 transition-colors ${isLight ? "hover:text-[var(--vitrina-ink)]" : "hover:text-white"}`}
          >
            <Phone className="size-3" />
            {tienda.telefono}
          </a>
        )}
      </div>

      <div className={`flex items-center gap-3 px-4 lg:px-8 ${scrolled ? "h-14" : "h-16"}`}>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className={`lg:hidden size-10 rounded-full flex items-center justify-center ${hoverBg}`}
              aria-label="Menú"
            >
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="vitrina bg-[var(--vitrina-mist)] w-[min(100%,20rem)]">
            <SheetHeader>
              <SheetTitle className="vitrina-display text-left text-2xl">{tienda.nombre}</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-1">
              <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Categorías</p>
              <button
                type="button"
                onClick={() => goCategoria(null)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm ${
                  !categoriaActiva ? "bg-[var(--vitrina-accent-soft)] text-[var(--vitrina-accent)] font-semibold" : "hover:bg-slate-100"
                }`}
              >
                Todas
              </button>
              {categorias.map((c) => (
                <button
                  key={c.nombre}
                  type="button"
                  onClick={() => goCategoria(c.nombre)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex justify-between ${
                    categoriaActiva === c.nombre
                      ? "bg-[var(--vitrina-accent-soft)] text-[var(--vitrina-accent)] font-semibold"
                      : "hover:bg-slate-100"
                  }`}
                >
                  <span>{c.nombre}</span>
                  <span className="text-slate-400">{c.count}</span>
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        <Link to={`/tienda/${slug}`} className="flex items-center gap-3 min-w-0 shrink-0 group">
          {tienda.logo_url ? (
            <img
              src={tienda.logo_url}
              alt=""
              className="size-9 rounded-full object-cover ring-2 ring-current/20 group-hover:ring-[var(--vitrina-accent)] transition"
            />
          ) : (
            <span
              className="size-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: isAccent ? "rgba(0,0,0,0.25)" : "var(--vitrina-accent)" }}
            >
              {monograma(tienda.nombre)}
            </span>
          )}
          <span className="vitrina-display text-lg sm:text-xl truncate max-w-[10rem] sm:max-w-[16rem] group-hover:text-[var(--vitrina-accent)] transition-colors">
            {tienda.nombre}
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 flex-1 min-w-0 mx-4 overflow-x-auto vitrina-hide-scrollbar">
          <button
            type="button"
            onClick={() => goCategoria(null)}
            className={`px-3 py-1.5 text-sm whitespace-nowrap rounded-full transition ${!categoriaActiva ? navActive : navIdle}`}
          >
            Todo
          </button>
          {categorias.slice(0, 6).map((c) => (
            <button
              key={c.nombre}
              type="button"
              onClick={() => goCategoria(c.nombre)}
              className={`px-3 py-1.5 text-sm whitespace-nowrap rounded-full transition ${
                categoriaActiva === c.nombre ? navActive : navIdle
              }`}
            >
              {c.nombre}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {(searchOpen || compactSearch) && (
            <div className="relative hidden sm:block">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 size-4 ${searchIcon}`} />
              <Input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar productos…"
                className={`h-9 w-48 lg:w-64 pl-9 rounded-full ${inputCls}`}
              />
            </div>
          )}
          {!compactSearch && (
            <button
              type="button"
              className={`sm:hidden size-10 rounded-full flex items-center justify-center ${hoverBg}`}
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Buscar"
            >
              {searchOpen ? <X className="size-5" /> : <Search className="size-5" />}
            </button>
          )}
          {!compactSearch && (
            <button
              type="button"
              className={`hidden sm:flex size-10 rounded-full items-center justify-center ${hoverBg}`}
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Buscar"
            >
              <Search className="size-5" />
            </button>
          )}

          <Link
            to={`/tienda/${slug}/carrito`}
            className={`relative size-10 rounded-full flex items-center justify-center transition ${hoverBg}`}
            aria-label="Carrito"
          >
            <ShoppingBag className="size-5" />
            {cartCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                style={{ background: isAccent ? "rgba(0,0,0,0.35)" : "var(--vitrina-accent)" }}
              >
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {searchOpen && (
        <div className="sm:hidden px-4 pb-3">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 size-4 ${searchIcon}`} />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar productos…"
              className={`h-10 w-full pl-9 rounded-full ${inputCls}`}
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
}
