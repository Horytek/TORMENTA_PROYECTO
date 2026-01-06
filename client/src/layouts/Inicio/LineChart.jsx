import { useState, useMemo } from "react";
import { Card, CardHeader, CardBody, CardFooter, Divider, Chip, Tooltip, Input, Select, SelectItem, Popover, PopoverTrigger, PopoverContent, Button } from "@heroui/react";
import { Calendar, Sparkles } from "lucide-react";
import useComparacionTotal from "@/layouts/Inicio/hooks/comparacion_ventas";
import { useTendenciaVentas } from "@/services/reportes.services";
import { AreaChart } from "@tremor/react";

const valueFormatter = (number) =>
  "S/. " +
  new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(number) ? number : 0);

const COLORS = ["indigo"];
const MESES_CORTO = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const quickRanges = [
  { key: "today", label: "Hoy", getRange: () => { const t = new Date(); t.setHours(0, 0, 0, 0); return { start: t, end: t }; } },
  { key: "last7days", label: "Últ. 7 días", getRange: () => { const t = new Date(); const d = new Date(); t.setHours(0, 0, 0, 0); d.setHours(0, 0, 0, 0); d.setDate(t.getDate() - 6); return { start: d, end: t }; } },
  { key: "last30days", label: "Últ. 30 días", getRange: () => { const t = new Date(); const d = new Date(); t.setHours(0, 0, 0, 0); d.setHours(0, 0, 0, 0); d.setDate(t.getDate() - 29); return { start: d, end: t }; } },
  { key: "monthToDate", label: "Mes transcurrido", getRange: () => { const t = new Date(); t.setHours(0, 0, 0, 0); return { start: new Date(t.getFullYear(), t.getMonth(), 1), end: t }; } },
  { key: "yearToDate", label: "Año transcurrido", getRange: () => { const t = new Date(); t.setHours(0, 0, 0, 0); return { start: new Date(t.getFullYear(), 0, 1), end: t }; } },
  // NUEVO: años recientes 2024 -> hoy
  {
    key: "recentYears", label: "Años recientes (2024+)", getRange: () => {
      const start = new Date(2024, 0, 1); const end = new Date();
      start.setHours(0, 0, 0, 0); end.setHours(0, 0, 0, 0);
      return { start, end };
    }
  },
];

function daysDiff(a, b) {
  const A = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const B = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  const ms = Math.abs(B - A);
  return Math.ceil(ms / (1000 * 60 * 60 * 24)) + 1;
}
function sameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
function toISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtDay(iso) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")} ${MESES_CORTO[d.getMonth()]} ${d.getFullYear()}`;
}
function fmtMonth(m, y) {
  return `${MESES_CORTO[m]} ${y}`;
}

export function LineChartComponent({ sucursal }) {
  // Estado
  const [value, setValue] = useState(null);
  const [scaleFloor, setScaleFloor] = useState("auto");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [lastRangeKey, setLastRangeKey] = useState(null);

  const selectedRange = quickRanges.find(r => r.key === lastRangeKey);

  const fechaInicio = value?.start ? toISODate(value.start) : null;
  const fechaFin = value?.end ? toISODate(value.end) : null;

  // Datos
  const { comparacionVentas, loading: loadingYear, error: errorYear } = useComparacionTotal(fechaInicio, fechaFin, sucursal);

  const baseDate = value?.start || new Date();
  const yearParam = baseDate.getFullYear().toString();
  const monthParam = String(baseDate.getMonth() + 1).padStart(2, "0");
  const { data: tendenciaData, loading: loadingTrend, error: errorTrend } = useTendenciaVentas(sucursal, yearParam, monthParam, "all");

  // Construcción dinámica de serie
  const { chartData, xAxisLabel, usesTrend, resolution } = useMemo(() => {
    // Sin rango => 12 meses del año actual
    if (!value?.start || !value?.end) {
      const nowY = new Date().getFullYear();
      const data = Array.from({ length: 12 }, (_, m) => ({
        date: fmtMonth(m, nowY),
        __y: nowY,
        __m: m,
        "Ventas Totales": Number(comparacionVentas?.[m]?.total_ventas) || 0,
      }));
      return { chartData: data, xAxisLabel: "Meses", usesTrend: false, resolution: "Meses" };
    }

    const start = value.start;
    const end = value.end;
    const diff = daysDiff(start, end);

    // 1) Mismo mes y corto => Días (detalle día + nombre)
    if (sameMonth(start, end) && diff <= 31) {
      const days = [];
      let cur = new Date(start);
      while (cur <= end) {
        days.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
      }
      const mapByDate = new Map((tendenciaData || []).map(r => [r.fecha, Number(r.total_ventas) || 0]));
      const daily = days.map(d => {
        const iso = toISODate(d);
        const val = mapByDate.get(iso) ?? 0;
        return {
          date: String(d.getDate()).padStart(2, "0"),
          __full: iso,
          "Ventas Totales": val,
        };
      });
      return { chartData: daily, xAxisLabel: "Días", usesTrend: true, resolution: "Días" };
    }

    // 2) Rango dentro del mismo año (o “Año transcurrido”) => Meses
    const monthsSafe = Array.from({ length: 12 }, (_, i) => Number(comparacionVentas?.[i]?.total_ventas) || 0);
    const sameYear = start.getFullYear() === end.getFullYear();

    // Si es “yearToDate” o el rango inicia el 1 de enero y termina dentro del mismo año, forzar 12 meses
    const forceFullYear =
      lastRangeKey === "yearToDate" ||
      (sameYear && start.getMonth() === 0 && start.getDate() === 1);

    const months = [];
    if (forceFullYear) {
      const y = start.getFullYear();
      for (let m = 0; m < 12; m++) months.push({ y, m });
    } else {
      let y = start.getFullYear();
      let m = start.getMonth();
      while (y < end.getFullYear() || (y === end.getFullYear() && m <= end.getMonth())) {
        months.push({ y, m });
        m++;
        if (m > 11) { m = 0; y++; }
      }
    }

    const monthly = months.map(({ y, m }) => ({
      date: fmtMonth(m, y),
      __y: y,
      __m: m,
      "Ventas Totales": monthsSafe[m],
    }));
    return { chartData: monthly, xAxisLabel: "Meses", usesTrend: false, resolution: "Meses" };
  }, [value, comparacionVentas, tendenciaData, lastRangeKey]);

  // Métricas y escala
  const { maxVentas, total, promedio } = useMemo(() => {
    const nums = chartData.map((it) => Number(it["Ventas Totales"]) || 0);
    const max = nums.length ? Math.max(...nums) : 0;
    const baseRounded = Math.ceil((max || 10000) / 10000) * 10000;
    const floor = scaleFloor === "auto" ? 0 : Number(scaleFloor);
    const finalMax = Math.max(baseRounded, floor || 0);
    const total = nums.reduce((a, b) => a + b, 0);
    const promedio = nums.length ? total / nums.length : 0;
    return { maxVentas: finalMax, total, promedio };
  }, [chartData, scaleFloor]);

  const loading = usesTrend ? loadingTrend : loadingYear;
  const error = usesTrend ? errorTrend : errorYear;

  const handleQuickRange = (range) => {
    setLastRangeKey(range.key);
    setValue(range.getRange());
    setPopoverOpen(false);
  };

  // Tooltip: evita duplicados y muestra fecha/mes legible
  const renderTooltip = ({ payload, active }) => {
    if (!active || !payload || !payload.length) return null;

    // Unificar por dataKey para evitar duplicados visuales
    const unique = [];
    const seen = new Set();
    for (const p of payload) {
      if (!seen.has(p.dataKey)) {
        seen.add(p.dataKey);
        unique.push(p);
      }
    }

    // Etiqueta legible por tipo
    const row = payload[0]?.payload || {};
    const label =
      row.__full ? fmtDay(row.__full) :
        (Number.isInteger(row.__m) && row.__y ? fmtMonth(row.__m, row.__y) : payload[0]?.payload?.date || "");

    return (
      <div className="min-w-[220px] max-w-[340px] rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-xl backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/95 z-50">
        <div className="space-y-1">
          <div className="font-semibold text-xs text-slate-800 dark:text-white mb-1">{label}</div>
          {unique.map((entry, idx) => (
            <div key={`${entry.dataKey}-${idx}`} className="flex items-center gap-2 py-0.5">
              <span className="inline-block w-3 h-3 rounded-full border border-slate-200" style={{ backgroundColor: "#6366F1", minWidth: 12, minHeight: 12 }}></span>
              <span className="font-medium text-xs text-slate-600 dark:text-slate-300">{entry.dataKey}</span>
              <span className="ml-auto font-bold text-xs text-slate-900 dark:text-white">
                {valueFormatter(Number.isFinite(entry.value) ? entry.value : 0)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full border-none shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] dark:shadow-none bg-white dark:bg-zinc-900 dark:border dark:border-zinc-800 rounded-2xl overflow-hidden p-6 relative">
      <div className="flex justify-between items-start mb-6 z-10 relative">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide flex items-center gap-2">
            Tendencia de Ventas
          </h3>
          <p className="text-[10px] text-slate-400 font-medium mt-1">Evolución en el tiempo</p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            selectedKeys={[scaleFloor]}
            onChange={(e) => setScaleFloor(e.target.value)}
            className="w-24"
            size="sm"
            variant="flat"
            aria-label="Escala"
            classNames={{
              trigger: "bg-slate-50 dark:bg-zinc-800 shadow-none hover:bg-slate-100 transition-colors h-8 min-h-8 rounded-lg",
              value: "text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase"
            }}
          >
            <SelectItem key="auto" value="auto">AUTO</SelectItem>
            <SelectItem key="0" value="0">MIN 0</SelectItem>
            <SelectItem key="1000" value="1000">MIN 1K</SelectItem>
          </Select>

          <Popover placement="bottom-end" isOpen={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger>
              <Button size="sm" variant="flat" className="h-8 min-h-8 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-[10px] uppercase rounded-lg dark:bg-zinc-800 dark:text-slate-300">
                <Calendar size={12} className="mr-1.5" />
                {selectedRange?.label || "Rango"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-1 w-48">
              {quickRanges.map((r) => (
                <Button
                  key={r.key}
                  variant="light"
                  className="w-full justify-start text-[10px] font-bold uppercase h-8"
                  onPress={() => { setValue(r.getRange()); setLastRangeKey(r.key); setPopoverOpen(false); }}
                >
                  {r.label}
                </Button>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="h-72 w-full">
        <AreaChart
          data={chartData}
          index="date"
          categories={["Ventas Totales"]}
          colors={COLORS}
          valueFormatter={valueFormatter}
          yAxisWidth={50}
          showLegend={false}
          showGridLines={true}
          showAnimation={true}
          showGradient={true}
          customTooltip={renderTooltip}
          curveType="monotone"
          minValue={scaleFloor === "auto" ? undefined : Number(scaleFloor)}
          autoMinValue={scaleFloor === "auto"}
          connectNulls={true}
          className="h-full -ml-2 font-inter text-xs"
        />
      </div>
    </Card>
  );
}