import React from "react";
import { Card, CardHeader, CardBody, CardFooter, Divider, Chip } from "@heroui/react";

const productos = [
  { name: "SHORT RIGIDO C/S BASTA / TORMENTA", margin: 68, sales: "S/. 1,740.00" },
  { name: "MOM JEANS / DASHIR", margin: 62, sales: "S/. 1,250.00" },
  { name: "MOM PARCHE Y RASGADO JEANS", margin: 55, sales: "S/. 980.00" },
  { name: "FALDA SHORT", margin: 52, sales: "S/. 320.00" },
];

export default function TopProductosMargen() {
  return (
    <Card className="sm:mx-auto sm:max-w-lg p-6 bg-white rounded-lg shadow-md">
      <CardHeader className="flex flex-col items-start">
        <h3 className="text-lg font-semibold">Top Productos por Margen</h3>
        <p className="text-sm text-default-500">Productos con mayor margen de ganancia</p>
      </CardHeader>
      <Divider />
      <CardBody>
        <div className="space-y-4">
          {productos.map((product, i) => (
            <div key={i} className="flex items-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">{i + 1}</div>
              <div className="ml-4 space-y-1 flex-1">
                <p className="text-sm font-medium leading-none">{product.name}</p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span>Ventas: {product.sales}</span>
                  <span className="mx-2">•</span>
                  <Chip variant="outline" className="text-xs">
                    Margen {product.margin}%
                  </Chip>
                </div>
              </div>
              <div
                className={`h-2 w-2 rounded-full ${
                  i === 0
                    ? "bg-emerald-500"
                    : i === 1
                    ? "bg-blue-500"
                    : i === 2
                    ? "bg-amber-500"
                    : "bg-purple-500"
                }`}
              ></div>
            </div>
          ))}
        </div>
      </CardBody>
      <Divider />
      <CardFooter>
        <p className="text-sm text-default-500">Datos actualizados diariamente.</p>
      </CardFooter>
    </Card>
  );
}