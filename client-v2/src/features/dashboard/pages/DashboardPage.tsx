import { useState, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUserStore } from "@/store/useUserStore";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  X,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdaptiveCard } from "@/components/shared/AdaptiveCollection";
import type { FieldDef } from "@/components/shared/AdaptiveCollection";

// API endpoints
import {
  getSucursalesDashboard,
  getVentasTotal,
  getNuevosClientes,
  getProductSell,
  getNotasPendientes,
  getProductosBajoStock,
  getVentasPorSucursal,
} from "../api/dashboard";
import { getPL } from "@/features/accounting/api/accounting";
import { getNegocio } from "@/features/settings/api/settings";

// Components
import { QuickActionsCard } from "../components/QuickActionsCard";
import { StockCard } from "../components/StockCard";
import { PerformanceCard } from "../components/PerformanceCard";
// recharts (~132KB gzip) pesa solo por este gráfico → diferido para que el
// dashboard (KPIs + tablas) pinte al instante y el chart cargue después.
const DashboardLineChart = lazy(() =>
  import("../components/DashboardLineChart").then((m) => ({ default: m.DashboardLineChart }))
);
import { RecentTransactionsTable } from "../components/RecentTransactionsTable";
import { NotasPendientesModal } from "../components/NotasPendientesModal";

interface DashboardTile {
  id: string;
  label: string;
  value: number;
  delta?: number;
  deltaLabel?: string;
  onClick?: () => void;
  badge?: { label: string; tone: "success" | "warning" };
}

const tileFields: FieldDef<DashboardTile>[] = [
  { key: "value", priority: "primary", semantic: "kpi", label: "" },
  {
    key: "delta", priority: "secondary", label: "",
    render: (v, item) => {
      if (v == null) return item.badge ? (
        <span
          onClick={item.onClick}
          className={cn(
            "cursor-pointer rounded px-1.5 py-0.5 text-[10px] font-bold",
            item.badge.tone === "success"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
              : "animate-pulse bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400"
          )}
        >
          {item.badge.label}
        </span>
      ) : null;
      const num = Number(v);
      const positive = num >= 0;
      return (
        <span className={cn("flex items-center gap-1", positive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
          {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {Math.abs(num).toFixed(1)}% {item.deltaLabel}
        </span>
      );
    },
  },
];

const TAB_PERIODS = [
  { key: "24h", label: "24H" },
  { key: "semana", label: "Semana" },
  { key: "mes", label: "Mes" },
  { key: "anio", label: "Año" },
];

export default function DashboardPage() {
  const username = useUserStore((s) => s.nombre || s.usuario || "tormenta");

  // null (sin configurar) = mostrar todas las secciones.
  const { data: negocio } = useQuery({ queryKey: ["negocio"], queryFn: getNegocio });
  const widgets = negocio?.dashboard_widgets ?? null;
  const showWidget = (key: string) => widgets === null || widgets.includes(key);

  const [selectedTab, setSelectedTab] = useState("24h");
  const [selectedSucursal, setSelectedSucursal] = useState<string>("all");
  const [isNotasModalOpen, setIsNotasModalOpen] = useState(false);

  // Queries
  const { data: sucursales = [] } = useQuery({
    queryKey: ["dashboard-sucursales"],
    queryFn: getSucursalesDashboard,
  });

  const queryParams = {
    tiempo: selectedTab,
    usuario: username,
    sucursal: selectedSucursal === "all" ? undefined : selectedSucursal,
  };

  const { data: ventasKpi, isLoading: isLoadingVentas } = useQuery({
    queryKey: ["dashboard-ventas-total", queryParams],
    queryFn: () => getVentasTotal(queryParams),
  });

  const { data: clientesKpi, isLoading: isLoadingClientes } = useQuery({
    queryKey: ["dashboard-clientes-nuevos", queryParams],
    queryFn: () => getNuevosClientes(queryParams),
  });

  const { data: productosKpi, isLoading: isLoadingProductos } = useQuery({
    queryKey: ["dashboard-productos-vendidos", queryParams],
    queryFn: () => getProductSell(queryParams),
  });

  const { data: notasPendientes = [], refetch: refetchNotas } = useQuery({
    queryKey: ["dashboard-notas-pendientes", selectedSucursal],
    queryFn: () => getNotasPendientes({
      id_sucursal: selectedSucursal === "all" ? undefined : selectedSucursal,
    }),
  });

  const { data: bajoStock = [], isLoading: isLoadingStock } = useQuery({
    queryKey: ["dashboard-bajo-stock", selectedSucursal],
    queryFn: () => getProductosBajoStock({
      sucursal: selectedSucursal === "all" ? undefined : selectedSucursal,
    }),
  });

  // Utilidad del mes (Contabilidad — Fase 4). Si el tenant no tiene permiso
  // sobre el módulo, el backend responde 403 y la tarjeta simplemente
  // queda en estado de carga silenciosa (no rompe el resto del dashboard).
  const monthRange = (() => {
    const d = new Date();
    return {
      fechaInicio: new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10),
      fechaFin: d.toISOString().slice(0, 10),
    };
  })();
  const { data: plData, isLoading: isLoadingPL } = useQuery({
    queryKey: ["dashboard-pl", monthRange.fechaInicio, monthRange.fechaFin],
    queryFn: () => getPL(monthRange.fechaInicio, monthRange.fechaFin),
    retry: false,
  });

  const { data: desempenoData, isLoading: isLoadingDesempeno } = useQuery({
    queryKey: ["dashboard-desempeno-sucursales", selectedTab, selectedSucursal],
    queryFn: () => getVentasPorSucursal({
      tiempo: selectedTab,
      sucursal: selectedSucursal === "all" ? undefined : selectedSucursal,
    }),
  });

  const formatPeriodDeltaLabel = () => {
    if (selectedTab === "24h") return "vs. ayer";
    if (selectedTab === "semana") return "vs. sem. ant.";
    if (selectedTab === "mes") return "vs. mes ant.";
    return "vs. año ant.";
  };

  return (
    <div className="w-full space-y-8 p-1 sm:p-4 animate-fade-in font-inter">
      {/* Encabezado */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Panel Principal
          </h1>
          <p className="text-sm text-muted-foreground">
            Visión general del rendimiento y estado del negocio.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
          {/* Sucursal Selector */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Select value={selectedSucursal} onValueChange={setSelectedSucursal}>
              <SelectTrigger className="w-full sm:w-52 h-9 text-xs font-semibold bg-card border-border rounded-xl">
                <Building2 className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Todas las sucursales" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Todas las sucursales</SelectItem>
                {sucursales.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)} className="text-xs">
                    {s.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedSucursal !== "all" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedSucursal("all")}
                className="h-9 w-9 rounded-xl shrink-0 hover:bg-muted"
                title="Limpiar filtro de sucursal"
              >
                <X className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>

          {/* Time Tabs */}
          <div className="flex bg-muted/40 p-0.5 rounded-lg border border-border/45 select-none shrink-0 w-full sm:w-auto">
            {TAB_PERIODS.map((tab) => (
              <Button
                key={tab.key}
                variant={selectedTab === tab.key ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSelectedTab(tab.key)}
                className={cn(
                  "h-7 px-3 text-[11px] font-bold rounded-md flex-1 sm:flex-initial",
                  selectedTab === tab.key
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      </header>

      {/* KPI Cards Grid — AdaptiveCard variant="stat-tile" (Fase 5) */}
      {showWidget("kpis") && (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {(() => {
          const deltaLabel = formatPeriodDeltaLabel();
          const tiles: DashboardTile[] = [
            {
              id: "ventas", label: "Ventas Totales",
              value: Number(ventasKpi?.data ?? 0),
              delta: isLoadingVentas ? undefined : Number(ventasKpi?.cambio ?? 0),
              deltaLabel,
            },
            {
              id: "clientes", label: "Nuevos Clientes",
              value: Number(clientesKpi?.nuevosClientes ?? 0),
              delta: isLoadingClientes ? undefined : Number(clientesKpi?.cambio ?? 0),
              deltaLabel,
            },
            {
              id: "productos", label: "Productos Vendidos",
              value: Number(productosKpi?.totalProductosVendidos ?? 0),
              delta: isLoadingProductos ? undefined : Number(productosKpi?.cambio ?? 0),
              deltaLabel,
            },
            {
              id: "notas", label: "Notas en Espera",
              value: notasPendientes.length,
              onClick: notasPendientes.length > 0 ? () => setIsNotasModalOpen(true) : undefined,
              badge: notasPendientes.length === 0
                ? { label: "Al día", tone: "success" }
                : { label: "Ver pendientes", tone: "warning" },
            },
            {
              id: "utilidad", label: "Utilidad del Mes",
              value: isLoadingPL ? 0 : Number(plData?.utilidad ?? 0),
              badge: isLoadingPL ? undefined : undefined,
            },
          ];
          return tiles.map((tile, i) => (
            <AdaptiveCard<DashboardTile>
              key={tile.id}
              item={tile}
              index={i}
              fields={tileFields.map((f) => ({ ...f, label: f.key === "value" ? tile.label : f.label }))}
              variant="stat-tile"
              getItemId={(t) => t.id}
              state={tile.id === "utilidad" ? (tile.value >= 0 ? "active" : "error") : "neutral"}
            />
          ));
        })()}
      </div>
      )}

      {/* Main Charts & Table Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Side: LineChart & Transactions */}
        <div className="lg:col-span-2 space-y-6">
          {showWidget("grafico") && (
          <Suspense fallback={<div className="h-[340px] w-full animate-pulse rounded-xl border border-border/60 bg-muted/40" />}>
            <DashboardLineChart sucursal={selectedSucursal === "all" ? "" : selectedSucursal} usuario={username} />
          </Suspense>
          )}
          {showWidget("transacciones") && <RecentTransactionsTable className="flex-1" />}
        </div>

        {/* Right Side: Quick Actions & Side Stats */}
        <div className="space-y-6">
          {showWidget("accionesRapidas") && <QuickActionsCard />}
          {showWidget("stockBajo") && <StockCard productos={bajoStock} loading={isLoadingStock} />}
          {showWidget("desempeno") && (
          <PerformanceCard
            sucursales={desempenoData?.sucursales || []}
            promedioGeneral={desempenoData?.promedioGeneral || 0}
            loading={isLoadingDesempeno}
          />
          )}
        </div>
      </div>

      {/* Modal de Notas Pendientes */}
      <NotasPendientesModal
        open={isNotasModalOpen}
        onClose={() => setIsNotasModalOpen(false)}
        notas={notasPendientes}
        refetchNotas={refetchNotas}
        usuarioName={username}
      />
    </div>
  );
}
