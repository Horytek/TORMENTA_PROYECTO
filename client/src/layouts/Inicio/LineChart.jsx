import { useState, useEffect } from "react";
import { LineChart, DateRangePicker, DateRangePickerItem } from "@tremor/react";
import { Card, CardHeader, CardBody, Divider, Chip, Tooltip } from "@heroui/react";
import { Calendar, TrendingUp } from "lucide-react";
import { es } from "date-fns/locale";
import useComparacionTotal from "@/layouts/Inicio/hooks/comparacion_ventas";

const valueFormatter = (number) => {
  return "S/. " + new Intl.NumberFormat("us").format(number).toString();
};

const getMonthName = (monthNumber) => {
  const date = new Date();
  date.setMonth(monthNumber - 1);
  return date.toLocaleString('es', { month: 'long' });
};

export function LineChartComponent({ sucursal }) {
  const [value, setValue] = useState(null);  
  const [chartData, setChartData] = useState([]);

  const fechaInicio = value?.from ? value.from.toISOString().split('T')[0] : null;
  const fechaFin = value?.to ? value.to.toISOString().split('T')[0] : null;

  const { comparacionVentas, loading, error } = useComparacionTotal(
    fechaInicio, 
    fechaFin, 
    sucursal
  );

  useEffect(() => {
    if (comparacionVentas) {
      const data = Array.from({ length: 12 }, (_, index) => ({
        date: getMonthName(index + 1),
        "Ventas Totales": Number(comparacionVentas[index]?.total_ventas) || 0,
      })).sort((a, b) => {
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                       'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        return meses.indexOf(a.date) - meses.indexOf(b.date);
      });
      setChartData(data);
    }
  }, [comparacionVentas]);

  const maxVentas =
    chartData.length > 0
      ? Math.max(...chartData.map((item) => Number(item["Ventas Totales"]))) * 1.2
      : 3500;

  if (loading) return <p>Cargando datos...</p>;
  if (error) return <p>Error al cargar los datos: {error.message}</p>;

  // Calcular total y promedio para mostrar en chips
  const total = chartData.reduce((acc, cur) => acc + cur["Ventas Totales"], 0);
  const promedio = chartData.length ? total / chartData.length : 0;

  return (
    <Card className="relative overflow-hidden rounded-2xl border-1 shadow-xl bg-white dark:bg-zinc-900 transition-all">
<CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gradient-to-r from-indigo-50/80 to-cyan-50/60 dark:from-indigo-900/40 dark:to-cyan-900/20 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-blue-500" />
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Tendencia de Ventas</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Ventas totales por mes del año actual
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Tooltip content="Suma total de ventas">
            <Chip color="success" variant="flat" startContent={<TrendingUp className="w-4 h-4" />}>
              Total: {valueFormatter(total)}
            </Chip>
          </Tooltip>
          <Tooltip content="Promedio mensual">
            <Chip color="violet" variant="flat">
              Promedio: {valueFormatter(promedio)}
            </Chip>
          </Tooltip>
        </div>
        {/* Filtro de fechas alineado a la derecha, sin salirse del Card */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto md:ml-auto md:justify-end md:mr-6">
          <DateRangePicker
            className="max-w-xs w-full"
            value={value}
            onValueChange={setValue}
            locale={es}
            placeholder="Selecciona un rango de fechas"
            selectPlaceholder="Filtros"
            aria-label="Selecciona un rango"
            color="indigo"
          >
            <DateRangePickerItem key="today" value="today" from={new Date()}>
              Hoy
            </DateRangePickerItem>
            <DateRangePickerItem
              key="last7days"
              value="last7days"
              from={new Date(new Date().setDate(new Date().getDate() - 7))}
            >
              Últ. 7 días
            </DateRangePickerItem>
            <DateRangePickerItem
              key="last30days"
              value="last30days"
              from={new Date(new Date().setDate(new Date().getDate() - 30))}
            >
              Últ. 30 días
            </DateRangePickerItem>
            <DateRangePickerItem
              key="monthToDate"
              value="monthToDate"
              from={new Date(new Date().getFullYear(), new Date().getMonth(), 1)}
            >
              Mes transcurrido
            </DateRangePickerItem>
            <DateRangePickerItem
              key="yearToDate"
              value="yearToDate"
              from={new Date(new Date().getFullYear(), 0, 1)}
            >
              Año transcurrido
            </DateRangePickerItem>
          </DateRangePicker>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="pt-4 pb-2">
        <LineChart
          className="h-72"
          data={chartData}
          index="date"
          yAxisWidth={65}
          categories={["Ventas Totales"]}
          colors={["indigo"]}
          valueFormatter={valueFormatter}
          showAnimation={true}
          curveType="monotone"
          minValue={0}
          maxValue={maxVentas}
        />
      </CardBody>
    </Card>
  );
}