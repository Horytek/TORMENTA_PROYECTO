import React from "react";
import { Card, Metric, Text, Icon } from "@tremor/react";
import useVentasData from "../data/data_soles";
import useProductosVendidos from "../data/data_prod";
import useProductoTop from "../data/data_top";
import { RiCashFill, RiLineChartFill, RiTShirt2Line } from "@remixicon/react";

const SalesCard = () => {
  const { totalRecaudado } = useVentasData();
  const { totalProductosVendidos } = useProductosVendidos();
  const { productoTop, loading, error } = useProductoTop();

  return (
    <div className="container mx-auto px-4 mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="mx-auto w-full max-w-md p-2 flex items-center" decoration="top" decorationColor="green">
          <div className="flex items-center space-x-2 w-full">
            <Icon
              icon={RiCashFill}
              color="indigo"
              variant="solid"
              tooltip="Dinero recaudado"
              size="lg"
              className="text-green-500 text-4xl"
            />
            <div className="flex flex-col items-start">
              <Text className="text-sm">Ventas totales</Text>
              <Metric className="text-lg">S/. {totalRecaudado}</Metric>
            </div>
          </div>
        </Card>

        <Card className="mx-auto w-full max-w-md p-2 flex items-center" decoration="top" decorationColor="purple">
          <div className="flex items-center space-x-2 w-full">
            <Icon
              icon={RiTShirt2Line}
              color="indigo"
              variant="solid"
              tooltip="Productos vendidos"
              size="lg"
              className="text-indigo-500 text-4xl"
            />
            <div className="flex flex-col items-start">
              <Text className="text-sm">Productos vendidos</Text>
              <Metric className="text-lg">{totalProductosVendidos}</Metric>
            </div>
          </div>
        </Card>

        <Card className="mx-auto w-full max-w-md p-2 flex items-center" decoration="top" decorationColor="blue">
          <div className="flex items-center space-x-2 w-full">
            <Icon
              icon={RiLineChartFill}
              color="indigo"
              variant="solid"
              tooltip="Producto más vendido"
              size="lg"
              className="text-blue-500 text-4xl"
            />
            <div className="flex flex-col items-start">
              <Text className="text-sm">Producto más vendido</Text>
              {loading ? (
                <Metric className="text-lg">Cargando...</Metric>
              ) : error ? (
                <Metric className="text-lg">Error: {error}</Metric>
              ) : (
                <Metric className="text-lg">{productoTop?.descripcion || "No disponible"}</Metric>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SalesCard;
