import React from "react";
import { BarChart, Card } from "@tremor/react";

const chartdata = [
  { name: "Amphibians", "Número de productos vendidos": 2488 },
  { name: "Birds", "Número de productos vendidos": 1445 },
  { name: "Crustaceans", "Número de productos vendidos": 743 },
  { name: "Ferns", "Número de productos vendidos": 281 },
  { name: "Arachnids", "Número de productos vendidos": 251 },
  { name: "Corals", "Número de productos vendidos": 232 },
  { name: "Algae", "Número de productos vendidos": 98 },
  { name: "Mammals", "Número de productos vendidos": 98 },
  { name: "a", "Número de productos vendidos": 98 },
  { name: "ba", "Número de productos vendidos": 98 },
  { name: "accccc", "Número de productos vendidos": 98 },
  { name: "pantalon", "Número de productos vendidos": 98 },
  { name: "pantalo ntormenta", "Número de productos vendidos": 98 },
  { name: "accccc", "Número de productos vendidos": 98 },
];

const dataFormatter = (number) =>
  Intl.NumberFormat("us").format(number).toString();

const BarChartHero = () => (
  <Card className="p-6 border border-gray-300 rounded-lg shadow-lg bg-white">
    <h3 className="ml-1 mr-1 font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
      Cantidad de ventas por producto
    </h3>
    <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
      Representación de la cantidad de ventas por producto
    </p>
    <div className="overflow-x-scroll custom-scrollbar" style={{ width: '600px' }}>
      <div style={{ width: '1000px' }}>
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
      </div>
    </div>
  </Card>
);

export default BarChartHero;
