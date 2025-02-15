import React from "react";
import { BarChart, Card } from "@tremor/react";
import useCantidadVentasPorProducto from '../data/data_prod_venta';

const dataFormatter = (number) => ` ${Intl.NumberFormat("us").format(number).toString()}`;
const currencyFormatter = (number) => `S/ ${Intl.NumberFormat("us").format(number).toString()}`;

const BarChartHero = ({ idSucursal }) => { 
  const { ventasPorProducto, loading, error } = useCantidadVentasPorProducto(idSucursal); 

  const chartdata = ventasPorProducto.map(producto => ({
    name: producto.descripcion,
    "Existencias vendidas": producto.cantidad_vendida,
    "Dinero generado (S/)": producto.dinero_generado
  }));

  return (
    <Card className="p-6 border border-gray-300 rounded-lg shadow-lg bg-white">
      <h3 className="ml-1 mr-1 font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
        Cantidad de ventas por producto
      </h3>
      <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
        Representación de la cantidad de ventas por producto y dinero generado
      </p>
      <div className="overflow-x-scroll custom-scrollbar" style={{ width: '700px' }}>
        <div style={{ width: '1000px' }}>
          {loading ? (
            <p className="text-center py-4">Cargando...</p>
          ) : error ? (
            <p className="text-center text-red-500 py-4">Error: {error}</p>
          ) : ventasPorProducto.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <p className="text-gray-500 text-lg">No hay datos disponibles</p>
              <p className="text-gray-400 text-sm">No se encontraron registros de ventas por producto</p>
            </div>
          ) : (
            <BarChart
              data={chartdata}
              index="name"
              categories={["Existencias vendidas", "Dinero generado (S/)"]}
              colors={["blue", "green"]}
              valueFormatter={(value, index, category) => 
                category === "Dinero generado (S/)" ? currencyFormatter(value) : dataFormatter(value)}
              yAxisWidth={48}
              className="mt-6 h-80"
              // onValueChange={(v) => console.log(v)}
            />
          )}
        </div>
      </div>
    </Card>
  );
};

export default BarChartHero;
