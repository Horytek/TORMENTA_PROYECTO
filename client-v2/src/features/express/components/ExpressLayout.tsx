import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Home, ShoppingCart, Package, Users, Bell, Settings, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { applyTheme } from "@/lib/theme";
import { getExpressMe } from "../api/express";
import { ExpressNotificationsDrawer } from "./ExpressNotificationsDrawer";

const TABS = [
  { to: "/express-pos/dashboard", label: "Inicio", icon: Home, gate: null as "sales" | "inventory" | "admin" | null },
  { to: "/express-pos/pos", label: "Vender", icon: ShoppingCart, gate: "sales" as const },
  { to: "/express-pos/inventory", label: "Stock", icon: Package, gate: "inventory" as const },
  { to: "/express-pos/users", label: "Equipo", icon: Users, gate: "admin" as const },
];

/**
 * Shell de Pocket POS: mobile-first, tema oscuro forzado, nav inferior tipo
 * dock. Deliberadamente distinto de `DashboardLayout` (sidebar de escritorio)
 * — Pocket POS es un producto aparte, pensado para verse bien en un teléfono
 * detrás del mostrador.
 */
export function ExpressLayout() {
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    applyTheme("dark");
    return () => {
      const saved = (localStorage.getItem("theme") as "light" | "dark" | null) ?? "light";
      applyTheme(saved);
    };
  }, []);

  const { data: me, isLoading, isError } = useQuery({
    queryKey: ["express-me"],
    queryFn: getExpressMe,
    retry: false,
  });

  useEffect(() => {
    if (isError) navigate("/login", { replace: true });
  }, [isError, navigate]);

  if (isLoading || !me) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <p className="text-sm text-muted-foreground">Cargando Pocket POS…</p>
      </div>
    );
  }

  const visibleTabs = TABS.filter((tab) => {
    if (!tab.gate) return true;
    if (tab.gate === "admin") return me.role === "admin";
    return me.permissions?.[tab.gate];
  });

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{me.name}</p>
          <p className="text-[11px] text-muted-foreground">{me.role === "admin" ? "Administrador" : "Vendedor"}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setNotifOpen(true)}>
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate("/express-pos/settings")}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4">
        <Outlet context={{ role: me.role, permissions: me.permissions }} />
      </main>

      <nav className="fixed inset-x-0 bottom-4 z-20 mx-auto flex w-fit items-center gap-1 rounded-full border border-border bg-card/95 p-1.5 shadow-lg backdrop-blur">
        {visibleTabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 rounded-full px-4 py-2 text-[10px] font-medium transition-colors",
                isActive ? "bg-amber-500 text-black" : "text-muted-foreground hover:bg-muted"
              )
            }
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <ExpressNotificationsDrawer open={notifOpen} onOpenChange={setNotifOpen} />
    </div>
  );
}
