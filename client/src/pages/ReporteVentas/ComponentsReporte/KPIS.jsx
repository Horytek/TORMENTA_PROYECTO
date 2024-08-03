import React from 'react';
import { Card, Metric, Text } from "@tremor/react";
import useVentasData from '../data/data_soles';
import useProductosVendidos from '../data/data_prod';
import useProductoTop from '../data/data_top';

const SalesCard = () => {
  const { totalRecaudado } = useVentasData();
  const { totalProductosVendidos } = useProductosVendidos();
  const { productoTop, loading, error } = useProductoTop();

  return (
    <>
      <Card
        className="max-w-xs mx-auto mb-6"
        decoration="top"
        decorationColor="indigo"
      >
        <Text>Ventas totales</Text>
        <Metric>S/. {totalRecaudado}</Metric>
      </Card>

      <Card
        className="max-w-xs mx-auto mb-6"
        decoration="top"
        decorationColor="indigo"
      >
        <Text>Productos vendidos</Text>
        <Metric>{totalProductosVendidos}</Metric>
      </Card>

      <Card
        className="max-w-xs mx-auto mb-6"
        decoration="top"
        decorationColor="indigo"
      >
        <Text>Producto más vendido</Text>
        {loading ? (
          <Metric>Cargando...</Metric>
        ) : error ? (
          <Metric>Error: {error}</Metric>
        ) : (
          <Metric>{productoTop?.descripcion || 'No disponible'}</Metric>
        )}
      </Card>
    </>
  );
};

export default SalesCard;
