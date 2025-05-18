import React from "react";
import { Card, CardHeader, CardBody, CardFooter, Divider, Chip, Spinner } from "@heroui/react";
import useTopProductosMargen from "../data/data_productos_marge";

export default function TopProductosMargen({ idSucursal, year, month, week, limit = 5 }) {
  const { data, loading, error } = useTopProductosMargen(idSucursal, year, month, week, limit);

  return (
    <Card className="sm:mx-auto sm:max-w-lg p-6 bg-white rounded-lg shadow-md">
      <CardHeader className="flex flex-col items-start">
        <h3 className="text-lg font-semibold">Top Productos por Margen</h3>
        <p className="text-sm text-default-500">Productos con mayor margen de ganancia</p>
      </CardHeader>
      <Divider />
      <CardBody>
        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : !data || data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <p className="text-gray-500 text-lg">No hay datos disponibles</p>
            <p className="text-gray-400 text-sm">No se encontraron productos con margen para el periodo seleccionado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((product, i) => (
              <div key={i} className="flex items-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">{i + 1}</div>
                <div className="ml-4 space-y-1 flex-1">
                  <p className="text-sm font-medium leading-none">{product.nombre || product.name}</p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span>Ventas: S/. {product.ventas?.toLocaleString() ?? product.sales}</span>
                    <span className="mx-2">•</span>
                    <Chip variant="outline" className="text-xs">
                      Margen {product.margen ?? product.margin}%
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
        )}
      </CardBody>
      <Divider />
      <CardFooter>
        <p className="text-sm text-default-500">Datos actualizados diariamente.</p>
      </CardFooter>
    </Card>
  );
}