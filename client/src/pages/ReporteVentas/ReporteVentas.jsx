import React from "react";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import { DateRangePicker } from "@nextui-org/date-picker";
import "./ReporteVentas.css";
import { ButtonSearch, ButtonDownload } from "@/components/Buttons/Buttons";
import { ButtonFilter } from "../../components/Buttons/Buttons";
import ReportesTable from "./ComponentsReporte/ReportesTable";

const ReporteVentas = () => {
  return (
    <div>
      <Breadcrumb
        paths={[
          { name: "Inicio", href: "/inicio" },
          { name: "Ventas", href: "/ventas" },
          { name: "Reporte de ventas", href: "/ventas/reporte_venta" },
        ]}
      />
      <hr className="mb-4" />
      <div className="flex justify-between mt-5 mb-4">
        <h1 className="text-xl font-bold" style={{ fontSize: "36px" }}></h1>
      </div>
      <div
        className="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0 relative"
        style={{ gap: "10px" }}
      >
        <input
          placeholder="Nombre o Razón Social"
          className="border rounded pl-2 py-1 w-48 md:w-60"
        />
        <div className="input-wrapper flex gap-2">
          <DateRangePicker
            className="w-xs"
            classNames={{ inputWrapper: "bg-white" }}
          />
        </div>
        <div className="flex gap-4 mt-2 justify-end items-center">
          <ButtonFilter />
        </div>
        <div className="flex-grow"></div>{" "}
        {/* This will take up remaining space */}
        <div className="flex gap-4 mt-2 justify-end items-center">
          <ButtonSearch />
          <ButtonDownload />
        </div>
      </div>
      <ReportesTable />
        
    </div>
  );
};

export default ReporteVentas;
