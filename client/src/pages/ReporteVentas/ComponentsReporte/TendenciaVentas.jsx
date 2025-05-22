import React from "react";
import { Card, CardHeader, CardBody, CardFooter, Divider, Chip, Tooltip } from "@heroui/react";
import { LineChart } from "@tremor/react";
import { BarChart2, TrendingUp, Calendar } from "lucide-react";
import useTendenciaVentas from "../data/data_tendencia_ventas";

const valueFormatter = (number) => `S/. ${Intl.NumberFormat("es-PE").format(number)}`;
const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function getMesesCompletos(year) {
  return Array.from({ length: 12 }, (_, i) => ({
    mes: meses[i],
    mesIdx: i,
    year,
    ventas: 0,
  }));
}

export default function TendenciaVentas({ idSucursal, year, month, week }) {
  const { data, loading, error } = useTendenciaVentas(idSucursal, year, month, week);

  let chartData = [];
  let xAxisLabel = "";
  let indexKey = "mes";
  let total = 0;
  let promedio = 0;
  let periodoLabel = "";

  if (year && month && week && week !== "all") {
    // Calcular rango de días de la semana seleccionada
    const y = parseInt(year);
    const m = parseInt(month) - 1;
    const weekNumber = parseInt(week.replace(/\D/g, ""));
    const startDay = (weekNumber - 1) * 7 + 1;
    const diasEnMes = new Date(y, m + 1, 0).getDate();
    const endDay = Math.min(weekNumber * 7, diasEnMes);

    // Generar los días de la semana con su número y abreviación
    const diasSemanaConNumero = [];
    for (let d = startDay; d <= endDay; d++) {
      const fecha = new Date(y, m, d);
      const diaSemanaIdx = fecha.getDay() === 0 ? 6 : fecha.getDay() - 1; // Lunes=0, ..., Domingo=6
      diasSemanaConNumero.push({
        label: `${d} ${diasSemana[diaSemanaIdx]}`,
        dia: diasSemana[diaSemanaIdx],
        diaNumero: d,
        fecha: fecha,
        diaSemanaIdx,
      });
    }

    chartData = diasSemanaConNumero.map(({ label, diaNumero, diaSemanaIdx, fecha }) => {
      // Buscar el elemento de data que coincida con el día exacto
      const found = data?.find(item => {
        const itemDate = new Date(item.fecha);
        return (
          itemDate.getDate() === diaNumero &&
          itemDate.getMonth() === m &&
          itemDate.getFullYear() === y
        );
      });
      return {
        dia: label,
        ventas: found ? Number(found.total_ventas) : 0,
      };
    });

    indexKey = "dia";
    xAxisLabel = "Día de la semana";
    total = chartData.reduce((acc, cur) => acc + cur.ventas, 0);
    promedio = chartData.length ? (total / chartData.length) : 0;
    periodoLabel = `Semana ${week} de ${meses[m]} ${year}`;
  } else if (year && month) {
    const diasEnMes = new Date(year, month, 0).getDate();
    chartData = Array.from({ length: diasEnMes }, (_, i) => {
      const found = data?.find(item => new Date(item.fecha).getDate() === i + 1);
      return {
        dia: (i + 1).toString(),
        ventas: found ? Number(found.total_ventas) : 0,
      };
    });
    indexKey = "dia";
    xAxisLabel = "Día del mes";
    total = chartData.reduce((acc, cur) => acc + cur.ventas, 0);
    promedio = chartData.length ? (total / chartData.length) : 0;
    periodoLabel = `${meses[month - 1]} ${year}`;
  } else {
    const selectedYear = year ? parseInt(year) : new Date().getFullYear();
    const mesesCompletos = getMesesCompletos(selectedYear);
    (data || []).forEach(item => {
      const date = new Date(item.fecha);
      if (date.getFullYear() === selectedYear) {
        const mesIdx = date.getMonth();
        mesesCompletos[mesIdx].ventas += Number(item.total_ventas);
      }
    });
    chartData = mesesCompletos.map(({ mes, ventas }) => ({ mes, ventas }));
    indexKey = "mes";
    xAxisLabel = "Mes";
    total = chartData.reduce((acc, cur) => acc + cur.ventas, 0);
    promedio = chartData.length ? (total / chartData.length) : 0;
    periodoLabel = `${selectedYear}`;
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-col items-start gap-2">
        <div className="flex flex-wrap gap-4 items-center w-full">
          <div className="flex items-center gap-2">
            <BarChart2 className="text-blue-500" size={22} />
            <h3 className="text-lg font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Tendencia de Ventas
            </h3>
            <Tooltip content="Periodo seleccionado">
              <Chip color="primary" variant="flat" startContent={<Calendar className="w-4 h-4" />}>
                {periodoLabel}
              </Chip>
            </Tooltip>
          </div>
          <div className="flex flex-wrap gap-2 ml-auto">
            <Tooltip content="Suma total de ventas">
              <Chip color="success" variant="flat" startContent={<TrendingUp className="w-4 h-4" />}>
                Total: {valueFormatter(total)}
              </Chip>
            </Tooltip>
            <Tooltip content="Promedio por punto del eje X">
              <Chip color="violet" variant="flat">
                Promedio: {valueFormatter(promedio)}
              </Chip>
            </Tooltip>
          </div>
        </div>
        <p className="text-sm text-tremor-default text-tremor-content dark:text-dark-tremor-content">
          Evolución de ventas en el periodo seleccionado
        </p>
      </CardHeader>
      <Divider />
      <CardBody>
        <div className="h-[250px] w-full">
          {loading ? (
            <p className="text-center py-8">Cargando...</p>
          ) : error ? (
            <p className="text-center text-red-500 py-8">{error}</p>
          ) : (
            <>
              <LineChart
                data={chartData}
                index={indexKey}
                categories={["ventas"]}
                colors={["blue"]}
                valueFormatter={valueFormatter}
                yAxisWidth={65}
                showLegend={false}
                showAnimation={true}
                showYAxis={true}
                xAxisLabel={xAxisLabel}
                customTooltip={({ payload }) =>
                  payload?.length ? (
                    <div className="p-2 bg-white rounded shadow text-xs">
                      <div>
                        <strong>
                          {indexKey === "mes"
                            ? payload[0].payload.mes
                            : payload[0].payload.dia}
                        </strong>
                      </div>
                      <div>Ventas: {valueFormatter(payload[0].payload.ventas)}</div>
                    </div>
                  ) : null
                }
                className="hidden h-56 sm:block"
              />
              <LineChart
                data={chartData}
                index={indexKey}
                categories={["ventas"]}
                colors={["blue"]}
                valueFormatter={valueFormatter}
                showYAxis={true}
                showLegend={false}
                startEndOnly={true}
                showAnimation={true}
                xAxisLabel={xAxisLabel}
                customTooltip={({ payload }) =>
                  payload?.length ? (
                    <div className="p-2 bg-white rounded shadow text-xs">
                      <div>
                        <strong>
                          {indexKey === "mes"
                            ? payload[0].payload.mes
                            : payload[0].payload.dia}
                        </strong>
                      </div>
                      <div>Ventas: {valueFormatter(payload[0].payload.ventas)}</div>
                    </div>
                  ) : null
                }
                className="h-56 sm:hidden"
              />
            </>
          )}
        </div>
      </CardBody>
      <Divider />
      <CardFooter>
        <p className="text-sm text-default-500">Datos actualizados diariamente.</p>
      </CardFooter>
    </Card>
  );
}