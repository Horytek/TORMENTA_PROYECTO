// CategoriaProducto.js
import React from "react";
import { DonutChart, Legend } from "@tremor/react";

const sales = [
  { name: "New York", sales: 980 },
  { name: "London", sales: 456 },
  { name: "Hong Kong", sales: 390 },
  { name: "San Francisco", sales: 240 },
  { name: "Singapore", sales: 190 },
];

const valueFormatter = (number) =>
  `$ ${Intl.NumberFormat("us").format(number).toString()}`;

const DonutChartUsageExample = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="p-6 border border-gray-300 rounded-lg shadow-lg bg-white">
        <h3 className="text-center font-semibold text-lg mb-4">
          Cantidad de ventas por categoría de producto
        </h3>
        <DonutChart
          data={sales}
          category="sales"
          index="name"
          valueFormatter={valueFormatter}
          colors={["blue", "cyan", "indigo", "violet", "fuchsia"]}
          className="w-40 mx-auto"
        />
        <Legend
          categories={["New York", "London", "Hong Kong", "San Francisco", "Singapore"]}
          colors={["blue", "cyan", "indigo", "violet", "fuchsia"]}
          className="max-w-xs mx-auto mt-4"
        />
      </div>
    </div>
  );
};

export default DonutChartUsageExample;
