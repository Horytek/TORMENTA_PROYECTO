import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Calendar } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getComparacionVentas, getTendenciaVentas } from "../api/dashboard";

interface DashboardLineChartProps {
  sucursal: string;
  usuario: string;
}

const QUICK_RANGES = [
  { key: "today", label: "Hoy" },
  { key: "last7days", label: "Últimos 7 días" },
  { key: "last30days", label: "Últimos 30 días" },
  { key: "monthToDate", label: "Mes actual" },
  { key: "yearToDate", label: "Año actual" },
];

const MONTHS_SPANISH = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function toISODate(d: Date) {
  return d.toISOString().split("T")[0];
}

export function DashboardLineChart({ sucursal, usuario }: DashboardLineChartProps) {
  const [rangeKey, setRangeKey] = useState("yearToDate");

  // Calculate dates based on range selection
  const { start, end } = useMemo(() => {
    const todayObj = new Date();
    todayObj.setHours(0, 0, 0, 0);

    switch (rangeKey) {
      case "today":
        return { start: todayObj, end: todayObj };
      case "last7days": {
        const startObj = new Date(todayObj);
        startObj.setDate(todayObj.getDate() - 6);
        return { start: startObj, end: todayObj };
      }
      case "last30days": {
        const startObj = new Date(todayObj);
        startObj.setDate(todayObj.getDate() - 29);
        return { start: startObj, end: todayObj };
      }
      case "monthToDate": {
        const startObj = new Date(todayObj.getFullYear(), todayObj.getMonth(), 1);
        return { start: startObj, end: todayObj };
      }
      case "yearToDate":
      default: {
        const startObj = new Date(todayObj.getFullYear(), 0, 1);
        return { start: startObj, end: todayObj };
      }
    }
  }, [rangeKey]);

  const fechaInicio = toISODate(start);
  const fechaFin = toISODate(end);

  // Queries
  const { data: comparacion = [], isLoading: isLoadingComp } = useQuery({
    queryKey: ["dashboard-comparacion", fechaInicio, fechaFin, sucursal, usuario],
    queryFn: () => getComparacionVentas({ fechaInicio, fechaFin, usuario, sucursal }),
  });

  const yearParam = start.getFullYear().toString();
  const monthParam = String(start.getMonth() + 1).padStart(2, "0");
  const isSameMonthAndShort = start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth() && rangeKey !== "yearToDate";

  const { data: tendencia = [], isLoading: isLoadingTrend } = useQuery({
    queryKey: ["dashboard-tendencia", sucursal, yearParam, monthParam],
    queryFn: () => getTendenciaVentas({ id_sucursal: sucursal, year: yearParam, month: monthParam }),
    enabled: isSameMonthAndShort,
  });

  const chartData = useMemo(() => {
    if (isSameMonthAndShort) {
      // Dynamic rendering by Days
      const daysList: Array<{ date: string; "Ventas Totales": number }> = [];
      const tempDate = new Date(start);

      // Create maps by date for O(1) checks
      const map = new Map<string, number>();
      tendencia.forEach((t) => {
        // Handle timezone formats appropriately
        const cleanDate = t.fecha ? t.fecha.split("T")[0] : "";
        map.set(cleanDate, Number(t.total_ventas) || 0);
      });

      while (tempDate <= end) {
        const iso = toISODate(tempDate);
        daysList.push({
          date: String(tempDate.getDate()).padStart(2, "0"),
          "Ventas Totales": map.get(iso) ?? 0,
        });
        tempDate.setDate(tempDate.getDate() + 1);
      }
      return daysList;
    }

    // Default rendering by Months (12 months display for current year)
    const monthsData = Array.from({ length: 12 }, (_, m) => {
      const monthObj = comparacion?.[m];
      const salesVal = monthObj ? Number(monthObj.total_ventas) : 0;
      return {
        date: MONTHS_SPANISH[m],
        "Ventas Totales": salesVal || 0,
      };
    });
    return monthsData;
  }, [isSameMonthAndShort, start, end, comparacion, tendencia]);

  const stats = useMemo(() => {
    const values = chartData.map((d) => d["Ventas Totales"]);
    const total = values.reduce((sum, v) => sum + v, 0);
    const max = values.length ? Math.max(...values) : 0;
    const avg = values.length ? total / values.length : 0;

    return { total, max, avg };
  }, [chartData]);

  const valueFormatter = (num: number) => {
    return "S/ " + num.toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const isLoading = isLoadingComp || (isSameMonthAndShort && isLoadingTrend);

  return (
    <Card className="border border-border shadow-sm rounded-xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <CardTitle className="text-sm font-bold uppercase tracking-wide text-foreground">
            Tendencia de Ventas
          </CardTitle>
          <p className="text-[10px] text-muted-foreground font-medium">Volumen de facturación</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={rangeKey} onValueChange={setRangeKey}>
            <SelectTrigger className="h-8 text-xs font-semibold bg-muted/40 hover:bg-muted/70 transition-colors rounded-lg border-border">
              <Calendar className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUICK_RANGES.map((r) => (
                <SelectItem key={r.key} value={r.key} className="text-xs">
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="px-5 py-4 space-y-4">
        {isLoading ? (
          <div className="h-[240px] flex items-center justify-center animate-pulse bg-muted/10 rounded-lg">
            <div className="space-y-3 flex flex-col items-center">
              <div className="h-4 w-4 bg-muted rounded-full"></div>
              <div className="h-3 bg-muted rounded w-24"></div>
            </div>
          </div>
        ) : (
          <>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    className="text-[10px] fill-muted-foreground font-medium"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    className="text-[10px] fill-muted-foreground font-medium"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={valueFormatter}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "0.5rem",
                      fontSize: "11px",
                      color: "var(--foreground)",
                    }}
                    formatter={(value: any) => [`S/ ${Number(value).toFixed(2)}`, "Ventas"]}
                    labelFormatter={(label) => `${isSameMonthAndShort ? "Día" : "Mes"}: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="Ventas Totales"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#salesColor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Acumulado</p>
                <p className="num text-sm font-bold text-foreground mt-0.5">
                  S/ {stats.total.toLocaleString("es-PE", { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="text-center border-x border-border">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Pico Máximo</p>
                <p className="num text-sm font-bold text-foreground mt-0.5">
                  S/ {stats.max.toLocaleString("es-PE", { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Promedio</p>
                <p className="num text-sm font-bold text-foreground mt-0.5">
                  S/ {stats.avg.toLocaleString("es-PE", { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
