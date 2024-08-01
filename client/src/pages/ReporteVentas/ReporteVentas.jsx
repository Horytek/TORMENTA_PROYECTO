import React, { useState } from "react";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import { DateRangePicker } from "@nextui-org/date-picker";
import { SlOptionsVertical } from "react-icons/sl";
import { LuRefreshCcw } from "react-icons/lu";
import { Input, Divider, Select, Tabs, Tab } from "@nextui-org/react";
import TablaGanancias from "./ComponentsReporte/Overview";
import KPIS from "./ComponentsReporte/KPIS";
import "./ReporteVentas.css";

const ReporteVentas = () => {
  const [ventas, setVentas] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOptionSelected, setDeleteOptionSelected] = useState(false);

  const openModal = (ventaId, estadoVenta) => {
    setModalOpen(true);
    console.log(
      `Abriendo modal para venta ID: ${ventaId}, Estado: ${estadoVenta}`
    );
  };

  const handleSearch = () => {
    console.log("Buscando ventas...");
    setVentas([]);
  };

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
      <div className="space-y-1">
        <div className="container-tormenta">
          <div className="title-tormenta">
            <h3
              className="text-xl font-bold"
              style={{
                fontSize: "32px",
                marginBottom: "12px",
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              Reporte de sucursales Tormenta
            </h3>
          </div>
          <div
            className="elements-right"
            style={{
              gap: "70px",
              marginRight: "20px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <div className="icon-tormenta">
                <LuRefreshCcw
                  onClick={handleSearch}
                  style={{ fontSize: "20px", marginRight: "5px" }}
                />
              </div>
              <span
                style={{
                  color: "gray",
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              >
                Recargar datos
              </span>
            </div>
            <div className="icon-tormenta">
              <SlOptionsVertical style={{ fontSize: "20px" }} />
            </div>
          </div>
        </div>

        <p
          className="text-small text-default-400"
          style={{
            fontSize: "14px",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          Visualiza el reporte de ventas por tienda/almacen.
        </p>
      </div>
      <div className="max-w-md">
        <Divider className="my-2" />
      </div>

      <div className="container-rv">
        <div className="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0 relative">
          <Tabs variant="underlined" aria-label="Tabs variants">
            <Tab key="all" title="@Todos" />
            <Tab key="arica1" title="Tienda Arica-1" />
            <Tab key="arica2" title="Tienda Arica-2" />
            <Tab key="arica3" title="Tienda Arica-3" />
            <Tab key="balta" title="Tienda Balta" />
          </Tabs>
        </div>
      </div>

      <div className="flex-grow" style={{ marginBottom: "30px" }}>
        <KPIS />
      </div>
      <div className="flex-grow" style={{ marginBottom: "30px" }}>
        <TablaGanancias />
      </div>
    </div>
  );
};

export default ReporteVentas;
