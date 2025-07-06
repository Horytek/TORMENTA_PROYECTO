import React from "react";
import { Card, CardHeader, CardBody, CardFooter, Divider, Chip, Spinner } from "@heroui/react";
import useTopProductosMargen from "@/services/reports/data_productos_marge";
import { TrendingUp } from "lucide-react";

export default function TopProductosMargen({ idSucursal, year, month, week, limit = 5 }) {
  const { data, loading, error } = useTopProductosMargen(idSucursal, year, month, week, limit);

  // Gradientes y colores para los indicadores
  const gradients = [
    "from-emerald-400/30 via-emerald-200/20 to-transparent",
    "from-blue-400/30 via-blue-200/20 to-transparent",
    "from-amber-400/30 via-yellow-200/20 to-transparent",
    "from-purple-400/30 via-purple-200/20 to-transparent",
    "from-pink-400/30 via-pink-200/20 to-transparent",
  ];
  const dotColors = [
    "bg-emerald-500",
    "bg-blue-500",
    "bg-amber-500",
    "bg-purple-500",
    "bg-pink-500",
  ];

  return (
    <Card className="relative overflow-hidden rounded-2xl border-1 shadow-xl bg-white dark:bg-zinc-900 transition-all sm:mx-auto sm:max-w-lg p-6">
      {/* Fondo decorativo sutil */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-100/60 to-blue-200/40 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-amber-100/40 to-purple-100/30 rounded-full blur-xl"></div>
      </div>
      <CardHeader className="flex items-center gap-3 mb-1 bg-transparent">
        <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-400/80 to-blue-500/80 shadow">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Top Productos por Margen</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Productos con mayor margen de ganancia
          </p>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="py-3 px-4">
        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : !data || data.length === 0 ? (
          <div className="p-6 text-center bg-white/60 dark:bg-zinc-800/60 rounded-xl">
            <p className="text-zinc-500 dark:text-zinc-400">No hay productos con margen en este periodo</p>
          </div>
        ) : (
<ul className="divide-y divide-emerald-50 dark:divide-emerald-900">
            {data.map((product, i) => (
              <li key={i} className="py-2 flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate mb-1 sm:mb-0">
                      {product.nombre || product.name}
                    </span>
                    <Chip
                      color="primary"
                      variant="flat"
                      className="font-bold text-xs px-2 py-0.5 ml-0 sm:ml-4 mt-1 sm:mt-0"
                    >
                      S/. {product.ventas?.toLocaleString() ?? product.sales}
                    </Chip>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${dotColors[i % dotColors.length]}`}></span>
                    <span className="text-xs text-zinc-400">
                      Margen: {product.margen ?? product.margin}%
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
      <Divider />
      <CardFooter>
        <p className="text-sm text-default-500">Datos actualizados diariamente.</p>
      </CardFooter>
    </Card>
  );
}