import React from "react";
import { Card, CardHeader, CardBody, CardFooter, Chip, Tooltip, Divider } from "@heroui/react";
import { DonutChart } from '@tremor/react';
import useCantidadVentasPorSubcategoria from '@/services/reports/data_venta_subcat';
import { Tag } from "lucide-react";

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const currencyFormatter = (number) => {
  return Intl.NumberFormat('us').format(number).toString();
};

export default function CategoriaProducto({ idSucursal, year, month, week }) {
  const { data, loading, error } = useCantidadVentasPorSubcategoria(idSucursal, year, month, week);

  const colors = [
    "bg-cyan-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-fuchsia-500",
  ];

  const donutColors = ['cyan', 'blue', 'indigo', 'violet', 'fuchsia'];

  const total = data.reduce((sum, item) => sum + Number(item.cantidad_vendida), 0);

  const salesData = data.map((subcat, index) => ({
    name: subcat.subcategoria,
    amount: Number(subcat.cantidad_vendida),
    share: total ? ((Number(subcat.cantidad_vendida) / total) * 100).toFixed(1) + '%' : '0%',
    color: colors[index % colors.length],
  }));

  return (
    <Card className="sm:mx-auto sm:max-w-[410px] p-6 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl shadow-xl transition-all">
      <CardHeader className="flex flex-col items-start gap-2">
        <div className="flex items-center gap-2">
          <Tag className="text-blue-500" size={22} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Ventas por SubCategoría
          </h3>
          <Tooltip content="Total de productos vendidos en todas las subcategorías">
            <Chip color="primary" variant="flat">
              Total: {currencyFormatter(total)}
            </Chip>
          </Tooltip>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-300">
          Distribución de ventas por subcategoría en el periodo seleccionado
        </p>
      </CardHeader>
      <Divider />
      <CardBody>
        {loading ? (
          <p className="text-center mt-4 text-gray-700 dark:text-gray-200">Cargando...</p>
        ) : error ? (
          <p className="text-center text-red-500 mt-4">Error: {error}</p>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <p className="text-gray-500 text-lg">No hay datos disponibles</p>
            <p className="text-gray-400 text-sm">No se encontraron registros de ventas por subcategoría</p>
          </div>
        ) : (
          <>
            <div className="flex justify-center items-center mt-4 mb-2">
<DonutChart
  className="w-52 h-52 sm:w-60 sm:h-60"
  data={salesData}
  category="amount"
  index="name"
  valueFormatter={currencyFormatter}
  colors={donutColors}
centerLabel={{
  value: currencyFormatter(total),
  className: "font-bold text-blue-700 dark:text-gray-100 text-lg"
}}
  customTooltip={({ payload }) =>
    payload?.length ? (
      <div className="p-3 rounded-xl shadow-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 min-w-[120px]">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`inline-block w-3 h-3 rounded-sm`}
            style={{ backgroundColor: payload[0].color }}
          />
          <span className="font-semibold">{payload[0].payload.name}</span>
        </div>
        <div className="text-xs">
          <span className="font-bold">{currencyFormatter(payload[0].payload.amount)}</span>
          <span className="ml-2 text-blue-700 dark:text-blue-300">{payload[0].payload.share}</span>
        </div>
      </div>
    ) : null
  }
/>
            </div>
            <Divider />
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-300 tracking-wide uppercase">
                  SubCategoría
                </span>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-300 tracking-wide uppercase">
                  Cantidad / %
                </span>
              </div>
              <div className="space-y-2">
                {salesData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 shadow-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={classNames(item.color, 'w-3 h-3 rounded-sm flex-shrink-0')}
                        aria-hidden={true}
                      />
                      <span className="truncate font-medium text-gray-900 dark:text-white text-sm tracking-tight">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-blue-700 dark:text-blue-300 text-sm">
                        {currencyFormatter(item.amount)}
                      </span>
                      <span className="rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 text-xs font-semibold">
                        {item.share}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardBody>
      <Divider />
      <CardFooter>
        <p className="text-sm text-gray-400 dark:text-gray-500">Datos actualizados diariamente.</p>
      </CardFooter>
    </Card>
  );
}