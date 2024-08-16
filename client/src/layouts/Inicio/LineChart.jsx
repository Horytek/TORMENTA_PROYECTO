import { useState, useEffect } from "react";
import { LineChart, DateRangePicker, DateRangePickerItem } from "@tremor/react";
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

export function LineChartComponent() {
  const [value, setValue] = useState(null);  

  const fechaInicio = value?.from ? value.from.toISOString().split('T')[0] : null;
  const fechaFin = value?.to ? value.to.toISOString().split('T')[0] : null;

  const { comparacionVentas, loading, error } = useComparacionTotal(fechaInicio, fechaFin);

  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (comparacionVentas) {
      const data = Array.from({ length: 12 }, (_, index) => ({
        date: getMonthName(index + 1),
        "Ventas Totales": comparacionVentas[index]?.total_ventas || 0,
      }));
      setChartData(data);
    }
  }, [comparacionVentas]);
  

  if (loading) return <p>Cargando datos...</p>;
  if (error) return <p>Error al cargar los datos: {error.message}</p>;

  return (
    <>
      <div className="p-6 border border-gray-300 rounded-lg shadow-lg bg-white">
        <div className="grid grid-cols-2 items-center">
          <h3 className="text-lg font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
            Gráfica de ventas del año actual
          </h3>
          <div className="justify-self-end">
            <DateRangePicker
              className="max-w-sm w-full"
              value={value}
              onValueChange={setValue}
              locale={es}
              placeholder="Selecciona un rango de fechas"
              selectPlaceholder="Filtros"
              aria-label="Selecciona un rango"
              color="rose"
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
        </div>
        <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
          Ventas totales por mes del año actual
        </p>

        <LineChart
          className="h-72"
          data={chartData}
          index="date"
          yAxisWidth={65}
          categories={["Ventas Totales"]}
          colors={["indigo"]}
          valueFormatter={valueFormatter}
        />
      </div>
    </>
  );
}
