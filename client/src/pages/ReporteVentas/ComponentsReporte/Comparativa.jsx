import React, { useEffect } from 'react';
import { Legend, LineChart } from '@tremor/react';
import useAnalisisGananciasSucursales from '../data/data_ganancias_sucr'; 

const valueFormatter = (number) => {
  return 'S/. ' + new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(number);
};

const LineChartUsageExampleAxisLabel = () => {
  const { data, loading, error } = useAnalisisGananciasSucursales();

  useEffect(() => {
    // console.log('Raw data:', data); 
  }, [data]);

  const currentYear = new Date().getFullYear().toString().slice(-2); // Obtiene los últimos 2 dígitos del año actual

  // Mantener los nombres en inglés para la comparación con la API
  const months = [
    `Jan ${currentYear}`, `Feb ${currentYear}`, `Mar ${currentYear}`, 
    `Apr ${currentYear}`, `May ${currentYear}`, `Jun ${currentYear}`,
    `Jul ${currentYear}`, `Aug ${currentYear}`, `Sep ${currentYear}`, 
    `Oct ${currentYear}`, `Nov ${currentYear}`, `Dec ${currentYear}`
  ];

  // Objeto para traducir los meses
  const monthTranslations = {
    [`Jan ${currentYear}`]: `Ene'${currentYear}`,
    [`Feb ${currentYear}`]: `Feb'${currentYear}`,
    [`Mar ${currentYear}`]: `Mar'${currentYear}`,
    [`Apr ${currentYear}`]: `Abr'${currentYear}`,
    [`May ${currentYear}`]: `May'${currentYear}`,
    [`Jun ${currentYear}`]: `Jun'${currentYear}`,
    [`Jul ${currentYear}`]: `Jul'${currentYear}`,
    [`Aug ${currentYear}`]: `Ago'${currentYear}`,
    [`Sep ${currentYear}`]: `Sep'${currentYear}`,
    [`Oct ${currentYear}`]: `Oct'${currentYear}`,
    [`Nov ${currentYear}`]: `Nov'${currentYear}`,
    [`Dec ${currentYear}`]: `Dic'${currentYear}`,
  };

  const organizedData = months.map(month => {
    const entry = { 
      date: monthTranslations[month] || month, // Mostrar el mes traducido
      originalDate: month // Mantener el mes original para comparaciones
    };
    data.forEach(item => {
      if (item.mes === month) {
        entry[item.sucursal] = parseFloat(item.ganancias); 
      }
    });
    return entry;
  });

  useEffect(() => {
    // console.log('Organized data:', organizedData); 
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
