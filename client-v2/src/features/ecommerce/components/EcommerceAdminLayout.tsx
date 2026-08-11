import { Link, NavLink, Outlet, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { LayoutDashboard, Package, ShoppingBag, Settings, LogOut, Store, MapPin, Boxes, ArrowLeftRight } from "lucide-react";
import { useEcommerceAuthStore } from "../store/useEcommerceAuthStore";
import { ecommerceMe } from "../api/ecommerce";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/ecommerce-admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/ecommerce-admin/productos", label: "Productos", icon: Package },
  { to: "/ecommerce-admin/sucursales", label: "Sucursales", icon: MapPin },
  { to: "/ecommerce-admin/inventario", label: "Inventario", icon: Boxes },
  { to: "/ecommerce-admin/transferencias", label: "Transferencias", icon: ArrowLeftRight },
  { to: "/ecommerce-admin/ordenes", label: "Órdenes", icon: ShoppingBag },
  { to: "/ecommerce-admin/configuracion", label: "Configuración", icon: Settings },
];

export function EcommerceAdminLayout() {
  const { token, user, setSession, clear, hydrate } = useEcommerceAuthStore();
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

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

  if (!ready) return null;
  if (!token) return <Navigate to="/login?mode=ecommerce" replace />;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex">
      <aside className="w-56 border-r border-stone-200 bg-white flex flex-col shrink-0">
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
            >
              <Store className="size-3" /> /tienda/{user.slug}
            </Link>
          )}
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-stone-100">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-stone-600"
            onClick={() => {
              clear();
              navigate("/login?mode=ecommerce");
            }}
          >
            <LogOut className="size-4" /> Salir
          </Button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
