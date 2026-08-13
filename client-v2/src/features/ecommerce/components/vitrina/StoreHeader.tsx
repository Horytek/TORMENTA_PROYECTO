import { useMemo, useState, type CSSProperties } from "react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, ShoppingBag, Menu, Moon, Sun, Monitor, User, Heart, Bell } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { monograma, type StoreTienda } from "../../types/storefront";
import { useStoreColorScheme } from "./StoreShell";
import { SearchSheet } from "./quick/SearchSheet";
import { ContactQuick } from "./quick/ContactQuick";
import type { StoreProducto, StoreSucursal } from "../../types/storefront";
import { resolveNavEntries, type NavStyle, type ResolvedNavEntry } from "../../types/theme";
import { BranchSelector } from "../../design/BranchSelector";
import { useStorefrontAuthStore } from "../../store/useStorefrontAuthStore";
import { buyerUnreadNotificaciones, getStorefrontToken } from "../../api/ecommerce";
import { StoreNotificationsSheet } from "./StoreNotificationsSheet";
import { refreshStorefrontSession } from "../../utils/refreshStorefrontSession";

function buyerInitial(nombre?: string | null, email?: string | null) {
  const fromName = String(nombre || "")
    .trim()
    .charAt(0);
  if (fromName) return fromName.toUpperCase();
  const fromEmail = String(email || "")
    .trim()
    .charAt(0);
  if (fromEmail) return fromEmail.toUpperCase();
  return "U";
}

type Props = {
  tienda: StoreTienda;
  slug: string;
  cartCount: number;
  categorias: { nombre: string; count: number }[];
  onCategoria: (cat: string | null) => void;
  categoriaActiva: string | null;
  productos?: StoreProducto[];
  sucursales?: StoreSucursal[];
  activeBranchId?: number | null;
  onBranchSelect?: (id: number) => void;
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

function isEntryActive(entry: ResolvedNavEntry, categoriaActiva: string | null) {
  if (entry.kind === "all") return !categoriaActiva;
  if (entry.kind === "category") return categoriaActiva === entry.category;
  return false;
}

export function StoreHeader({
  tienda,
  slug,
  cartCount,
  categorias,
  onCategoria,
  categoriaActiva,
  productos = [],
  sucursales = [],
  activeBranchId,
  onBranchSelect,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();
  const { pref, cycle, allowToggle, theme } = useStoreColorScheme();
  const buyerToken = useStorefrontAuthStore((s) => s.token);
  const buyerUser = useStorefrontAuthStore((s) => s.user);
  const hydrate = useStorefrontAuthStore((s) => s.hydrate);

  useEffect(() => {
    if (!slug) return;
    hydrate(slug);
    if (!getStorefrontToken(slug)) return;
    void refreshStorefrontSession(slug);
  }, [slug, hydrate]);

  const unreadQ = useQuery({
    queryKey: ["buyer-notif-unread", slug],
    queryFn: () => buyerUnreadNotificaciones(slug),
    enabled: Boolean(slug && buyerToken),
    refetchInterval: 45_000,
    retry: false,
  });
  const unreadCount = Number(unreadQ.data?.data?.count) || 0;

  const headerStyle = theme.header_style;
  const nav = theme.nav;

  const entries = useMemo(() => resolveNavEntries(nav, categorias), [nav, categorias]);

  const openNotificaciones = () => {
    if (!buyerToken) {
      navigate(`/tienda/${slug}/login`, { state: { from: `/tienda/${slug}` } });
      return;
    }
    setNotifOpen(true);
  };

  const initial = buyerInitial(buyerUser?.nombre, buyerUser?.email);
  const activateEntry = (entry: ResolvedNavEntry) => {
    setSheetOpen(false);
    if (entry.kind === "link" && entry.href) {
      const href = entry.href.trim();
      if (href.startsWith("http://") || href.startsWith("https://")) {
        window.open(href, "_blank", "noopener,noreferrer");
        return;
      }
      if (href.startsWith("#")) {
        document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth" });
        return;
      }
      window.location.assign(href.startsWith("/") ? href : `/${href}`);
      return;
    }
    onCategoria(entry.kind === "category" ? entry.category : null);
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

  const renderEntry = (entry: ResolvedNavEntry, layout: "desktop" | "mobile") => {
    const active = isEntryActive(entry, categoriaActiva);
    if (layout === "mobile") {
      return (
        <button
          key={entry.id}
          type="button"
          onClick={() => activateEntry(entry)}
          className="store-nav-btn w-full text-left px-3 py-3 min-h-11 text-sm flex justify-between"
          style={activeStyle(active)}
        >
          <span>{entry.label}</span>
          {nav.show_counts && entry.count != null ? (
            <span className="store-muted">{entry.count}</span>
          ) : null}
        </button>
      );
    }
    return (
      <button
        key={entry.id}
        type="button"
        onClick={() => activateEntry(entry)}
        className={navItemClass(nav.style, active, isLight)}
        style={activeStyle(active)}
      >
        {entry.label}
        {nav.show_counts && entry.count != null ? (
          <span className="ml-1.5 text-[10px] opacity-60">{entry.count}</span>
        ) : null}
      </button>
    );
  };

  return (
    <>
      <header className={`sticky top-0 z-40 ${headerBg}`}>
        <div className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 lg:px-8 h-14">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="store-icon-btn lg:hidden size-10 sm:size-11 flex items-center justify-center shrink-0"
                aria-label="Menú"
              >
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
                    <p className="text-[11px] uppercase tracking-wider store-muted mb-2">Menú</p>
                    {entries.map((e) => renderEntry(e, "mobile"))}
                  </>
                )}
                {allowToggle && (
                  <button
                    type="button"
                    className="store-nav-btn w-full text-left px-3 py-3 min-h-11 text-sm flex items-center gap-2 mt-2"
                    onClick={() => {
                      cycle();
                    }}
                  >
                    <SchemeIcon className="size-4" />
                    Tema: {pref}
                  </button>
                )}
                {theme.quick_actions?.whatsapp !== false && (
                  <div className={`pt-4 border-t store-hairline ${showNav ? "mt-4" : ""}`}>
                    <ContactQuick telefono={tienda.telefono} />
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <Link to={`/tienda/${slug}`} className="flex items-center gap-2 min-w-0 shrink">
            {tienda.logo_url ? (
              <img src={tienda.logo_url} alt="" className="store-logo size-8 object-cover shrink-0" />
            ) : (
              <span
                className="store-logo size-8 flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                style={{ background: isAccent ? "rgba(0,0,0,0.25)" : "var(--vitrina-accent)" }}
              >
                {monograma(tienda.nombre)}
              </span>
            )}
            <span className="font-semibold text-sm truncate max-w-[7rem] sm:max-w-[12rem] md:max-w-[14rem]">
              {tienda.nombre}
            </span>
          </Link>

          {showNav && (
            <nav className="hidden lg:flex items-center gap-1 flex-1 min-w-0 mx-4 overflow-x-auto">
              {entries.map((e) => renderEntry(e, "desktop"))}
            </nav>
          )}

          <div className="flex-1 min-w-0" aria-hidden />

          <div className="flex items-center gap-0 shrink-0">
            {sucursales.length > 0 && onBranchSelect && (
              <>
                <div className="hidden md:block">
                  <BranchSelector
                    sucursales={sucursales}
                    activeId={activeBranchId ?? sucursales[0]?.id_sucursal}
                    onSelect={onBranchSelect}
                    variant="default"
                  />
                </div>
                <div className="md:hidden">
                  <BranchSelector
                    sucursales={sucursales}
                    activeId={activeBranchId ?? sucursales[0]?.id_sucursal}
                    onSelect={onBranchSelect}
                    variant="icon"
                  />
                </div>
              </>
            )}

            <button
              type="button"
              className="store-icon-btn size-10 sm:size-11 flex items-center justify-center"
              onClick={() => setSearchOpen(true)}
              aria-label="Buscar"
            >
              <Search className="size-5" />
            </button>
            {allowToggle && (
              <button
                type="button"
                className="store-icon-btn size-10 sm:size-11 hidden sm:flex items-center justify-center"
                onClick={cycle}
                aria-label={`Tema: ${pref}`}
              >
                <SchemeIcon className="size-4" />
              </button>
            )}
            <Link
              to={buyerToken ? `/tienda/${slug}/cuenta/favoritos` : `/tienda/${slug}/login`}
              className="store-icon-btn size-10 sm:size-11 items-center justify-center hidden sm:flex"
              aria-label="Favoritos"
            >
              <Heart className="size-5" />
            </Link>
            <button
              type="button"
              onClick={openNotificaciones}
              className="store-icon-btn relative size-10 sm:size-11 flex items-center justify-center"
              aria-label={
                unreadCount > 0 ? `Notificaciones (${unreadCount} sin leer)` : "Notificaciones"
              }
            >
              <Bell className="size-5" />
              {unreadCount > 0 && (
                <span
                  className="absolute top-1 right-1 min-w-4 h-4 px-1 text-[10px] font-bold flex items-center justify-center text-white rounded-full"
                  style={{ background: isAccent ? "rgba(0,0,0,0.35)" : "var(--vitrina-accent)" }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
            <Link
              to={buyerToken ? `/tienda/${slug}/cuenta` : `/tienda/${slug}/login`}
              className="store-icon-btn size-10 sm:size-11 flex items-center justify-center"
              aria-label={buyerToken && buyerUser ? `Cuenta de ${buyerUser.nombre}` : "Mi cuenta"}
            >
              {buyerToken && buyerUser ? (
                <span
                  className="size-7 sm:size-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold text-white"
                  style={{ background: "var(--vitrina-accent)" }}
                  aria-hidden
                >
                  {initial}
                </span>
              ) : (
                <User className="size-5" />
              )}
            </Link>
            <Link
              to={`/tienda/${slug}/carrito`}
              className="store-icon-btn relative size-10 sm:size-11 flex items-center justify-center"
              aria-label="Carrito"
            >
              <ShoppingBag className="size-5" />
              {cartCount > 0 && (
                <span
                  className="absolute top-1 right-1 min-w-4 h-4 px-1 text-[10px] font-bold flex items-center justify-center text-white rounded-full"
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
      <StoreNotificationsSheet
        slug={slug}
        open={notifOpen}
        onOpenChange={setNotifOpen}
        enabled={Boolean(buyerToken)}
      />
    </>
  );
}
