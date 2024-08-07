import React, { useEffect } from 'react';
import { Legend, LineChart } from '@tremor/react';
import useAnalisisGananciasSucursales from '../data/data_ganancias_sucr'; 

const valueFormatter = (number) => {
  return 'S/. ' + new Intl.NumberFormat('us').format(number).toString();
};

const LineChartUsageExampleAxisLabel = () => {
  const { data, loading, error } = useAnalisisGananciasSucursales();

  useEffect(() => {
    console.log('Raw data:', data); 
  }, [data]);

  const months = [
    'Jan 24', 'Feb 24', 'Mar 24', 'Apr 24', 'May 24', 'Jun 24',
    'Jul 24', 'Aug 24', 'Sep 24', 'Oct 24', 'Nov 24', 'Dec 24'
  ];

  const organizedData = months.map(month => {
    const entry = { date: month };
    data.forEach(item => {
      if (item.mes === month) {
        entry[item.sucursal] = parseFloat(item.ganancias); 
      }
    });
    return entry;
  });

  useEffect(() => {
    console.log('Organized data:', organizedData); 
  }, [organizedData]);

  const categories = [...new Set(data.map(item => item.sucursal))];

  return (
    <div className="p-6 border border-gray-300 rounded-lg shadow-lg bg-white">
      <h3 className="ml-1 mr-1 font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
        Análisis general de las ventas en las sucursales
      </h3>
      <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
        Representación de las ganancias generadas por las sucursales (12 meses)
      </p>
      {loading ? (
        <p className="text-center">Cargando...</p>
      ) : error ? (
        <p className="text-center text-red-500">Error: {error}</p>
      ) : (
        <LineChart
          className="mt-4 h-80"
          data={organizedData}
          index="date"
          yAxisWidth={65}
          categories={categories}
          colors={['indigo', 'cyan', 'red', 'green', 'orange']}
          valueFormatter={valueFormatter}
          xAxisLabel="Meses del año"
          yAxisLabel="Ventas (Soles)"
          
        />
        
      )}
    </div>
  );
};

export default LineChartUsageExampleAxisLabel;
