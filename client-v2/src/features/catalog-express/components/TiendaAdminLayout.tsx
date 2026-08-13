import { Link, NavLink, Navigate, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ExternalLink,
  Image as ImageIcon,
  MapPin,
  MessageSquareText,
  PackageCheck,
  Percent,
  ScanLine,
  Settings,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";
import { adminGetTiendaConfig } from "../api/catalogoPublico";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/catalog-express/pedidos", label: "Pedidos", icon: PackageCheck },
  { to: "/catalog-express/recojo", label: "Recojo", icon: ScanLine },
  { to: "/catalog-express/ordenes", label: "Órdenes", icon: ShoppingBag },
  { to: "/catalog-express/resenas", label: "Reseñas", icon: MessageSquareText },
  { to: "/catalog-express/cupones", label: "Cupones", icon: Percent },
  { to: "/catalog-express/sucursales", label: "Sucursales", icon: MapPin },
  { to: "/catalog-express/entrega", label: "Entrega", icon: Truck },
  { to: "/catalog-express/banners", label: "Banners", icon: ImageIcon },
  { to: "/catalog-express/configuracion", label: "Configuración", icon: Settings },
];

export default function TiendaAdminLayout() {
  const { data: cfg } = useQuery({
    queryKey: ["tienda-admin-config"],
    queryFn: adminGetTiendaConfig,
  });
  const slug = cfg?.slug as string | undefined;
  const nombre = (cfg?.nombre_publico as string) || "Tienda web";
  const publicUrl = slug ? `/s/${slug}` : null;

  return (
    <div className="space-y-4 -mt-1">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-teal-700">
            <Store className="size-3.5" /> Módulo ERP
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight truncate">{nombre}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pedidos, recojo y configuración de la vitrina.
            {cfg?.mp_conectado ? (
              <span className="text-emerald-700"> Mercado Pago conectado.</span>
            ) : (
              <span className="text-amber-700"> Mercado Pago sin conectar.</span>
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          {publicUrl && (
            <Link
              to={publicUrl}
              target="_blank"
              className="inline-flex h-11 min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-semibold hover:bg-muted"
            >
              <ExternalLink className="size-4" /> Abrir vitrina
            </Link>
          )}
          <Link
            to="/products"
            className="inline-flex h-11 min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-semibold hover:bg-muted"
          >
            Productos ERP
          </Link>
        </div>
      </div>

      <nav className="-mx-1 overflow-x-auto pb-1">
        <div className="flex min-w-max gap-1 rounded-xl border border-border bg-muted/40 p-1">
          {NAV.map((it) => {
            const Icon = it.icon;
            return (
              <NavLink
                key={it.to}
                to={it.to}
                className={({ isActive }) =>
                  cn(
                    "inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm whitespace-nowrap transition-colors",
                    isActive
                      ? "bg-background text-foreground font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                  )
                }
              >
                <Icon className="size-3.5 shrink-0 opacity-80" />
                {it.label}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <Outlet />
    </div>
  );
}

export function TiendaAdminIndexRedirect() {
  return <Navigate to="/catalog-express/pedidos" replace />;
}
