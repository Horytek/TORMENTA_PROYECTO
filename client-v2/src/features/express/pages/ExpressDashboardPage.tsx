import { useOutletContext, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { RefreshCw, ShoppingCart, PackagePlus, Users, History, Crown, PackageX, ArrowUpRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getExpressDashboardStats } from "../api/express";
import type { ExpressPermissions } from "../types";

const soles = (n: number | undefined | null) => `S/ ${(Number(n) || 0).toFixed(2)}`;

export default function ExpressDashboardPage() {
  const navigate = useNavigate();
  const { role, permissions } = useOutletContext<{ role: string; permissions: ExpressPermissions }>();

  const { data: stats, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["express-dashboard"],
    queryFn: getExpressDashboardStats,
  });

  const acciones = [
    { label: "Nueva Venta", icon: ShoppingCart, to: "/express-pos/pos", show: permissions?.sales },
    { label: "Nuevo Producto", icon: PackagePlus, to: "/express-pos/inventory", show: permissions?.inventory },
    { label: "Equipo", icon: Users, to: "/express-pos/users", show: role === "admin" },
    { label: "Historial", icon: History, to: "/express-pos/history", show: true },
  ].filter((a) => a.show);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <h1 className="text-lg font-bold text-foreground">Resumen</h1>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => refetch()}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-500">Ventas Hoy</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{soles(stats?.todayTotal)}</p>
          </CardContent>
        </Card>
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-blue-500">Pedidos</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{stats?.todayCount ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {acciones.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {acciones.map((a) => (
            <button
              key={a.label}
              onClick={() => navigate(a.to)}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-3 text-center transition-colors hover:bg-muted"
            >
              <a.icon className="h-5 w-5 text-amber-500" />
              <span className="text-[10px] font-medium text-foreground">{a.label}</span>
            </button>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">Actividad reciente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 pt-0">
          {stats?.recentSales?.length ? (
            stats.recentSales.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg px-1 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-foreground">Venta #{s.id}</span>
                  <span className="text-[11px] text-muted-foreground">{s.time}</span>
                </div>
                <span className="font-semibold text-foreground">{soles(s.total)}</span>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">Sin ventas todavía.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Stock bajo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 pt-0">
            {stats?.lowStock?.length ? (
              stats.lowStock.map((p) => (
                <div key={p.name} className="flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/5 px-2.5 py-1 text-[11px]">
                  <PackageX className="h-3 w-3 text-destructive" />
                  <span className="text-foreground">{p.name}</span>
                  <span className="text-muted-foreground">({p.stock})</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Todo con stock saludable.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Producto top</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {stats?.topProduct ? (
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-foreground">{stats.topProduct.name}</p>
                  <p className="text-[11px] text-muted-foreground">{stats.topProduct.sold} unidades vendidas</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin ventas suficientes esta semana.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">Ventas de la semana</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.weeklySales ?? []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="expressSalesColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" className="text-[10px] fill-muted-foreground" tickLine={false} axisLine={false} />
                <YAxis className="text-[10px] fill-muted-foreground" tickLine={false} axisLine={false} width={0} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "0.5rem", fontSize: "11px" }}
                  formatter={(value: any) => [soles(Number(value)), "Ventas"]}
                />
                <Area type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2} fill="url(#expressSalesColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
