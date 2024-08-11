import { useState, useEffect } from 'react';
import { LineChart } from '@tremor/react';
import useComparacionTotal from '@/layouts/Inicio/hooks/comparacion_ventas'; 

const valueFormatter = (number) => {
  return 'S/. ' + new Intl.NumberFormat('us').format(number).toString();
};

export function LineChartComponent() {
  const { comparacionVentas, loading, error } = useComparacionTotal();

  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (comparacionVentas) {
      const data = [
        {
          date: 'Enero',
          'Año 2023': comparacionVentas['1']?.['2023'] || 0,
          'Año 2024': comparacionVentas['1']?.['2024'] || 0,
        },
        {
          date: 'Febrero',
          'Año 2023': comparacionVentas['2']?.['2023'] || 0,
          'Año 2024': comparacionVentas['2']?.['2024'] || 0,
        },
        {
          date: 'Marzo',
          'Año 2023': comparacionVentas['3']?.['2023'] || 0,
          'Año 2024': comparacionVentas['3']?.['2024'] || 0,
        },
        {
          date: 'Abril',
          'Año 2023': comparacionVentas['4']?.['2023'] || 0,
          'Año 2024': comparacionVentas['4']?.['2024'] || 0,
        },
        {
          date: 'Mayo',
          'Año 2023': comparacionVentas['5']?.['2023'] || 0,
          'Año 2024': comparacionVentas['5']?.['2024'] || 0,
        },
        {
          date: 'Junio',
          'Año 2023': comparacionVentas['6']?.['2023'] || 0,
          'Año 2024': comparacionVentas['6']?.['2024'] || 0,
        },
        {
          date: 'Julio',
          'Año 2023': comparacionVentas['7']?.['2023'] || 0,
          'Año 2024': comparacionVentas['7']?.['2024'] || 0,
        },
        {
          date: 'Agosto',
          'Año 2023': comparacionVentas['8']?.['2023'] || 0,
          'Año 2024': comparacionVentas['8']?.['2024'] || 0,
        },
        {
          date: 'Septiembre',
          'Año 2023': comparacionVentas['9']?.['2023'] || 0,
          'Año 2024': comparacionVentas['9']?.['2024'] || 0,
        },
        {
          date: 'Octubre',
          'Año 2023': comparacionVentas['10']?.['2023'] || 0,
          'Año 2024': comparacionVentas['10']?.['2024'] || 0,
        },
        {
          date: 'Noviembre',
          'Año 2023': comparacionVentas['11']?.['2023'] || 0,
          'Año 2024': comparacionVentas['11']?.['2024'] || 0,
        },
        {
          date: 'Diciembre',
          'Año 2023': comparacionVentas['12']?.['2023'] || 0,
          'Año 2024': comparacionVentas['12']?.['2024'] || 0,
        },
      ];
      setChartData(data);
    }
  }, [comparacionVentas]);

  if (loading) return <p>Cargando datos...</p>;
  if (error) return <p>Error al cargar los datos: {error.message}</p>;

  return (
    <>
      <h3 className="text-lg font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
        Gráfica comparativa de ventas por año
      </h3>
      <LineChart
        className="h-72"
        data={chartData}
        index="date"
        yAxisWidth={65}
        categories={['Año 2023', 'Año 2024']}
        colors={['indigo', 'cyan']}
        valueFormatter={valueFormatter}
      />
    </>
  );
}
