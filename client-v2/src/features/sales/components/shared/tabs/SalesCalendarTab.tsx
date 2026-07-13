import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Package, TrendingUp, DollarSign, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { getVentas, getVentaById } from "@/features/sales/api/ventas";
import type { Venta, VentasFilters } from "@/features/sales/types";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────
// SalesCalendarTab — Vista de productos vendidos por día
// ─────────────────────────────────────────────────────────────────

interface DailyProductRow {
  sku: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  precio_total: number;
  metodo_pago: string;
  num_comprobante: string;
  id_venta: number;
}

export function SalesCalendarTab() {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);

  // Traer todas las ventas del día seleccionado
  const filters: VentasFilters = useMemo(() => ({
    fecha_inicio: selectedDate,
    fecha_fin: selectedDate,
  }), [selectedDate]);

  const { data: ventasDia = [], isLoading: loadingVentas } = useQuery<Venta[]>({
    queryKey: ["ventas-calendario", selectedDate],
    queryFn: () => getVentas(filters),
  });

  // Traer detalles de cada venta del día
  const detalleQueries = useQuery({
    queryKey: ["detalles-calendario", selectedDate, ventasDia.map((v) => v.id_venta).join(",")],
    queryFn: async () => {
      if (ventasDia.length === 0) return [];
      const results = await Promise.all(
        ventasDia.map((v) => getVentaById(v.id_venta!).catch(() => null))
      );
      return results.filter((r): r is NonNullable<typeof r> => r !== null);
    },
    enabled: ventasDia.length > 0,
  });

  // Agregar productos de todas las ventas del día
  const productosDia = useMemo<DailyProductRow[]>(() => {
    if (!detalleQueries.data) return [];
    const rows: DailyProductRow[] = [];
    for (const venta of detalleQueries.data) {
      for (const det of venta.detalles ?? []) {
        rows.push({
          sku: det.sku ?? "",
          nombre: det.nombre_producto ?? det.nombre ?? `Producto #${det.id_producto}`,
          cantidad: Number(det.cantidad ?? 0),
          precio_unitario: Number(det.precio_unitario ?? 0),
          precio_total: Number(det.precio_total ?? 0),
          metodo_pago: venta.metodo_pago ?? "—",
          num_comprobante: venta.num_comprobante ?? "",
          id_venta: venta.id_venta ?? 0,
        });
      }
    }
    return rows;
  }, [detalleQueries.data]);

  // Totales del día
  const totalesDia = useMemo(() => {
    const totalUnidades = productosDia.reduce((s, p) => s + p.cantidad, 0);
    const totalVentas = productosDia.reduce((s, p) => s + p.precio_total, 0);
    const totalBoletas = ventasDia.filter((v) => v.id_comprobante === "Boleta").length;
    const totalFacturas = ventasDia.filter((v) => v.id_comprobante === "Factura").length;
    const totalNotas = ventasDia.filter((v) => v.id_comprobante === "Nota").length;
    return { totalUnidades, totalVentas, totalBoletas, totalFacturas, totalNotas };
  }, [productosDia, ventasDia]);

  // Días del mes para el mini-calendario
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const daysInMonth = new Date(viewMonth.year, viewMonth.month + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewMonth.year, viewMonth.month, 1).getDay(); // 0=Dom

  const prevMonth = () => {
    setViewMonth((m) => {
      const d = new Date(m.year, m.month - 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };
  const nextMonth = () => {
    setViewMonth((m) => {
      const d = new Date(m.year, m.month + 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const DAY_NAMES = ["Do","Lu","Ma","Mi","Ju","Vi","Sá"];

  return (
    <div className="flex h-full gap-4 p-4 min-h-0 overflow-hidden">
      {/* ── Mini-calendario ── */}
      <Card className="w-64 shrink-0 rounded-xl border border-border bg-card overflow-hidden flex flex-col shadow-xs">
        {/* Navegación mes */}
        <div className="flex items-center justify-between p-3.5 border-b border-border bg-muted/10 shrink-0">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-muted/80" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-bold text-foreground">{MONTH_NAMES[viewMonth.month]} {viewMonth.year}</span>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-muted/80" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/5">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-[10px] font-bold text-muted-foreground/60 py-1.5">{d}</div>
          ))}
        </div>

        {/* Días del mes */}
        <div className="grid grid-cols-7 gap-1 p-2 flex-1 items-center justify-items-center">
          {/* Espacios vacíos antes del primer día */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-7 w-7" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === today;
            return (
              <button
                key={day}
                onClick={() => setSelectedDate(dateStr)}
                className={cn(
                  "h-7 w-7 rounded-lg flex items-center justify-center text-xs font-semibold transition-all cursor-pointer",
                  isSelected
                    ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20 scale-105"
                    : isToday
                    ? "border border-primary text-primary hover:bg-primary/5 dark:hover:bg-primary/10"
                    : "hover:bg-muted text-foreground/80 hover:text-foreground"
                )}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Info del día seleccionado */}
        <div className="p-3.5 bg-muted/20 border-t border-border shrink-0 space-y-1.5">
          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/50">Día seleccionado</p>
          <p className="text-xs font-bold text-foreground">{selectedDate}</p>
          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none px-2 py-0.5 text-[10px] font-semibold">
              {ventasDia.length} ventas
            </Badge>
            <Badge variant="outline" className="border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {totalesDia.totalUnidades} und.
            </Badge>
          </div>
        </div>
      </Card>

      {/* ── Detalle del día ── */}
      <Card className="flex-1 flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        {/* Stats rápidas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-muted/10 border-b border-border shrink-0">
          <QuickStat icon={<DollarSign className="h-4 w-4" />} label="Total del día" value={`S/ ${totalesDia.totalVentas.toFixed(2)}`} />
          <QuickStat icon={<Package className="h-4 w-4" />} label="Unidades" value={totalesDia.totalUnidades.toString()} />
          <QuickStat icon={<TrendingUp className="h-4 w-4" />} label="Promedio / Venta" value={ventasDia.length > 0 ? `S/ ${(totalesDia.totalVentas / ventasDia.length).toFixed(2)}` : "S/ 0.00"} />
          <QuickStat icon={<CalendarDays className="h-4 w-4" />} label="Comprobantes" value={`${totalesDia.totalBoletas}B · ${totalesDia.totalFacturas}F · ${totalesDia.totalNotas}N`} />
        </div>

        {/* Tabla de productos */}
        <div className="flex-1 overflow-auto">
          {loadingVentas || detalleQueries.isLoading ? (
            <div className="flex items-center justify-center h-full py-16"><Spinner size="md" /></div>
          ) : productosDia.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 gap-2 text-muted-foreground">
              <CalendarDays className="h-8 w-8 text-muted-foreground/30 animate-pulse" strokeWidth={1.5} />
              <p className="text-sm font-medium">No hay ventas en este día</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="text-[10px] uppercase text-muted-foreground/70 bg-muted/5">
                  <TableHead className="pl-4">Comprobante</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">P. Unitario</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="pr-4">Método</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productosDia.map((p, idx) => (
                  <TableRow key={idx} className="group hover:bg-muted/20 transition-colors">
                    <TableCell className="font-mono text-xs pl-4">{p.num_comprobante}</TableCell>
                    <TableCell className="text-xs max-w-[220px] truncate font-medium text-foreground">{p.nombre}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{p.sku || "—"}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums font-semibold">{p.cantidad}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums text-muted-foreground">S/ {p.precio_unitario.toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums font-bold text-primary">S/ {p.precio_total.toFixed(2)}</TableCell>
                    <TableCell className="pr-4">
                      <Badge variant="secondary" className="text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-none">
                        {p.metodo_pago}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Fila de totales */}
                <TableRow className="border-t-2 border-border font-bold bg-muted/40">
                  <TableCell colSpan={3} className="text-xs pl-4 uppercase tracking-wider text-muted-foreground/75">Total General del Día</TableCell>
                  <TableCell className="text-right tabular-nums text-sm font-bold text-foreground">{totalesDia.totalUnidades}</TableCell>
                  <TableCell />
                  <TableCell className="text-right tabular-nums text-sm font-extrabold text-primary">S/ {totalesDia.totalVentas.toFixed(2)}</TableCell>
                  <TableCell className="pr-4" />
                </TableRow>
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
}

function QuickStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-xs hover:border-primary/30 hover:shadow-xs transition-all duration-300">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/50 leading-none">{label}</p>
        <p className="text-xs font-bold text-foreground mt-1.5 tabular-nums truncate">{value}</p>
      </div>
    </div>
  );
}
