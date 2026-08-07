import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, ShoppingBag, Menu, Moon, Sun, Monitor } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { monograma, type StoreTienda } from "../../types/storefront";
import { useStoreColorScheme } from "./StoreShell";
import { SearchSheet } from "./quick/SearchSheet";
import { ContactQuick } from "./quick/ContactQuick";
import type { StoreProducto } from "../../types/storefront";

type Props = {
  tienda: StoreTienda;
  slug: string;
  cartCount: number;
  categorias: { nombre: string; count: number }[];
  onCategoria: (cat: string | null) => void;
  categoriaActiva: string | null;
  productos?: StoreProducto[];
};

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

  return (
    <>
      <header className={`sticky top-0 z-40 ${headerBg}`}>
        <div className="flex items-center gap-2 px-4 lg:px-8 h-14">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button type="button" className="lg:hidden size-11 flex items-center justify-center" aria-label="Menú">
                <Menu className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="vitrina bg-[var(--vitrina-mist)] w-[min(100%,20rem)]">
              <SheetHeader>
                <SheetTitle className="text-left text-lg font-semibold">{tienda.nombre}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-1">
                <p className="text-[11px] uppercase tracking-wider store-muted mb-2">Categorías</p>
                <button type="button" onClick={() => goCategoria(null)} className="w-full text-left px-3 py-3 min-h-11 text-sm">
                  Todas
                </button>
                {categorias.map((c) => (
                  <button
                    key={c.nombre}
                    type="button"
                    onClick={() => goCategoria(c.nombre)}
                    className={`w-full text-left px-3 py-3 min-h-11 text-sm flex justify-between ${
                      categoriaActiva === c.nombre ? "font-semibold text-[var(--vitrina-accent)]" : ""
                    }`}
                  >
                    <span>{c.nombre}</span>
                    <span className="store-muted">{c.count}</span>
                  </button>
                ))}
                {theme.quick_actions?.whatsapp !== false && (
                  <div className="pt-4 border-t store-hairline mt-4">
                    <ContactQuick telefono={tienda.telefono} />
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <Link to={`/tienda/${slug}`} className="flex items-center gap-2.5 min-w-0 shrink-0">
            {tienda.logo_url ? (
              <img src={tienda.logo_url} alt="" className="size-8 object-cover" />
            ) : (
              <span
                className="size-8 flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: "var(--vitrina-accent)" }}
              >
                {monograma(tienda.nombre)}
              </span>
            )}
            <span className="font-semibold text-sm sm:text-base truncate max-w-[9rem] sm:max-w-[14rem]">
              {tienda.nombre}
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 flex-1 min-w-0 mx-4 overflow-x-auto">
            <button type="button" onClick={() => goCategoria(null)} className="px-3 py-2 text-sm whitespace-nowrap min-h-11">
              Todo
            </button>
            {categorias.slice(0, 6).map((c) => (
              <button
                key={c.nombre}
                type="button"
                onClick={() => goCategoria(c.nombre)}
                className={`px-3 py-2 text-sm whitespace-nowrap min-h-11 ${
                  categoriaActiva === c.nombre ? "font-semibold text-[var(--vitrina-accent)]" : "store-muted"
                }`}
              >
                {c.nombre}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-0.5">
            <button
              type="button"
              className="size-11 flex items-center justify-center"
              onClick={() => setSearchOpen(true)}
              aria-label="Buscar"
            >
              <Search className="size-5" />
            </button>
            {allowToggle && (
              <button type="button" className="size-11 flex items-center justify-center" onClick={cycle} aria-label={`Tema: ${pref}`}>
                <SchemeIcon className="size-4" />
              </button>
            )}
            <Link to={`/tienda/${slug}/carrito`} className="relative size-11 flex items-center justify-center" aria-label="Carrito">
              <ShoppingBag className="size-5" />
              {cartCount > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 text-[10px] font-bold flex items-center justify-center text-white"
                  style={{ background: "var(--vitrina-accent)" }}
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
