import React, { useEffect } from "react";
import { DonutChart, Legend } from "@tremor/react";
import useCantidadVentasPorSubcategoria from '../data/data_venta_subcat'; // Asegúrate de que la ruta sea correcta

const valueFormatter = (number) =>
  `${Intl.NumberFormat("us").format(number).toString()}`;

const DonutChartUsageExample = () => {
  const { data, loading, error } = useCantidadVentasPorSubcategoria();

  useEffect(() => {
    console.log('Data from hook:', data);
  }, [data]);

  const sales = data.map(subcat => {
    return {
      name: subcat.subcategoria,
      sales: Number(subcat.cantidad_vendida) 
    };
  });

  useEffect(() => {
    console.log('Sales data for DonutChart:', sales);
  }, [sales]);

  return (
    <div className="flex items-center justify-center">
      <div className="p-6 border border-gray-300 rounded-lg shadow-lg bg-white">
        <h3 className="text-center font-semibold text-lg mb-4">
          Cantidad de ventas por SubCategoría de producto
        </h3>
        {loading ? (
          <p className="text-center">Cargando...</p>
        ) : error ? (
          <p className="text-center text-red-500">Error: {error}</p>
        ) : (
          <>
            <DonutChart
              data={sales}
              category="sales"
              index="name"
              valueFormatter={valueFormatter}
              colors={["blue", "cyan", "indigo", "violet", "fuchsia"]}
              className="w-40 mx-auto"
            />
            <Legend
              categories={sales.map(item => item.name)}
              colors={["blue", "cyan", "indigo", "violet", "fuchsia"]}
              className="max-w-xs mx-auto mt-4"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default DonutChartUsageExample;
