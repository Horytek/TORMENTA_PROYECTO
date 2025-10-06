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
const MESES_CORTO = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const quickRanges = [
  { key: "today", label: "Hoy", getRange: () => { const t = new Date(); t.setHours(0,0,0,0); return { start: t, end: t }; } },
  { key: "last7days", label: "Últ. 7 días", getRange: () => { const t = new Date(); const d = new Date(); t.setHours(0,0,0,0); d.setHours(0,0,0,0); d.setDate(t.getDate()-6); return { start: d, end: t }; } },
  { key: "last30days", label: "Últ. 30 días", getRange: () => { const t = new Date(); const d = new Date(); t.setHours(0,0,0,0); d.setHours(0,0,0,0); d.setDate(t.getDate()-29); return { start: d, end: t }; } },
  { key: "monthToDate", label: "Mes transcurrido", getRange: () => { const t = new Date(); t.setHours(0,0,0,0); return { start: new Date(t.getFullYear(), t.getMonth(), 1), end: t }; } },
  { key: "yearToDate", label: "Año transcurrido", getRange: () => { const t = new Date(); t.setHours(0,0,0,0); return { start: new Date(t.getFullYear(), 0, 1), end: t }; } },
  // NUEVO: años recientes 2024 -> hoy
  { key: "recentYears", label: "Años recientes (2024+)", getRange: () => {
      const start = new Date(2024, 0, 1); const end = new Date();
      start.setHours(0,0,0,0); end.setHours(0,0,0,0);
      return { start, end };
    } },
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
    <Card className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-blue-100/40 dark:border-zinc-700/60 transition-all">
      {/* Modo oscuro para ejes y grilla */}
      <style>{`
        .dark .recharts-cartesian-axis-tick text,
        .dark .recharts-legend-item text,
        .dark .recharts-text tspan { fill: #e5e7eb !important; }
        .dark .recharts-cartesian-grid line { stroke: #3f3f46 !important; }
      `}</style>

      <CardHeader className="flex flex-col gap-2 items-start bg-gradient-to-r from-blue-50/80 via-white/90 to-cyan-50/80 dark:from-blue-900/40 dark:to-cyan-900/20 rounded-t-2xl border-b border-blue-100/40 dark:border-zinc-700/60 relative overflow-hidden transition-colors">
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute -top-8 -left-8 w-32 h-32 bg-gradient-to-br from-blue-200/40 to-cyan-200/30 dark:from-blue-900/30 dark:to-cyan-900/20 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-gradient-to-tr from-cyan-400/20 to-blue-500/10 dark:from-cyan-900/20 dark:to-blue-900/10 rounded-full blur-xl"></div>
        </div>

        <div className="flex items-center gap-3 z-10">
          <span className="inline-flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-400/80 to-cyan-400/80 dark:from-blue-700/80 dark:to-cyan-700/80 shadow w-10 h-10">
            <Sparkles className="w-6 h-6 text-white" />
          </span>
          <div>
            <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 tracking-tight">Tendencia de Ventas</h3>
            <p className="text-xs text-blue-700/80 dark:text-blue-200/80 font-medium">Evolución según el rango seleccionado</p>
          </div>
        </div>

        {/* Métricas y contexto */}
        <div className="flex flex-wrap gap-2 mt-3 z-10">
          <Chip color="primary" variant="flat" className="font-semibold text-sm px-3 py-1">Total: {valueFormatter(total)}</Chip>
          <Chip color="default" variant="flat" className="font-semibold text-sm px-3 py-1">Escala máx: {valueFormatter(maxVentas)}</Chip>
          <Chip color="violet" variant="flat" className="font-semibold text-sm px-3 py-1">Promedio: {valueFormatter(promedio)}</Chip>
          <Chip color="default" variant="flat" className="font-semibold text-sm px-3 py-1">Resolución: {resolution}</Chip>
          <Chip color="default" variant="flat" className="font-semibold text-sm px-3 py-1">Puntos: {chartData.length}</Chip>
          {value?.start && value?.end && (
            <Tooltip content="Rango seleccionado">
              <Chip color="primary" variant="flat" className="font-semibold text-sm px-3 py-1">
                {value.start.toLocaleDateString("es-PE")} – {value.end.toLocaleDateString("es-PE")}
              </Chip>
            </Tooltip>
          )}
        </div>

        {/* Controles: Escala + Rango */}
        <div className="flex flex-wrap gap-2 mt-2 z-10 items-center">
          <Select
            aria-label="Escala mínima Y"
            className="w-[160px]"
            selectedKeys={new Set([scaleFloor])}
            onSelectionChange={(keys) => setScaleFloor(keys.values().next().value)}
            variant="flat"
          >
            <SelectItem key="auto" value="auto">Escala: Auto</SelectItem>
            <SelectItem key="10000" value="10000">Mín. 10,000</SelectItem>
            <SelectItem key="50000" value="50000">Mín. 50,000</SelectItem>
            <SelectItem key="100000" value="100000">Mín. 100,000</SelectItem>
          </Select>

          <div className="grid grid-cols-1 gap-2 w-full md:w-auto md:ml-auto md:justify-end mt-1">
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger>
                <Button
                  variant="flat"
                  color="default"
                  className="max-w-xs w-full rounded-lg border border-blue-100/60 dark:border-zinc-700/60 bg-white/90 dark:bg-zinc-900/80 shadow-sm focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-900 transition-all"
                  startContent={<Calendar className="w-4 h-4 text-blue-500 dark:text-blue-300" />}
                  onClick={() => setPopoverOpen(true)}
                >
                  {value?.start && value?.end
                    ? `${value.start.toLocaleDateString("es-PE")} - ${value.end.toLocaleDateString("es-PE")}`
                    : "Selecciona un rango de fechas"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-4 rounded-xl shadow-lg border border-blue-100/60 dark:border-zinc-700/60 bg-white/95 dark:bg-zinc-900/90 w-80">
                <div className="mb-2 font-semibold text-sm text-zinc-700 dark:text-zinc-100 text-center">Rangos rápidos</div>
                <div className="grid grid-cols-1 gap-2">
                  {quickRanges.map((range) => (
                    <Button
                      key={range.key}
                      variant="light"
                      color="primary"
                      className="justify-start"
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
      </CardHeader>

      <Divider />
      <CardBody className="bg-white dark:bg-zinc-900 transition-colors">
        {loading ? (
          <div className="text-center py-8 text-default-500 dark:text-default-400">Cargando...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">{error?.message || "Error al cargar"}</div>
        ) : (
          <>
            <LineChart
              className="mt-2 h-[340px] dark:bg-zinc-900"
              data={chartData}
              index="date"
              yAxisWidth={80}
              categories={["Ventas Totales"]}
              colors={COLORS}
              valueFormatter={valueFormatter}
              xAxisLabel={xAxisLabel}
              yAxisLabel="Ventas (S/.)"
              showAnimation={true}
              showLegend={false}
              showGridX={true}
              showGridY={true}
              curveType="monotone"
              connectNulls={true}
              showDots={true}
              minValue={0}
              maxValue={maxVentas}
              customTooltip={renderTooltip}
            />
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                <Chip color="indigo" variant="flat">Ventas Totales</Chip>
              </div>
            </div>
          </>
        )}
      </CardBody>
      <Divider />
      <CardFooter className="bg-white dark:bg-zinc-900 transition-colors">
        <span className="text-xs text-default-400 dark:text-default-500">
          Datos actualizados según el rango seleccionado.
        </span>
      </CardFooter>
    </Card>
  );
}