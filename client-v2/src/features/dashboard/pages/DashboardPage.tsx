import { useUserStore } from "@/store/useUserStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, ArrowUpRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type Kpi = { label: string; value: string; unit?: string; delta: string; up: boolean };

const KPIS: Kpi[] = [
  { label: "Ventas de hoy", value: "3,480.00", unit: "S/", delta: "+12.4%", up: true },
  { label: "Productos activos", value: "342", delta: "+8", up: true },
  { label: "Con stock bajo", value: "12", delta: "-3", up: false },
  { label: "Comprobantes SUNAT", value: "27", delta: "+5", up: true },
];

const LOW_STOCK = [
  { sku: "POL-0432", name: "Polo Oversize Negro", stock: 4 },
  { sku: "JEA-1180", name: "Jean Mom Azul", stock: 6 },
  { sku: "CAM-0091", name: "Camisa Lino Beige", stock: 3 },
  { sku: "VES-0233", name: "Vestido Midi Verde", stock: 8 },
];

const RECENT = [
  { doc: "F001-000842", client: "Consumidor Final", total: "129.90", type: "Factura" },
  { doc: "B001-004517", client: "María Quispe", total: "49.90", type: "Boleta" },
  { doc: "B001-004516", client: "Consumidor Final", total: "215.00", type: "Boleta" },
  { doc: "F001-000841", client: "Textiles SAC", total: "1,240.00", type: "Factura" },
];

export default function DashboardPage() {
  const user = useUserStore((state) => state.user);

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      {/* Encabezado */}
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Resumen general
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user?.username ? `Bienvenido, ${user.username}. ` : ""}
          Sucursal <span className="num font-medium text-foreground">{user?.sucursal || "Matriz Central"}</span>
        </p>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {k.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1">
                {k.unit && <span className="num text-sm text-muted-foreground">{k.unit}</span>}
                <span className="num text-2xl font-semibold tracking-tight text-foreground">{k.value}</span>
              </div>
              <div
                className={cn(
                  "num mt-2 inline-flex items-center gap-1 text-xs font-medium",
                  k.up ? "text-success" : "text-destructive"
                )}
              >
                {k.up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {k.delta}
                <span className="text-muted-foreground">vs. ayer</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Stock bajo */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Productos con stock bajo
            </CardTitle>
            <a href="/products" className="text-xs font-medium text-brand hover:underline">Ver todos</a>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {LOW_STOCK.map((p) => (
              <div key={p.sku} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                  <p className="num text-xs text-muted-foreground">{p.sku}</p>
                </div>
                <Badge variant={p.stock <= 4 ? "destructive" : "secondary"} className="num">
                  {p.stock} u.
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Últimos comprobantes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Últimos comprobantes</CardTitle>
            <a href="/reports/sales" className="text-xs font-medium text-brand hover:underline">Historial</a>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {RECENT.map((r) => (
              <div key={r.doc} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <p className="num truncate text-sm font-medium text-foreground">{r.doc}</p>
                  <p className="truncate text-xs text-muted-foreground">{r.type} · {r.client}</p>
                </div>
                <span className="num text-sm font-semibold text-foreground">S/ {r.total}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Nota de estado (desarrollo) */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">
              Datos de ejemplo — se conectará a <span className="num text-brand">/api/reportes</span>.
            </p>
            <p className="num mt-1.5 text-[11px] text-muted-foreground">
              tenant {user?.id_tenant ?? "—"} · empresa {user?.id_empresa ?? "—"} · rol {user?.roleId ?? "—"}
            </p>
          </div>
          <a
            href="/products"
            className="inline-flex items-center gap-1 self-start rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ir al catálogo
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
