import { LineChart } from '@tremor/react';

const chartdata = [
  {
    date: 'Enero',
    'Año 2023': 2890,
    'Año 2024': 2338,
  },
  {
    date: 'Febrero',
    'Año 2023': 2756,
    'Año 2024': 2103,
  },
  {
    date: 'Marzo',
    'Año 2023': 3322,
    'Año 2024': 2194,
  },
  {
    date: 'Abril',
    'Año 2023': 3470,
    'Año 2024': 2108,
  },
  {
    date: 'Mayo',
    'Año 2023': 3475,
    'Año 2024': 1812,
  },
  {
    date: 'Junio',
    'Año 2023': 3129,
    'Año 2024': 1726,
  },
  {
    date: 'Julio',
    'Año 2023': 3490,
    'Año 2024': 1982,
  },
  {
    date: 'Agosto',
    'Año 2023': 2903,
    'Año 2024': 2012,
  },
  {
    date: 'Septiembre',
    'Año 2023': 2643,
    'Año 2024': 2342,
  },
  {
    date: 'Octubr',
    'Año 2023': 2837,
    'Año 2024': 2473,
  },
  {
    date: 'Noviembre',
    'Año 2023': 2954,
    'Año 2024': 3848,
  },
  {
    date: 'Deciembre',
    'Año 2023': 3239,
    'Año 2024': 3736,
  },
];

const valueFormatter = function (number) {
  return 'S/. ' + new Intl.NumberFormat('us').format(number).toString();
};

export function LineChartComponent() {
  return (
    <>
      <h3 className="text-lg font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
        Gráfica comparativa de ventas por año
      </h3>
      <LineChart
        className="h-72"
        data={chartdata}
        index="date"
        yAxisWidth={65}
        categories={['Año 2023', 'Año 2024']}
        colors={['indigo', 'cyan']}
        valueFormatter={valueFormatter}
      />
    </>
  );
}