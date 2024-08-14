import React, { useEffect } from "react";
import { Card, DonutChart, List, ListItem } from '@tremor/react';
import useCantidadVentasPorSubcategoria from '../data/data_venta_subcat';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const currencyFormatter = (number) => {
  return Intl.NumberFormat('us').format(number).toString();
};

export default function Example({ idSucursal }) { 
  const { data, loading, error } = useCantidadVentasPorSubcategoria(idSucursal); 

  useEffect(() => {
    console.log('Data from hook:', data);
  }, [data]);

  const colors = [
    "bg-cyan-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-fuchsia-500",
  ];

  const salesData = data.map((subcat, index) => ({
    name: subcat.subcategoria,
    amount: Number(subcat.cantidad_vendida),
    share: ((Number(subcat.cantidad_vendida) / data.reduce((sum, item) => sum + Number(item.cantidad_vendida), 0)) * 100).toFixed(1) + '%',
    color: colors[index % colors.length], // Asigna un color según el índice
  }));

  return (
    <>
      <Card className="sm:mx-auto sm:max-w-lg">
        <h3 className="text-tremor-default font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
          Cantidad de ventas por SubCategoría
        </h3>
        {loading ? (
          <p className="text-center">Cargando...</p>
        ) : error ? (
          <p className="text-center text-red-500">Error: {error}</p>
        ) : (
          <>
            <DonutChart
              className="mt-8"
              data={salesData}
              category="amount"
              index="name"
              valueFormatter={currencyFormatter}
              showTooltip={false}
              colors={['cyan', 'blue', 'indigo', 'violet', 'fuchsia']} 
            />
            <p className="mt-8 flex items-center justify-between text-tremor-label text-tremor-content dark:text-dark-tremor-content">
              <span>SubCategoría</span>
              <span>Cantidad / Porcentaje</span>
            </p>
            <List className="mt-2">
              {salesData.map((item) => (
                <ListItem key={item.name} className="space-x-6">
                  <div className="flex items-center space-x-2.5 truncate">
                    <span
                      className={classNames(
                        item.color,
                        'size-2.5 shrink-0 rounded-sm',
                      )}
                      aria-hidden={true}
                    />
                    <span className="truncate dark:text-dark-tremor-content-emphasis">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium tabular-nums text-tremor-content-strong dark:text-dark-tremor-content-strong">
                      {currencyFormatter(item.amount)}
                    </span>
                    <span className="rounded-tremor-small bg-tremor-background-subtle px-1.5 py-0.5 text-tremor-label font-medium tabular-nums text-tremor-content-emphasis dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content-emphasis">
                      {item.share}
                    </span>
                  </div>
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Card>
    </>
  );
}
