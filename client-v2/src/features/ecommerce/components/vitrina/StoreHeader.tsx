import { useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Search, ShoppingBag, Menu, Moon, Sun, Monitor } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { monograma, type StoreTienda } from "../../types/storefront";
import { useStoreColorScheme } from "./StoreShell";
import { SearchSheet } from "./quick/SearchSheet";
import { ContactQuick } from "./quick/ContactQuick";
import type { StoreProducto } from "../../types/storefront";
import type { NavStyle } from "../../types/theme";

type Props = {
  tienda: StoreTienda;
  slug: string;
  cartCount: number;
  categorias: { nombre: string; count: number }[];
  onCategoria: (cat: string | null) => void;
  categoriaActiva: string | null;
  productos?: StoreProducto[];
};

function navItemClass(style: NavStyle, active: boolean, isLightHeader: boolean) {
  const base = "store-focus-ring whitespace-nowrap min-h-10 text-sm transition-all";
  switch (style) {
    case "pill":
      return `${base} px-3.5 py-2 rounded-full ${
        active
          ? "font-semibold text-white"
          : isLightHeader
            ? "store-muted hover:bg-black/5"
            : "store-muted hover:bg-white/10"
      }`;
    case "soft":
      return `${base} px-3.5 py-2 rounded-2xl ${
        active
          ? "font-semibold"
          : isLightHeader
            ? "store-muted hover:bg-black/[0.04]"
            : "store-muted hover:bg-white/10"
      }`;
    case "underline":
      return `${base} px-2.5 py-2 rounded-none border-b-2 ${
        active
          ? "font-semibold"
          : `border-transparent store-muted ${isLightHeader ? "hover:border-black/15" : "hover:border-white/25"}`
      }`;
    case "text":
    default:
      return `${base} px-3 py-2 ${active ? "font-semibold" : "store-muted"}`;
  }
}

export function StoreHeader({
  tienda,
  slug,
  cartCount,
  categorias,
  onCategoria,
  categoriaActiva,
  productos = [],
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { pref, cycle, allowToggle, theme } = useStoreColorScheme();
  const headerStyle = theme.header_style;
  const nav = theme.nav;

  const goCategoria = (cat: string | null) => {
    onCategoria(cat);
    setSheetOpen(false);
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
  };

  const isLight = headerStyle === "light";
  const isAccent = headerStyle === "accent";

  const headerBg = isAccent
    ? "bg-[var(--vitrina-accent)] text-white border-b border-black/10"
    : isLight
      ? "bg-[var(--vitrina-elevated)] text-[var(--vitrina-ink)] border-b store-hairline"
      : "bg-[color-mix(in_srgb,var(--vitrina-mist)_92%,transparent)] text-[var(--vitrina-ink)] border-b store-hairline backdrop-blur-md";

  const SchemeIcon = pref === "dark" ? Moon : pref === "light" ? Sun : Monitor;
  const labelAll = nav.label_all || "Todo";
  const visibleCats = categorias.slice(0, nav.max_items || 6);
  const showNav = nav.show_categories !== false;

  const activeStyle = (active: boolean): CSSProperties | undefined => {
    if (!active) return undefined;
    if (nav.style === "pill") return { background: isAccent ? "rgba(0,0,0,0.28)" : "var(--vitrina-accent)" };
    if (nav.style === "soft")
      return {
        background: isAccent ? "rgba(0,0,0,0.2)" : "var(--vitrina-accent-soft)",
        color: isAccent ? "#fff" : "var(--vitrina-accent)",
      };
    if (nav.style === "underline")
      return { borderBottomColor: isAccent ? "#fff" : "var(--vitrina-accent)", color: isAccent ? "#fff" : "var(--vitrina-accent)" };
    return { color: isAccent ? "#fff" : "var(--vitrina-accent)" };
  };

  return (
    <>
      <header className={`sticky top-0 z-40 ${headerBg}`}>
        <div className="flex items-center gap-2 px-4 lg:px-8 h-14">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button type="button" className="store-icon-btn lg:hidden size-11 flex items-center justify-center" aria-label="Menú">
                <Menu className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="vitrina bg-[var(--vitrina-mist)] w-[min(100%,20rem)]">
              <SheetHeader>
                <SheetTitle className="text-left text-lg font-semibold">{tienda.nombre}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-1">
                {showNav && (
                  <>
                    <p className="text-[11px] uppercase tracking-wider store-muted mb-2">Categorías</p>
                    <button
                      type="button"
                      onClick={() => goCategoria(null)}
                      className="store-nav-btn w-full text-left px-3 py-3 min-h-11 text-sm"
                      style={activeStyle(!categoriaActiva)}
                    >
                      {labelAll}
                    </button>
                    {visibleCats.map((c) => (
                      <button
                        key={c.nombre}
                        type="button"
                        onClick={() => goCategoria(c.nombre)}
                        className="store-nav-btn w-full text-left px-3 py-3 min-h-11 text-sm flex justify-between"
                        style={activeStyle(categoriaActiva === c.nombre)}
                      >
                        <span>{c.nombre}</span>
                        {nav.show_counts && <span className="store-muted">{c.count}</span>}
                      </button>
                    ))}
                  </>
                )}
                {theme.quick_actions?.whatsapp !== false && (
                  <div className={`pt-4 border-t store-hairline ${showNav ? "mt-4" : ""}`}>
                    <ContactQuick telefono={tienda.telefono} />
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <Link to={`/tienda/${slug}`} className="flex items-center gap-2.5 min-w-0 shrink-0">
            {tienda.logo_url ? (
              <img src={tienda.logo_url} alt="" className="store-logo size-8 object-cover" />
            ) : (
              <span
                className="store-logo size-8 flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: isAccent ? "rgba(0,0,0,0.25)" : "var(--vitrina-accent)" }}
              >
                {monograma(tienda.nombre)}
              </span>
            )}
            <span className="font-semibold text-sm sm:text-base truncate max-w-[9rem] sm:max-w-[14rem]">
              {tienda.nombre}
            </span>
          </Link>

          {showNav && (
            <nav className="hidden lg:flex items-center gap-1 flex-1 min-w-0 mx-4 overflow-x-auto">
              <button
                type="button"
                onClick={() => goCategoria(null)}
                className={navItemClass(nav.style, !categoriaActiva, isLight)}
                style={activeStyle(!categoriaActiva)}
              >
                {labelAll}
              </button>
              {visibleCats.map((c) => (
                <button
                  key={c.nombre}
                  type="button"
                  onClick={() => goCategoria(c.nombre)}
                  className={navItemClass(nav.style, categoriaActiva === c.nombre, isLight)}
                  style={activeStyle(categoriaActiva === c.nombre)}
                >
                  {c.nombre}
                  {nav.show_counts ? (
                    <span className="ml-1.5 text-[10px] opacity-60">{c.count}</span>
                  ) : null}
                </button>
              ))}
            </nav>
          )}

          <div className="ml-auto flex items-center gap-0.5">
            <button
              type="button"
              className="store-icon-btn size-11 flex items-center justify-center"
              onClick={() => setSearchOpen(true)}
              aria-label="Buscar"
            >
              <Search className="size-5" />
            </button>
            {allowToggle && (
              <button type="button" className="store-icon-btn size-11 flex items-center justify-center" onClick={cycle} aria-label={`Tema: ${pref}`}>
                <SchemeIcon className="size-4" />
              </button>
            )}
            <Link to={`/tienda/${slug}/carrito`} className="store-icon-btn relative size-11 flex items-center justify-center" aria-label="Carrito">
              <ShoppingBag className="size-5" />
              {cartCount > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 text-[10px] font-bold flex items-center justify-center text-white rounded-full"
                  style={{ background: isAccent ? "rgba(0,0,0,0.35)" : "var(--vitrina-accent)" }}
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>
      <SearchSheet open={searchOpen} onClose={() => setSearchOpen(false)} productos={productos} slug={slug} />
    </>
  );
}
