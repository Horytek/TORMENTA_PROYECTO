import React from 'react';
import { LineChart } from '@tremor/react';
import useAnalisisGananciasSucursales from '../data/data_ganancias_sucr'; // Asegúrate de que la ruta sea correcta

const valueFormatter = (number) => {
  return '$ ' + new Intl.NumberFormat('us').format(number).toString();
};

const LineChartUsageExampleAxisLabel = () => {
  const { data, loading, error } = useAnalisisGananciasSucursales();

  const chartdata = data.map((item, index) => ({
    date: `Sucursal ${index + 1}`,
    Ganancias: item.ganancias_totales,
    Ventas: item.total_ventas
  }));

  return (
    <div className="p-6 border border-gray-300 rounded-lg shadow-lg bg-white">
      <h3 className="ml-1 mr-1 font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
        Análisis general de las ganancias en las sucursales
      </h3>
      <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
        Representación de las ganancias generadas por las sucursales
      </p>
      {loading ? (
        <p className="text-center">Cargando...</p>
      ) : error ? (
        <p className="text-center text-red-500">Error: {error}</p>
      ) : (
        <LineChart
          className="mt-4 h-80"
          data={chartdata}
          index="date"
          yAxisWidth={65}
          categories={['Ganancias', 'Ventas']}
          colors={['indigo', 'cyan']}
          valueFormatter={valueFormatter}
          xAxisLabel="Sucursal"
          yAxisLabel="USD"
        />
      )}
    </div>
  );
};

export default LineChartUsageExampleAxisLabel;
