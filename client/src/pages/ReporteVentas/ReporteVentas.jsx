import React from "react";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import { DateRangePicker } from "@nextui-org/date-picker";
import { Input } from "@nextui-org/input";
import { Divider } from "@nextui-org/react";
import { Select } from "@nextui-org/react";
import { Tabs, Tab } from "@nextui-org/react";
import "./ReporteVentas.css";
import { ButtonSearch, ButtonDownload } from "@/components/Buttons/Buttons";
import { ButtonDesplegable, ButtonFilter } from "../../components/Buttons/Buttons";

const ReporteVentas = () => {
  const variants = ["underlined"];
  return (
    <div>
      <Breadcrumb
        paths={[
          { name: "Inicio", href: "/inicio" },
          { name: "Ventas", href: "/ventas" },
          { name: "Reporte", href: "/ventas/reporte_venta" },
        ]}
      />
      <hr className="mb-4" />
      <div className="max-w-md">
        <div className="space-y-1">
          <h3 className="text-xl font-bold" style={{ fontSize: "24px" }}>
            Reporte de Ventas Totales
            
          </h3>
          <p className="text-small text-default-400">
            Visualiza el reporte de ventas por tienda
          </p>
        </div>
        
        <Divider className="my-3" />
      </div>
      
      <div className="container-rv">
        <div className="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0 relative">
          {variants.map((variant) => (
            <Tabs key={variant} variant={variant} aria-label="Tabs variants">
              <Tab key="all" title="@Todos" />
              <Tab key="arica1" title="Tienda Arica1" />
              <Tab key="arica2" title="Tienda Arica2" />
              <Tab key="arica3" title="Tienda Arica3" />
              <Tab key="balta" title="Tienda Balta" />
            </Tabs>
          ))}
        </div>
      </div>
      <div
        className="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0 relative"
        style={{ gap: "10px" }}
      >
        <Input
          type="email"
          label="Nombre/Razón Social"
          defaultValue="Davist Bustamante"
          className="w-18"
        />
        <div className="input-wrapper flex gap-2">
          <DateRangePicker label="Selecciona el mes y año" className="w-xs" />
        </div>
        <div className="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0 relative">
          <Select
            label="Almacen"
            placeholder="Selecciona un almacen"
            options={["Factura", "Boleta", "Ticket"]}
            className="max-w-xs"
            style={{ width: "200px" }}
          />
        </div>

        <div className="flex-grow"></div>
        <div className="flex gap-4 mt-2 justify-end items-center">
          <ButtonSearch />
          <ButtonDesplegable />
        </div>
      </div>
    </div>
  );
};

export default ReporteVentas;
