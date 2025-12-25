import { useState, useMemo } from "react";
import { Card, CardHeader, CardBody, CardFooter, Divider, Chip, Tooltip, Input, Select, SelectItem, Popover, PopoverTrigger, PopoverContent, Button } from "@heroui/react";
import { Calendar, Sparkles } from "lucide-react";
import useComparacionTotal from "@/layouts/Inicio/hooks/comparacion_ventas";
import useTendenciaVentas from "@/services/reports/data_tendencia_ventas";
import { LineChart } from "@tremor/react";

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
      <Card shadow="md" radius="md" className="min-w-[220px] max-w-[340px] border border-default-200 bg-white/95 dark:bg-zinc-900/95 px-3 py-2 shadow-xl">
        <CardBody className="space-y-1 p-0">
          <div className="font-semibold text-xs text-default-900 dark:text-white mb-1">{label}</div>
          {unique.map((entry, idx) => (
            <div key={`${entry.dataKey}-${idx}`} className="flex items-center gap-2 py-0.5">
              <span className="inline-block w-3 h-3 rounded-full border border-default-200" style={{ backgroundColor: "#6366F1", minWidth: 12, minHeight: 12 }}></span>
              <span className="font-medium text-xs text-default-800 dark:text-white">{entry.dataKey}</span>
              <span className="ml-auto font-bold text-xs text-default-900 dark:text-white">
                {valueFormatter(Number.isFinite(entry.value) ? entry.value : 0)}
              </span>
            </div>
          ))}
        </CardBody>
      </Card>
    );
  };

  return (
    <Card className="relative overflow-hidden rounded-2xl shadow-sm
                     bg-white dark:bg-zinc-900
                     border border-slate-200 dark:border-zinc-800 transition-all">
      <style>{`
        .dark .recharts-cartesian-axis-tick text,
        .dark .recharts-legend-item text,
        .dark .recharts-text tspan { fill: #e2e8f0 !important; }
        .dark .recharts-cartesian-grid line { stroke: #2c3240 !important; }
        .dark .recharts-tooltip-wrapper { filter: drop-shadow(0 4px 14px rgba(0,0,0,.45)); }
      `}</style>

      <CardHeader className="flex flex-col gap-4 p-5 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-colors">
        {/* Top Row: Title + Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 w-full">
          {/* Title Section */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">Tendencia de Ventas</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Evolución en el tiempo</p>
            </div>
          </div>

          {/* Controls Section */}
          <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
            <Select
              aria-label="Escala mínima"
              className="w-32"
              size="sm"
              selectedKeys={new Set([scaleFloor])}
              onSelectionChange={(keys) => setScaleFloor(keys.values().next().value)}
              classNames={{
                trigger: "bg-slate-50 dark:bg-zinc-800 border-transparent hover:border-slate-200 dark:hover:border-zinc-700 shadow-none transition-all",
                value: "text-xs font-medium"
              }}
            >
              <SelectItem key="auto" value="auto">Auto</SelectItem>
              <SelectItem key="10000" value="10000">Min 10k</SelectItem>
              <SelectItem key="50000" value="50000">Min 50k</SelectItem>
            </Select>

            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger>
                <Button
                  size="sm"
                  variant="flat"
                  className="bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 font-medium min-w-32"
                  startContent={<Calendar className="w-3.5 h-3.5 text-slate-400" />}
                  onClick={() => setPopoverOpen(true)}
                >
                  {value?.start && value?.end
                    ? `${value.start.toLocaleDateString("es-PE")} - ${value.end.toLocaleDateString("es-PE")}`
                    : "Filtrar Fechas"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 rounded-xl shadow-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 w-auto min-w-[200px]">
                <div className="p-3 border-b border-default-100">
                  <span className="text-xs font-semibold text-default-500">Periodos Rápidos</span>
                </div>
                <div className="p-2 grid grid-cols-1 gap-1">
                  {quickRanges.map((range) => (
                    <Button
                      key={range.key}
                      size="sm"
                      variant="light"
                      className="justify-start h-8 text-xs"
                      onClick={() => handleQuickRange(range)}
                    >
                      {range.label}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Bottom Row: Stats Chips */}
        <div className="flex flex-wrap gap-2 mt-1 z-10 w-full pt-2">
          <Chip size="sm" variant="flat" className="bg-blue-50 text-blue-700 font-semibold border-0">
            Total: {valueFormatter(total)}
          </Chip>
          <Chip size="sm" variant="flat" className="bg-indigo-50 text-indigo-700 font-semibold border-0">
            Promedio: {valueFormatter(promedio)}
          </Chip>
        </div>
      </CardHeader>

      <CardBody className="relative bg-white dark:bg-zinc-900 transition-colors px-6 pb-6">
        {loading ? (
          <div className="relative z-10 text-center py-8 text-slate-400">Cargando...</div>
        ) : (
          <div className="relative z-10 px-2">
            <LineChart
              className="mt-4 h-[300px]"
              data={chartData}
              index="date"
              yAxisWidth={60}
              categories={["Ventas Totales"]}
              colors={COLORS}
              valueFormatter={valueFormatter}
              xAxisLabel={xAxisLabel}
              yAxisLabel=""
              showAnimation
              showLegend={false}
              showGridLines={false}
              curveType="monotone"
              connectNulls
              minValue={0}
              maxValue={maxVentas}
              customTooltip={renderTooltip}
            />
          </div>
        )}
      </CardBody>

      <Divider className="dark:border-blue-800/40" />

      <CardFooter className="bg-white/90 dark:bg-[#131722]/90 backdrop-blur-sm">
        <span className="text-xs text-default-500 dark:text-zinc-400">
          Datos actualizados según el rango seleccionado.
        </span>
      </CardFooter>
    </Card>
  );
}