import React from "react";
import { CardComponent } from "@/components/Cards/Card";
import useVentasData from "../data/data_soles";
import useProductosVendidos from "../data/data_prod";
import useProductoTop from "../data/data_top";
import { RiCashFill, RiTShirt2Line, RiLineChartFill } from "@remixicon/react";

const SalesCard = ({ idSucursal }) => {
  const { totalRecaudado } = useVentasData(idSucursal);
  const { totalProductosVendidos } = useProductosVendidos(idSucursal);
  const { productoTop, loading, error } = useProductoTop(idSucursal);

  return (
    <div className="container mx-auto px-4 mb-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CardComponent
          titleCard="Ventas totales"
          contentCard={`S/. ${totalRecaudado}`}
          color="green"
          icon={RiCashFill}
          tooltip="Dinero recaudado"
          className="w-full h-32 sm:h-40 md:h-48 lg:h-56 xl:h-64 sm:w-72 md:w-96 lg:w-full"
        />

        <CardComponent
          titleCard="Productos vendidos"
          contentCard={`${totalProductosVendidos}`}
          color="purple"
          icon={RiTShirt2Line}
          tooltip="Productos vendidos"
          className="w-full h-32 sm:h-40 md:h-48 lg:h-56 xl:h-64 sm:w-72 md:w-96 lg:w-full"
        />

        <CardComponent
          titleCard="Producto más vendido"
          contentCard={
            loading
              ? "Cargando..."
              : error
              ? `Error: ${error}`
              : productoTop?.descripcion || "No disponible"
          }
          color="blue"
          icon={RiLineChartFill}
          tooltip="Producto más vendido"
          className="w-full h-32 sm:h-40 md:h-48 lg:h-56 xl:h-64 sm:w-72 md:w-96 lg:w-full"
        />
      </div>
    </div>
  );
};

export default SalesCard;
