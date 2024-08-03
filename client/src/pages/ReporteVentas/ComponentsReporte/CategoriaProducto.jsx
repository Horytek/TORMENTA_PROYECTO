import React from "react";
import { DonutChart, Legend } from "@tremor/react";
import useCantidadVentasPorCategoria from '../data/data_venta_cat'; // Asegúrate de que la ruta sea correcta

const valueFormatter = (number) =>
  `${Intl.NumberFormat("us").format(number).toString()}`;

const DonutChartUsageExample = () => {
  const { ventasPorCategoria, loading, error } = useCantidadVentasPorCategoria();

  const sales = ventasPorCategoria.map(categoria => ({
    name: categoria.categoria,
    sales: categoria.cantidad_vendida,
  }));

  // Debugging: Verificar los datos recibidos
  console.log('Ventas por Categoría:', sales);

  return (
    <div className="flex items-center justify-center">
      <div className="p-6 border border-gray-300 rounded-lg shadow-lg bg-white">
        <h3 className="text-center font-semibold text-lg mb-4">
          Ventas por sub categoría de producto
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
              className="w-80 mx-auto"
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
