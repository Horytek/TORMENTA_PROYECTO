import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import { User, Package, Heart, Settings, LogOut, MessageSquareText, ClipboardList } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { buyerMe, getStore } from "../api/ecommerce";
import { useStorefrontAuthStore } from "../store/useStorefrontAuthStore";
import { StoreShell } from "../components/vitrina/StoreShell";
import { StorefrontAuthGuard } from "../components/vitrina/StorefrontAuthGuard";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "", label: "Resumen", icon: User, end: true },
  { to: "pedidos", label: "Mis pedidos", icon: Package },
  { to: "solicitudes", label: "Solicitudes", icon: ClipboardList },
  { to: "favoritos", label: "Favoritos", icon: Heart },
  { to: "opiniones", label: "Mis opiniones", icon: MessageSquareText },
  { to: "perfil", label: "Perfil", icon: Settings },
];

function AccountLayoutInner() {
  const { slug = "" } = useParams();
  const user = useStorefrontAuthStore((s) => s.user);
  const clear = useStorefrontAuthStore((s) => s.clear);

  const storeQ = useQuery({
    queryKey: ["store-meta", slug],
    queryFn: () => getStore(slug),
    enabled: Boolean(slug),
  });
  const tienda = storeQ.data?.data?.tienda || { slug, nombre: slug, color_primario: "#0E7C7B" };

  return (
    <StoreShell tienda={tienda} slug={slug}>
      <div className="max-w-4xl mx-auto px-4 py-8 lg:py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Link to={`/tienda/${slug}`} className="text-sm store-muted hover:underline">
              ← Tienda
            </Link>
            <h1 className="text-2xl font-semibold mt-2">Mi cuenta</h1>
            <p className="text-sm store-muted">{user?.nombre} · {user?.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => clear()}>
            <LogOut className="size-4 mr-1" /> Cerrar sesión
          </Button>
        </div>
        <nav className="flex gap-1 overflow-x-auto pb-2 mb-6 border-b store-hairline">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to ? `/tienda/${slug}/cuenta/${to}` : `/tienda/${slug}/cuenta`}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg whitespace-nowrap",
                  isActive
                    ? "bg-[var(--vitrina-accent-soft)] text-[var(--vitrina-accent)] font-medium"
                    : "store-muted hover:bg-black/5"
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <Outlet />
      </div>
    </StoreShell>
  );
}

export default function StoreAccountLayout() {
  return (
    <StorefrontAuthGuard>
      <AccountLayoutInner />
    </StorefrontAuthGuard>
  );
}

export function StoreAccountHomePage() {
  const { slug = "" } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["buyer-me", slug],
    queryFn: () => buyerMe(slug),
  });
  const stats = data?.data?.stats;

  if (isLoading) return <p className="store-muted">Cargando…</p>;

  const cards = [
    { label: "Pedidos totales", value: stats?.total_pedidos ?? 0 },
    { label: "Pedidos activos", value: stats?.pedidos_activos ?? 0 },
    { label: "Listos para retiro", value: stats?.listos_retiro ?? 0 },
    { label: "Favoritos", value: stats?.total_favoritos ?? 0 },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="vitrina-card border store-hairline p-4 bg-[var(--vitrina-elevated)]">
          <p className="text-xs store-muted uppercase tracking-wide">{c.label}</p>
          <p className="text-2xl font-semibold mt-1">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
