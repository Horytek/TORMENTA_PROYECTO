import { Link, useLocation } from "react-router-dom";
import { Home, LayoutGrid, MapPin, ShoppingBag, MessageCircle } from "lucide-react";

type Props = {
  slug: string;
  cartCount: number;
  onHelpClick?: () => void;
};

export function StoreBottomNav({ slug, cartCount, onHelpClick }: Props) {
  const loc = useLocation();
  const base = `/tienda/${slug}`;
  const items = [
    { to: base, icon: Home, label: "Inicio", active: loc.pathname === base },
    { to: `${base}#catalogo`, icon: LayoutGrid, label: "Catálogo", active: false },
    { to: `${base}#sucursales-recojo`, icon: MapPin, label: "Sucursal", active: false },
    { to: `${base}/carrito`, icon: ShoppingBag, label: "Carrito", active: loc.pathname.includes("/carrito"), badge: cartCount },
    { action: onHelpClick, icon: MessageCircle, label: "Ayuda", active: false },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t store-hairline bg-[var(--vitrina-elevated)]/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 h-14">
        {items.map((item) => {
          const Icon = item.icon;
          const inner = (
            <>
              <span className="relative">
                <Icon className="size-5" />
                {item.badge ? (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-0.5 text-[9px] font-bold flex items-center justify-center text-white rounded-full bg-[var(--vitrina-accent)]">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                ) : null}
              </span>
              <span className="text-[10px]">{item.label}</span>
            </>
          );
          if (item.to) {
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`flex flex-col items-center justify-center gap-0.5 ${item.active ? "text-[var(--vitrina-accent)] font-semibold" : "store-muted"}`}
              >
                {inner}
              </Link>
            );
          }
          return (
            <button
              key={item.label}
              type="button"
              onClick={item.action}
              className="flex flex-col items-center justify-center gap-0.5 store-muted"
            >
              {inner}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
