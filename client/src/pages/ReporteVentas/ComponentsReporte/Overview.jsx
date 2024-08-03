import React from "react";
import { BarChart, Card } from "@tremor/react";
import useCantidadVentasPorProducto from '../data/data_prod_venta'; // Asegúrate de que la ruta sea correcta

const dataFormatter = (number) =>
  Intl.NumberFormat("us").format(number).toString();

const BarChartHero = () => {
  const { ventasPorProducto, loading, error } = useCantidadVentasPorProducto();

  const chartdata = ventasPorProducto.map(producto => ({
    name: producto.descripcion,
    "Número de productos vendidos": producto.cantidad_vendida,
  }));

  return (
    <Card className="p-6 border border-gray-300 rounded-lg shadow-lg bg-white">
      <h3 className="ml-1 mr-1 font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
        Cantidad de ventas por producto
      </h3>
      <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
        Representación de la cantidad de ventas por producto
      </p>
      <div className="overflow-x-scroll custom-scrollbar" style={{ width: '600px' }}>
        <div style={{ width: '1000px' }}>
          {loading ? (
            <p>Cargando...</p>
          ) : error ? (
            <p>Error: {error}</p>
          ) : (
            <BarChart
              data={chartdata}
              index="name"
              categories={["Número de productos vendidos"]}
              colors={["blue"]}
              valueFormatter={dataFormatter}
              yAxisWidth={48}
              className="mt-6 h-60"
              onValueChange={(v) => console.log(v)}
            />
          )}
        </div>
      </div>
    </Card>
  );
};

export default BarChartHero;
