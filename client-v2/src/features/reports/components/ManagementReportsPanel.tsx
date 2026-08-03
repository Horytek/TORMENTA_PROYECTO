import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Trophy, Percent, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  getSucursalesReporte,
  getTendenciaVentas,
  getCantidadVentasPorProducto,
  getTopProductosMargen,
  getAnalisisGananciasSucursales,
} from "../api/reportes";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const soles = (v: unknown) => `S/ ${Number(v ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Reportes gerenciales — wiring de endpoints de reporte.controller.js que ya
 * existían en el backend sin ningún consumidor en client-v2 (tendencia, top
 * productos por cantidad/margen, ganancias por sucursal).
 */
export function ManagementReportsPanel() {
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [idSucursal, setIdSucursal] = useState<string>("all");

  const { data: sucursales = [] } = useQuery({
    queryKey: ["reportes-sucursales"],
    queryFn: getSucursalesReporte,
  });

  const filtros = { year, month, id_sucursal: idSucursal === "all" ? undefined : idSucursal };

  const { data: tendencia = [], isLoading: loadingTendencia } = useQuery({
    queryKey: ["reportes-tendencia", filtros],
    queryFn: () => getTendenciaVentas(filtros),
  });

  const { data: topCantidad = [], isLoading: loadingCantidad } = useQuery({
    queryKey: ["reportes-top-cantidad", filtros],
    queryFn: () => getCantidadVentasPorProducto({ ...filtros, limit: 8 }),
  });

  const { data: topMargen = [], isLoading: loadingMargen } = useQuery({
    queryKey: ["reportes-top-margen", filtros],
    queryFn: () => getTopProductosMargen({ ...filtros, limit: 8 }),
  });

  const { data: gananciasSucursal = [], isLoading: loadingSucursales } = useQuery({
    queryKey: ["reportes-ganancias-sucursal"],
    queryFn: getAnalisisGananciasSucursales,
  });

  const chartData = useMemo(
    () => tendencia.map((t) => ({ fecha: t.fecha?.split("T")[0]?.slice(-2) ?? "", total: Number(t.total_ventas) || 0 })),
    [tendencia]
  );

  // Última entrada por sucursal (mes más reciente) para una tabla comparativa simple
  const rendimientoPorSucursal = useMemo(() => {
    const porSucursal = new Map<string, typeof gananciasSucursal[number]>();
    for (const fila of gananciasSucursal) {
      const actual = porSucursal.get(fila.sucursal);
      if (!actual || fila.anio > actual.anio || (fila.anio === actual.anio && fila.mes_num > actual.mes_num)) {
        porSucursal.set(fila.sucursal, fila);
      }
    }
    return [...porSucursal.values()].sort((a, b) => Number(b.ganancias) - Number(a.ganancias));
  }, [gananciasSucursal]);

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[0, 1, 2].map((i) => {
              const y = now.getFullYear() - i;
              return <SelectItem key={y} value={String(y)} className="text-xs">{y}</SelectItem>;
            })}
          </SelectContent>
        </Select>
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MESES.map((m, i) => (
              <SelectItem key={m} value={String(i + 1)} className="text-xs">{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={idSucursal} onValueChange={setIdSucursal}>
          <SelectTrigger className="h-8 w-48 text-xs">
            <Building2 className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">Todas las sucursales</SelectItem>
            {sucursales.map((s) => (
              <SelectItem key={s.id_sucursal} value={String(s.id_sucursal)} className="text-xs">{s.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tendencia */}
      <Card className="border border-border shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="flex flex-row items-center gap-2 px-5 py-4 border-b border-border">
          <TrendingUp className="h-4 w-4 text-brand" />
          <CardTitle className="text-sm font-bold text-foreground">Tendencia del mes</CardTitle>
        </CardHeader>
        <CardContent className="px-5 py-4">
          {loadingTendencia ? (
            <div className="h-[200px] animate-pulse rounded-lg bg-muted/30" />
          ) : (
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="repColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis dataKey="fecha" className="text-[10px] fill-muted-foreground" tickLine={false} axisLine={false} />
                  <YAxis className="text-[10px] fill-muted-foreground" tickLine={false} axisLine={false} tickFormatter={(v) => soles(v)} />
                  <Tooltip formatter={(v: any) => [soles(v), "Ventas"]} labelFormatter={(l) => `Día ${l}`} />
                  <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} fill="url(#repColor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top productos por cantidad */}
        <Card className="border border-border shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-2 px-5 py-4 border-b border-border">
            <Trophy className="h-4 w-4 text-brand" />
            <CardTitle className="text-sm font-bold text-foreground">Top productos vendidos</CardTitle>
          </CardHeader>
          <CardContent className="px-0 py-0">
            <TablaSimple
              loading={loadingCantidad}
              filas={topCantidad}
              columnas={[
                { label: "Producto", render: (r) => r.descripcion },
                { label: "Unidades", render: (r) => Number(r.cantidad_vendida).toLocaleString("es-PE"), align: "right" },
                { label: "Ingresos", render: (r) => soles(r.dinero_generado), align: "right" },
              ]}
            />
          </CardContent>
        </Card>

        {/* Top productos por margen */}
        <Card className="border border-border shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-2 px-5 py-4 border-b border-border">
            <Percent className="h-4 w-4 text-brand" />
            <CardTitle className="text-sm font-bold text-foreground">Top productos por margen</CardTitle>
          </CardHeader>
          <CardContent className="px-0 py-0">
            <TablaSimple
              loading={loadingMargen}
              filas={topMargen}
              columnas={[
                { label: "Producto", render: (r) => r.nombre },
                { label: "Margen", render: (r) => `${Number(r.margen).toFixed(1)}%`, align: "right" },
                { label: "Ventas", render: (r) => r.ventas, align: "right" },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      {/* Rendimiento por sucursal */}
      <Card className="border border-border shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="flex flex-row items-center gap-2 px-5 py-4 border-b border-border">
          <Building2 className="h-4 w-4 text-brand" />
          <CardTitle className="text-sm font-bold text-foreground">Rendimiento por sucursal (mes más reciente c/u)</CardTitle>
        </CardHeader>
        <CardContent className="px-0 py-0">
          <TablaSimple
            loading={loadingSucursales}
            filas={rendimientoPorSucursal}
            columnas={[
              { label: "Sucursal", render: (r) => r.sucursal },
              { label: "Mes", render: (r) => r.mes },
              { label: "Ganancias", render: (r) => soles(r.ganancias), align: "right" },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tabla mínima reusada por las 3 listas de arriba ──────────────────────
interface Columna<T> {
  label: string;
  render: (row: T) => string;
  align?: "left" | "right";
}

function TablaSimple<T>({ filas, columnas, loading }: { filas: T[]; columnas: Columna<T>[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 animate-pulse rounded bg-muted" />
        ))}
      </div>
    );
  }
  if (filas.length === 0) {
    return <p className="p-6 text-center text-xs text-muted-foreground">Sin datos para este periodo.</p>;
  }
  return (
    <table className="w-full text-left text-xs">
      <thead className="bg-muted/30 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <tr>
          {columnas.map((c) => (
            <th key={c.label} className={`px-4 py-2 ${c.align === "right" ? "text-right" : ""}`}>{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {filas.map((fila, i) => (
          <tr key={i} className="hover:bg-muted/30">
            {columnas.map((c) => (
              <td key={c.label} className={`px-4 py-2.5 ${c.align === "right" ? "text-right tabular-nums" : ""}`}>
                {c.render(fila)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
