import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardBody, CardFooter, Divider, Chip, Tooltip, Input, Select, SelectItem, Popover, PopoverTrigger, PopoverContent, Button } from "@heroui/react";
import { TrendingUp, Calendar } from "lucide-react";
import useComparacionTotal from "@/layouts/Inicio/hooks/comparacion_ventas";
import { es } from "date-fns/locale";
import { LineChart } from "@tremor/react";

const valueFormatter = (number) =>
  "S/. " + new Intl.NumberFormat("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(number);

const COLORS = ["indigo"];
const MESES_CORTO = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

// Opciones de rango rápido
const quickRanges = [
  {
    key: "today",
    label: "Hoy",
    getRange: () => {
      const today = new Date();
      return { start: today, end: today };
    }
  },
  {
    key: "last7days",
    label: "Últ. 7 días",
    getRange: () => {
      const today = new Date();
      const last7 = new Date();
      last7.setDate(today.getDate() - 7);
      return { start: last7, end: today };
    }
  },
  {
    key: "last30days",
    label: "Últ. 30 días",
    getRange: () => {
      const today = new Date();
      const last30 = new Date();
      last30.setDate(today.getDate() - 30);
      return { start: last30, end: today };
    }
  },
  {
    key: "monthToDate",
    label: "Mes transcurrido",
    getRange: () => {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start, end: today };
    }
  },
  {
    key: "yearToDate",
    label: "Año transcurrido",
    getRange: () => {
      const today = new Date();
      const start = new Date(today.getFullYear(), 0, 1);
      return { start, end: today };
    }
  }
];

function CustomLineChart({ data, ...props }) {
  // Puedes usar cualquier librería de gráficos aquí, por ejemplo recharts, chart.js, etc.
  // Aquí solo se muestra un placeholder.
  return (
    <div className="h-[340px] flex items-center justify-center text-zinc-400 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
      {/* Reemplaza esto por tu gráfico real */}
      <span>Gráfico de líneas aquí</span>
    </div>
  );
}

export function LineChartComponent({ sucursal }) {
  const [value, setValue] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const fechaInicio = value?.start ? value.start.toISOString().split("T")[0] : null;
  const fechaFin = value?.end ? value.end.toISOString().split("T")[0] : null;

  const { comparacionVentas, loading, error } = useComparacionTotal(
    fechaInicio,
    fechaFin,
    sucursal
  );

  useEffect(() => {
    if (comparacionVentas) {
      const data = Array.from({ length: 12 }, (_, index) => ({
        date: `${MESES_CORTO[index]}`,
        "Ventas Totales": Number(comparacionVentas[index]?.total_ventas) || 0,
      }));
      setChartData(data);
    }
  }, [comparacionVentas]);

  const { maxVentas, total } = useMemo(() => {
    const max = chartData.length > 0
      ? Math.max(...chartData.map((item) => Number(item["Ventas Totales"])))
      : 0;
    const total = chartData.reduce((acc, cur) => acc + cur["Ventas Totales"], 0);
    return {
      maxVentas: Math.ceil((max || 10000) / 10000) * 10000,
      total,
    };
  }, [chartData]);

  const promedio = chartData.length ? total / chartData.length : 0;

  // Para el input de fechas
  const handleInputChange = (e) => {
    // Aquí puedes abrir el popover de calendario si tienes uno
    setPopoverOpen(true);
  };

  // Para seleccionar un rango rápido
  const handleQuickRange = (range) => {
    setValue(range.getRange());
    setPopoverOpen(false);
  };

  return (
    <Card className="bg-white rounded-xl">
      <CardHeader className="flex flex-col gap-2 items-start">
        <div className="flex items-center gap-3">
          <TrendingUp className="text-blue-500" size={22} />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Tendencia de Ventas
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip color="primary" variant="flat">
            Total: {valueFormatter(total)}
          </Chip>
          <Tooltip content="Escala máxima del gráfico">
            <Chip color="default" variant="flat">
              Escala máx: {valueFormatter(maxVentas)}
            </Chip>
          </Tooltip>
          <Tooltip content="Promedio mensual">
            <Chip color="violet" variant="flat">
              Promedio: {valueFormatter(promedio)}
            </Chip>
          </Tooltip>
        </div>
        <div className="grid grid-cols-1 gap-2 w-full md:w-auto md:ml-auto md:justify-end">
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger>
              <Button
                variant="flat"
                color="default"
                className="max-w-xs w-full rounded-lg border border-blue-100/60 dark:border-zinc-700/60 bg-white/90 dark:bg-zinc-900/80 shadow-sm focus:ring-2 focus:ring-blue-300 transition-all"
                startContent={<Calendar className="w-4 h-4 text-blue-500" />}
                onClick={() => setPopoverOpen(true)}
              >
                {value?.start && value?.end
                  ? `${value.start.toLocaleDateString("es-PE")} - ${value.end.toLocaleDateString("es-PE")}`
                  : "Selecciona un rango de fechas"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-4 rounded-xl shadow-lg border border-blue-100/60 dark:border-zinc-700/60 bg-white/95 dark:bg-zinc-900/90 w-80">
              <div className="mb-2 font-semibold text-sm text-zinc-700 dark:text-zinc-100">Rangos rápidos</div>
              <div className="grid grid-cols-2 gap-2 mb-4">
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
              <div className="mb-2 font-semibold text-sm text-zinc-700 dark:text-zinc-100">Personalizado</div>
<div className="grid grid-cols-2 gap-2">
  <Input
    type="date"
    value={value?.start ? value.start.toISOString().split("T")[0] : ""}
    onChange={e => setValue(v => ({ ...v, start: new Date(e.target.value) }))}
    className="w-full bg-gray-100 focus:bg-white border-0 ring-0 focus:ring-2 focus:ring-blue-300 shadow-none outline-none"
    style={{ boxShadow: "none", outline: "none", border: "none" }}
  />
  <Input
    type="date"
    value={value?.end ? value.end.toISOString().split("T")[0] : ""}
    onChange={e => setValue(v => ({ ...v, end: new Date(e.target.value) }))}
    className="w-full bg-gray-100 focus:bg-white border-0 ring-0 focus:ring-2 focus:ring-blue-300 shadow-none outline-none"
    style={{ boxShadow: "none", outline: "none", border: "none" }}
  />
</div>
              <div className="flex justify-end mt-3">
                <Button
                  color="primary"
                  variant="flat"
                  onClick={() => setPopoverOpen(false)}
                >
                  Aplicar
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <p className="text-sm text-default-400">
          Ventas totales por mes del año actual
        </p>
      </CardHeader>
      <Divider />
<CardBody>
  {loading ? (
    <div className="text-center py-8 text-default-500">Cargando...</div>
  ) : error ? (
    <div className="text-center text-red-500 py-8">{error.message}</div>
  ) : (
    <>
      <LineChart
        className="mt-2 h-[340px]"
        data={chartData}
        index="date"
        yAxisWidth={80}
        categories={["Ventas Totales"]}
        colors={COLORS}
        valueFormatter={valueFormatter}
        xAxisLabel="Meses"
        yAxisLabel="Ventas (S/.)"
        showAnimation={true}
        showLegend={false}
        curveType="monotone"
        connectNulls={true}
        showDots={true}
        minValue={0}
        maxValue={maxVentas}
        customTooltip={({ payload, active, label }) =>
          active && payload && payload.length ? (
            <Card
              shadow="md"
              radius="md"
              className="min-w-[200px] max-w-[320px] border border-default-200 bg-white/95 px-3 py-2 shadow-xl"
            >
              <CardBody className="space-y-1 p-0">
                <div className="font-semibold text-xs text-default-900 mb-1">{label}</div>
                {payload.map((entry, idx) => (
                  <div
                    key={entry.dataKey}
                    className="flex items-center gap-2 py-0.5"
                  >
                    <span
                      className={`inline-block w-3 h-3 rounded-full border border-default-200 bg-${COLORS[idx % COLORS.length]}-400`}
                      style={{
                        filter: "brightness(1.1) saturate(0.85)",
                        minWidth: 12,
                        minHeight: 12,
                      }}
                    ></span>
                    <span className="font-medium text-xs text-default-800">{entry.dataKey}</span>
                    <span className="ml-auto font-bold text-xs text-default-900">{valueFormatter(entry.value)}</span>
                  </div>
                ))}
              </CardBody>
            </Card>
          ) : null
        }
      />
      <div className="mt-4">
        <div className="flex flex-wrap gap-2">
          <Chip color="indigo" variant="flat">
            Ventas Totales
          </Chip>
        </div>
      </div>
    </>
  )}
</CardBody>
      <Divider />
      <CardFooter>
        <span className="text-xs text-default-400">
          Datos actualizados mensualmente. Haz hover en los puntos para ver el detalle.
        </span>
      </CardFooter>
    </Card>
  );
}