import React from 'react';
import { Card, Metric, Text } from "@tremor/react";

const SalesCard = () => {
  return (
    <>
      <Card
        className="max-w-xs mx-auto mb-6 "
        decoration="top"
        decorationColor="indigo"
      >
        <Text>Ventas totales</Text>
        <Metric>S/. 34,743</Metric>
      </Card>

      <Card
        className="max-w-xs mx-auto mb-6"
        decoration="top"
        decorationColor="indigo"
      >
        <Text>Productos vendidos</Text>
        <Metric>34,743</Metric>
      </Card>

      <Card
        className="max-w-xs mx-auto mb-6"
        decoration="top"
        decorationColor="indigo"
      >
        <Text>Producto más vendido</Text>
        <Metric>Pantalon Tormenta</Metric>
      </Card>
    </>
  );
};

export default SalesCard;
