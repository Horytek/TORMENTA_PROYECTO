import React, { useState } from "react";
import { Card, Dialog, DialogPanel, TextInput, Badge, ProgressBar } from "@tremor/react";
import { RiSearchLine } from "@remixicon/react";
import { ScrollShadow } from "@heroui/react";
import useCantidadVentasPorProducto from "../data/data_prod_venta";

const dataFormatter = (number) => ` ${Intl.NumberFormat("us").format(number).toString()}`;
const currencyFormatter = (number) => `S/ ${Intl.NumberFormat("us").format(number).toString()}`;

const BarChartHero = ({ idSucursal }) => {
  const { ventasPorProducto, loading, error } = useCantidadVentasPorProducto(idSucursal);

  const barListData = ventasPorProducto.map((producto) => ({
    name: producto.descripcion,
    cantidad: producto.cantidad_vendida,
    ingresos: producto.dinero_generado,
  }));

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = barListData.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calcular el máximo de productos vendidos para normalizar las barras
  const maxCantidad = Math.max(...barListData.map((item) => item.cantidad), 0);

  return (
    <>
<Card className="p-4 border border-gray-300 rounded-lg shadow-sm bg-white">
  <h3 className="text-lg font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
    Cantidad de ventas por producto
  </h3>
  <p className="text-sm text-tremor-default text-tremor-content dark:text-dark-tremor-content">
    Representación de la cantidad de ventas por producto y dinero generado
  </p>

  <div className="mt-4 min-h-[300px] max-h-[530px] overflow-auto">
    {loading ? (
      <p className="text-center py-4 text-sm">Cargando...</p>
    ) : error ? (
      <p className="text-center text-red-500 py-4 text-sm">Error: {error}</p>
    ) : ventasPorProducto.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-6">
        <p className="text-gray-500 text-sm">No hay datos disponibles</p>
      </div>
    ) : (
      <ScrollShadow className="h-full px-4 pb-4">
        <div className="space-y-4">
          {barListData.map((item) => (
            <div
              key={item.name}
              className="relative flex items-center w-full h-20 bg-gray-50 rounded-md overflow-hidden"
            >
              <div className="relative z-10 flex justify-between items-center w-full px-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium truncate">
                    {item.name}
                  </span>
                  <span className="text-xs text-tremor-content">
                    {dataFormatter(item.cantidad)} vendidos
                  </span>
                </div>
                <Badge className="ml-2" color="emerald" size="sm" variant="solid">
                  {currencyFormatter(item.ingresos)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </ScrollShadow>
    )}
  </div>
</Card>


      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        static={true}
        className="z-[100]"
      >
        <DialogPanel className="overflow-hidden p-0">
          <div className="border-b border-tremor-border p-4 dark:border-dark-tremor-border">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                Productos
              </p>
              <p className="text-xs font-medium uppercase text-tremor-content dark:text-dark-tremor-content">
                Cantidad / Ingresos
              </p>
            </div>
            <TextInput
              icon={RiSearchLine}
              placeholder="Buscar producto..."
              className="mt-2 rounded-md"
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
          </div>
          <ScrollShadow className="h-72 px-4 pt-4">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div
                  key={item.name}
                  className="relative flex items-center w-full h-20 bg-gray-50 rounded-md overflow-hidden"
                >
                  {/* ProgressBar como fondo */}
                  <ProgressBar
                    value={(item.cantidad / maxCantidad) * 100}
                    className="absolute top-0 left-0 w-full h-full opacity-30"
                    color="blue"
                  />
                  <div className="relative z-10 flex justify-between items-center w-full px-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong truncate">
                        {item.name}
                      </span>
                      <span className="text-xs text-tremor-default dark:text-dark-tremor-content">
                        {dataFormatter(item.cantidad)} vendidos
                      </span>
                    </div>
                    <Badge
                      className="ml-2"
                      color="emerald"
                      size="sm"
                      variant="solid"
                    >
                      {currencyFormatter(item.ingresos)}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="flex h-full items-center justify-center text-sm text-tremor-content-strong dark:text-dark-tremor-content-strong">
                No se encontraron resultados.
              </p>
            )}
          </ScrollShadow>
          <div className="mt-4 border-t border-tremor-border bg-tremor-background-muted p-4 dark:border-dark-tremor-border dark:bg-dark-tremor-background">
            <button
              className="w-full py-2 text-sm font-medium text-tremor-content-strong bg-tremor-background border border-tremor-border rounded-md hover:bg-tremor-background-muted dark:bg-dark-tremor-background dark:border-dark-tremor-border dark:text-dark-tremor-content-strong dark:hover:bg-dark-tremor-background-muted"
              onClick={() => setIsOpen(false)}
            >
              Volver
            </button>
          </div>
        </DialogPanel>
      </Dialog>
    </>
  );
};

export default BarChartHero;