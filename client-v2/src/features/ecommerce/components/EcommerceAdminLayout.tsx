import { Link, NavLink, Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
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
  Library,
  ScanLine,
  PackageCheck,
  Truck,
  MessageSquareText,
  Menu,
  X,
  Warehouse,
  Users,
  Shield,
} from "lucide-react";
import { useEcommerceAuthStore, type EcomUser } from "../store/useEcommerceAuthStore";
import { ecommerceMe } from "../api/ecommerce";
import { resetEcommerceAdminCache } from "../utils/resetEcommerceCache";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  perm: string;
  end?: boolean;
};

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "",
    items: [{ to: "/ecommerce-admin", label: "Dashboard", icon: LayoutDashboard, perm: "dashboard.ver", end: true }],
  },
  {
    label: "Pedidos",
    items: [
      { to: "/ecommerce-admin/pedidos-retiro", label: "Pedidos", icon: PackageCheck, perm: "pedidos.ver" },
      { to: "/ecommerce-admin/validar-retiro", label: "Recojo", icon: ScanLine, perm: "recojo.ver" },
      { to: "/ecommerce-admin/ordenes", label: "Órdenes", icon: ShoppingBag, perm: "ordenes.ver" },
    ],
  },
  {
    label: "Inventario",
    items: [
      { to: "/ecommerce-admin/stock", label: "Stock", icon: Warehouse, perm: "stock.ver" },
      { to: "/ecommerce-admin/inventario", label: "Inventario", icon: Boxes, perm: "inventario.ver" },
      { to: "/ecommerce-admin/transferencias", label: "Transferencias", icon: ArrowLeftRight, perm: "transferencias.ver" },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { to: "/ecommerce-admin/productos", label: "Productos", icon: Package, perm: "productos.ver" },
      { to: "/ecommerce-admin/catalogo", label: "Marcas y categorías", icon: Library, perm: "productos.ver" },
      { to: "/ecommerce-admin/atributos", label: "Atributos", icon: Tags, perm: "atributos.ver" },
    ],
  },
  {
    label: "Configuración",
    items: [
      { to: "/ecommerce-admin/sucursales", label: "Sucursales", icon: MapPin, perm: "sucursales.ver" },
      { to: "/ecommerce-admin/entregas", label: "Entregas", icon: Truck, perm: "entregas.ver" },
      { to: "/ecommerce-admin/resenas", label: "Reseñas", icon: MessageSquareText, perm: "resenas.ver" },
      { to: "/ecommerce-admin/usuarios", label: "Usuarios", icon: Users, perm: "usuarios.ver" },
      { to: "/ecommerce-admin/roles", label: "Roles", icon: Shield, perm: "roles.ver" },
      { to: "/ecommerce-admin/configuracion", label: "Configuración", icon: Settings, perm: "configuracion.ver" },
    ],
  },
];

function can(user: EcomUser | null, perm: string) {
  if (!user?.permisos?.length) return true;
  return user.permisos.includes(perm);
}

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
        {user?.rol?.nombre && (
          <div className="mt-1 text-[11px] text-stone-500">{user.rol.nombre}</div>
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
      <nav className="flex-1 p-2 space-y-3 overflow-y-auto">
        {NAV_GROUPS.map((g) => {
          const items = g.items.filter((it) => can(user, it.perm));
          if (!items.length) return null;
          return (
            <div key={g.label || "root"}>
              {g.label ? (
                <div className="px-3 pt-1 pb-1 text-[10px] uppercase tracking-widest text-stone-400">
                  {g.label}
                </div>
              ) : null}
              <div className="space-y-0.5">
                {items.map(({ to, label, icon: Icon, end }) => (
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
              </div>
            </div>
          );
        })}
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

function mapMeUser(data: Record<string, unknown>): EcomUser {
  const tienda = (data.tienda || {}) as Record<string, unknown>;
  return {
    usuario: String(data.usua || data.usuario || ""),
    email: String(tienda.email || data.email || ""),
    id_tienda: Number(data.id_tienda ?? tienda.id_tienda),
    slug: String(data.slug || tienda.slug || ""),
    tienda: String(tienda.nombre || data.nombre || ""),
    permisos: Array.isArray(data.permisos) ? (data.permisos as string[]) : [],
    sucursales: Array.isArray(data.sucursales)
      ? (data.sucursales as EcomUser["sucursales"])
      : [],
    acceso_global: Boolean(data.acceso_global),
    rol: data.rol as EcomUser["rol"],
  };
}

export function EcommerceAdminLayout() {
  const { token, user, setSession, clear, hydrate } = useEcommerceAuthStore();
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
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
          setSession(t, mapMeUser(res.data));
        } else {
          clear();
        }
      })
      .catch(() => clear())
      .finally(() => setReady(true));
  }, [hydrate, setSession, clear]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const allowedHrefs = useMemo(() => {
    return NAV_GROUPS.flatMap((g) => g.items)
      .filter((it) => can(user, it.perm))
      .map((it) => it.to);
  }, [user]);

  const pathOk = useMemo(() => {
    const path = location.pathname.replace(/\/$/, "") || "/ecommerce-admin";
    if (path === "/ecommerce-admin") return can(user, "dashboard.ver") || allowedHrefs.length > 0;
    return allowedHrefs.some((to) => path === to || path.startsWith(`${to}/`));
  }, [location.pathname, allowedHrefs, user]);

  useEffect(() => {
    if (!ready || !user) return;
    const path = location.pathname.replace(/\/$/, "") || "/ecommerce-admin";
    if (path === "/ecommerce-admin" && !can(user, "dashboard.ver")) {
      const first = allowedHrefs.find((h) => h !== "/ecommerce-admin");
      if (first) navigate(first, { replace: true });
    }
  }, [ready, user, location.pathname, allowedHrefs, navigate]);

  if (!ready) return null;
  if (!token) return <Navigate to="/login?mode=ecommerce" replace />;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col md:flex-row">
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
        {can(user, "recojo.ver") && (
          <Link
            to="/ecommerce-admin/validar-retiro"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-stone-900 text-white px-3 h-10 text-xs font-medium"
            onClick={() => setMenuOpen(false)}
          >
            <ScanLine className="size-3.5" />
            Recojo
          </Link>
        )}
      </header>

      {menuOpen && (
        <button
          type="button"
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          aria-label="Cerrar menú"
          onClick={() => setMenuOpen(false)}
        />
      )}

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
        {pathOk ? (
          <Outlet />
        ) : (
          <p className="text-sm text-stone-500">No tienes permiso para ver esta sección.</p>
        )}
      </main>
    </div>
  );
}
