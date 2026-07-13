import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calculator, TrendingUp, Package, CreditCard, Banknote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { getVentas } from "@/features/sales/api/ventas";
import type { VentasFilters } from "@/features/sales/types";

// ─────────────────────────────────────────────────────────────────
// SalesCalculatorTab — Analítica avanzada con gráficos y cálculos precisos
// ─────────────────────────────────────────────────────────────────

const CHART_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

function parseMetodoPago(metodoPago?: string, totalVenta: number = 0) {
  if (!metodoPago) return { efectivo: 0, digital: 0 };
  const upper = metodoPago.toUpperCase();
  if (upper === "EFECTIVO") return { efectivo: totalVenta, digital: 0 };
  if (["TARJETA", "TRANSFERENCIA", "YAPE", "PLIN"].includes(upper)) return { efectivo: 0, digital: totalVenta };
  if (metodoPago.includes(":")) {
    const parts = metodoPago.split(",").map((p) => p.trim());
    let efectivo = 0, digital = 0;
    for (const part of parts) {
      const idx = part.indexOf(":");
      if (idx !== -1) {
        const tipo = part.slice(0, idx).trim().toUpperCase();
        const monto = parseFloat(part.slice(idx + 1).trim()) || 0;
        if (tipo === "EFECTIVO") efectivo += monto;
        else if (["PLIN", "YAPE", "TARJETA", "TRANSFERENCIA", "VISA", "MASTERCARD"].includes(tipo)) digital += monto;
      }
    }
    return { efectivo, digital };
  }
  if (upper === "MIXTO") return { efectivo: totalVenta / 2, digital: totalVenta / 2 };
  return { efectivo: 0, digital: totalVenta };
}

export function SalesCalculatorTab() {
  const [filters, setFilters] = useState<VentasFilters>({
    fecha_inicio: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0],
    fecha_fin: new Date().toISOString().split("T")[0],
  });

  const { data: ventas = [], isLoading } = useQuery({
    queryKey: ["ventas-calculadora", filters],
    queryFn: () => getVentas(filters),
  });

  // ── Stats ──
  const stats = useMemo(() => {
    let total = 0, igv = 0, efectivo = 0, digital = 0, count = 0;
    ventas.forEach((v) => {
      const isCompletada = v.estado_venta === 1 || v.estado === 1;
      if (!isCompletada) return;
      count++;
      const saleTotal = Number(v.total_t ?? v.total ?? 0);
      total += saleTotal;
      igv += Number(v.igv ?? 0);
      const split = parseMetodoPago(v.metodo_pago, saleTotal);
      efectivo += split.efectivo;
      digital += split.digital;
    });
    const days = Math.max(1,
      Math.ceil((new Date(filters.fecha_fin!).getTime() - new Date(filters.fecha_inicio!).getTime()) / 86400000) + 1
    );
    return {
      count, total, igv, efectivo, digital,
      promedioDia: total / days,
      promedioVenta: count > 0 ? total / count : 0,
      margen: count > 0 ? igv / count : 0,
    };
  }, [ventas, filters]);

  // ── Gráfico: Ventas por día (barras) ──
  const chartPorDia = useMemo(() => {
    const map: Record<string, number> = {};
    ventas.forEach((v) => {
      const isCompletada = v.estado_venta === 1 || v.estado === 1;
      if (!isCompletada) return;
      const d = v.f_venta ?? "";
      map[d] = (map[d] ?? 0) + Number(v.total_t ?? v.total ?? 0);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, total]) => ({ fecha: fecha.slice(5), total: Math.round(total * 100) / 100 }));
  }, [ventas]);

  // ── Gráfico: Distribución por método de pago (pie) ──
  const chartPorMetodo = useMemo(() => {
    const map: Record<string, number> = {};
    ventas.forEach((v) => {
      const isCompletada = v.estado_venta === 1 || v.estado === 1;
      if (!isCompletada) return;
      const mp = v.metodo_pago ?? "OTRO";
      // Parse mixto para desglosar
      if (mp.includes(":")) {
        mp.split(",").forEach((part) => {
          const idx = part.indexOf(":");
          if (idx !== -1) {
            const tipo = part.slice(0, idx).trim().toUpperCase();
            const monto = parseFloat(part.slice(idx + 1).trim()) || 0;
            map[tipo] = (map[tipo] ?? 0) + monto;
          }
        });
      } else {
        map[mp] = (map[mp] ?? 0) + Number(v.total_t ?? 0);
      }
    });
    return Object.entries(map).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
  }, [ventas]);

  // ── Gráfico: Por tipo de comprobante ──
  const chartPorComprobante = useMemo(() => {
    const map: Record<string, number> = {};
    ventas.forEach((v) => {
      const isCompletada = v.estado_venta === 1 || v.estado === 1;
      if (!isCompletada) return;
      const tipo = v.id_comprobante ?? "Otro";
      map[tipo] = (map[tipo] ?? 0) + Number(v.total_t ?? 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
  }, [ventas]);

  // ── Top 5 productos (mock — aproximado desde el total de ventas) ──
  const topClientes = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    ventas.forEach((v) => {
      const isCompletada = v.estado_venta === 1 || v.estado === 1;
      if (!isCompletada) return;
      const name = v.nom_cliente ?? "Varios";
      if (!map[name]) map[name] = { total: 0, count: 0 };
      map[name].total += Number(v.total_t ?? 0);
      map[name].count++;
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 5)
      .map(([name, { total, count }]) => ({ name, total: Math.round(total * 100) / 100, count }));
  }, [ventas]);

  const hasData = ventas.some((v) => v.estado_venta === 1 || v.estado === 1);

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Filtros */}
      <Card className="rounded-none border-0 border-b border-border bg-card shrink-0">
        <div className="flex flex-wrap items-end gap-2 p-2">
          <div className="space-y-1">
            <Label className="text-xs">Desde</Label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input type="date" value={filters.fecha_inicio ?? ""}
                onChange={(e) => setFilters((f) => ({ ...f, fecha_inicio: e.target.value }))}
                className="pl-8 h-8 text-xs w-auto" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Hasta</Label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input type="date" value={filters.fecha_fin ?? ""}
                onChange={(e) => setFilters((f) => ({ ...f, fecha_fin: e.target.value }))}
                className="pl-8 h-8 text-xs w-auto" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tipo</Label>
            <Select value={filters.id_comprobante ?? "all"}
              onValueChange={(v) => setFilters((f) => ({ ...f, id_comprobante: v === "all" ? undefined : v }))}>
              <SelectTrigger className="h-8 text-xs w-auto min-w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Boleta">Boleta</SelectItem>
                <SelectItem value="Factura">Factura</SelectItem>
                <SelectItem value="Nota">Nota</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Estado</Label>
            <Select value={String(filters.estado ?? "all")}
              onValueChange={(v) => setFilters((f) => ({ ...f, estado: v === "all" ? undefined : Number(v) }))}>
              <SelectTrigger className="h-8 text-xs w-auto min-w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="1">Completadas</SelectItem>
                <SelectItem value="0">Anuladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Calculator className="h-3 w-3" /> Calcular
          </Button>
        </div>
      </Card>

      {/* Cards de estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-2 shrink-0">
        <StatCard label="Total ventas" value={`S/ ${stats.total.toFixed(2)}`} accent />
        <StatCard label="N° Ventas" value={stats.count.toString()} />
        <StatCard label="IGV total" value={`S/ ${stats.igv.toFixed(2)}`} />
        <StatCard label="Efectivo" value={`S/ ${stats.efectivo.toFixed(2)}`} />
        <StatCard label="Digital" value={`S/ ${stats.digital.toFixed(2)}`} />
        <StatCard label="Promedio/día" value={`S/ ${stats.promedioDia.toFixed(2)}`} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center flex-1"><Spinner size="lg" /></div>
      ) : !hasData ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-muted-foreground">
          <Calculator className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm">Sin datos en el período seleccionado</p>
        </div>
      ) : (
        /* Gráficos */
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 p-3 overflow-auto">
          {/* Ventas por día */}
          <Card className="p-3">
            <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" /> Ventas por día
            </h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartPorDia} margin={{ top: 2, right: 2, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `S/${v}`} />
                  <Tooltip formatter={(v: any) => [`S/ ${v.toFixed(2)}`, "Total"]} contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="total" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Ventas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/*Método de pago */}
          <Card className="p-3">
            <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-primary" /> Por método de pago
            </h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartPorMetodo} cx="50%" cy="50%" outerRadius={70}
                    dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false} fontSize={10}>
                    {chartPorMetodo.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: any) => [`S/ ${v.toFixed(2)}`, "Monto"]} contentStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Por tipo de comprobante */}
          <Card className="p-3">
            <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-primary" /> Por tipo de comprobante
            </h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartPorComprobante} layout="vertical" margin={{ top: 2, right: 2, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `S/${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={60} />
                  <Tooltip formatter={(v: any) => [`S/ ${v.toFixed(2)}`, "Total"]} contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="value" name="Total" radius={[0, 3, 3, 0]}>
                    {chartPorComprobante.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Top clientes */}
          <Card className="p-3">
            <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
              <Banknote className="h-3.5 w-3.5 text-primary" /> Top 5 Clientes
            </h3>
            <div className="space-y-2">
              {topClientes.map((c, i) => (
                <div key={c.name} className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground w-4">{i + 1}.</span>
                  <span className="text-xs flex-1 truncate font-medium">{c.name}</span>
                  <Badge variant="outline" className="text-[10px] shrink-0">{c.count} ventas</Badge>
                  <span className="text-xs font-bold tabular-nums text-primary shrink-0">S/ {c.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
            {/* Indicadores extra */}
            <div className="mt-3 pt-3 border-t border-border space-y-1.5">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">IGV promedio por venta</span>
                <span className="font-semibold tabular-nums">S/ {stats.margen.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Ticket promedio</span>
                <span className="font-semibold tabular-nums">S/ {stats.promedioVenta.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Ratio efectivo/digital</span>
                <span className="font-semibold tabular-nums">
                  {stats.digital > 0 ? `${(stats.efectivo / stats.digital).toFixed(2)}x` : "∞"}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card className="rounded-lg border border-border bg-card">
      <div className="p-2">
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground/70 font-medium leading-none mb-1">{label}</p>
        <p className={["text-sm font-bold tabular-nums leading-none", accent ? "text-primary" : "text-foreground"].join(" ")}>{value}</p>
      </div>
    </Card>
  );
}
