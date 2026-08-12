import { Link, NavLink, Outlet, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Settings,
  LogOut,
  Store,
  MapPin,
  Boxes,
  ArrowLeftRight,
  Tags,
  ScanLine,
  PackageCheck,
  Truck,
  MessageSquareText,
  Menu,
  X,
} from "lucide-react";
import { useEcommerceAuthStore } from "../store/useEcommerceAuthStore";
import { ecommerceMe } from "../api/ecommerce";
import { resetEcommerceAdminCache } from "../utils/resetEcommerceCache";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/ecommerce-admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/ecommerce-admin/productos", label: "Productos", icon: Package },
  { to: "/ecommerce-admin/atributos", label: "Atributos", icon: Tags },
  { to: "/ecommerce-admin/sucursales", label: "Sucursales", icon: MapPin },
  { to: "/ecommerce-admin/entregas", label: "Entregas", icon: Truck },
  { to: "/ecommerce-admin/inventario", label: "Inventario", icon: Boxes },
  { to: "/ecommerce-admin/transferencias", label: "Transferencias", icon: ArrowLeftRight },
  { to: "/ecommerce-admin/pedidos-retiro", label: "Pedidos", icon: PackageCheck },
  { to: "/ecommerce-admin/validar-retiro", label: "Recojo", icon: ScanLine },
  { to: "/ecommerce-admin/ordenes", label: "Órdenes", icon: ShoppingBag },
  { to: "/ecommerce-admin/resenas", label: "Reseñas", icon: MessageSquareText },
  { to: "/ecommerce-admin/configuracion", label: "Configuración", icon: Settings },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { user, clear } = useEcommerceAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return (
    <>
      <div className="p-4 border-b border-stone-100">
        <div className="text-[10px] uppercase tracking-widest text-stone-400">Horytek · Ecommerce</div>
        <div className="font-semibold truncate mt-0.5">{user?.tienda || "Admin"}</div>
        {user?.slug && (
          <div className="mt-1 text-[11px] text-stone-400 truncate">
            {user.slug} · id {user.id_tienda}
          </div>
        )}
        {user?.slug && (
          <Link
            to={`/tienda/${user.slug}`}
            target="_blank"
            className="mt-2 inline-flex items-center gap-1 text-xs text-teal-700 hover:underline"
            onClick={onNavigate}
          >
            <Store className="size-3" /> /tienda/{user.slug}
          </Link>
        )}
      </div>
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors min-h-11",
                isActive ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"
              )
            }
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-stone-100">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-stone-600 min-h-11"
          onClick={() => {
            resetEcommerceAdminCache(queryClient);
            clear();
            navigate("/login?mode=ecommerce");
            onNavigate?.();
          }}
        >
          <LogOut className="size-4" /> Salir
        </Button>
      </div>
    </>
  );
}

export function EcommerceAdminLayout() {
  const { token, user, setSession, clear, hydrate } = useEcommerceAuthStore();
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    hydrate();
    const t = useEcommerceAuthStore.getState().token;
    if (!t) {
      setReady(true);
      return;
    }
    ecommerceMe()
      .then((res) => {
        if (res.success && res.data) {
          setSession(t, {
            usuario: res.data.usua || res.data.usuario,
            email: res.data.tienda?.email || "",
            id_tienda: res.data.id_tienda ?? res.data.tienda?.id_tienda,
            slug: res.data.slug || res.data.tienda?.slug,
            tienda: res.data.tienda?.nombre || res.data.nombre,
          });
        } else {
          clear();
        }
      })
      .catch(() => clear())
      .finally(() => setReady(true));
  }, [hydrate, setSession, clear]);

  // Cerrar drawer al pasar a desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!ready) return null;
  if (!token) return <Navigate to="/login?mode=ecommerce" replace />;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col md:flex-row">
      {/* Top bar móvil */}
      <header className="md:hidden sticky top-0 z-40 flex items-center gap-3 border-b border-stone-200 bg-white px-3 h-14 shrink-0">
        <button
          type="button"
          className="size-11 flex items-center justify-center rounded-lg hover:bg-stone-100"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-widest text-stone-400">Ecommerce</div>
          <div className="font-semibold text-sm truncate">{user?.tienda || "Admin"}</div>
        </div>
        <Link
          to="/ecommerce-admin/validar-retiro"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-stone-900 text-white px-3 h-10 text-xs font-medium"
          onClick={() => setMenuOpen(false)}
        >
          <ScanLine className="size-3.5" />
          Recojo
        </Link>
      </header>

      {/* Overlay móvil */}
      {menuOpen && (
        <button
          type="button"
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          aria-label="Cerrar menú"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Sidebar: drawer en móvil, fijo en desktop */}
      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-50 w-[min(100%,18rem)] border-r border-stone-200 bg-white flex flex-col shrink-0",
          "transition-transform duration-200 ease-out md:translate-x-0",
          menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <SidebarNav onNavigate={() => setMenuOpen(false)} />
      </aside>

      <main className="flex-1 min-w-0 p-4 sm:p-6 overflow-auto pb-20 md:pb-6">
        <Outlet />
      </main>
    </div>
  );
}
