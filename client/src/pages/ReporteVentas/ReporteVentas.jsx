import React, { useState } from "react";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import { Divider, Tabs, Tab } from "@nextui-org/react";
import TablaGanancias from "./ComponentsReporte/Overview";
import CategoriaProducto from "./ComponentsReporte/CategoriaProducto";
import KPIS from "./ComponentsReporte/KPIS";
import Comparativa from "./ComponentsReporte/Comparativa";

const ReporteVentas = () => {
  const [selectedTab, setSelectedTab] = useState("todas"); // Estado inicial

  const sucursales = {
    arica1: 3,
    arica2: 2,
    arica3: 1,
    balta: 4,
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
        </div>

        <p
          className="text-small text-default-400"
          style={{
            fontSize: "14px",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          Visualiza el análisis de ventas y productos de las sucursales.
        </p>
      </div>
      <div className="max-w-md">
        <Divider className="my-2" />
      </div>

      <div
        className="container-rv"
        style={{ marginBottom: "10px", marginTop: "17px" }}
      >
        <div className="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0 relative">
          <Tabs
            variant="underlined"
            aria-label="Tabs variants"
            selectedKey={selectedTab}
            onSelectionChange={setSelectedTab}
          >
            <Tab key="todas" title="Todas" />
            <Tab key="arica1" title="Tienda Arica-1" />
            <Tab key="arica2" title="Tienda Arica-2" />
            <Tab key="arica3" title="Tienda Arica-3" />
            <Tab key="balta" title="Tienda Balta" />
          </Tabs>
          <div
            className="element-right"
            style={{
              display: "flex",
              alignItems: "center",
              marginLeft: "auto",
            }}
          ></div>
        </div>
      </div>

      {/* Si la pestaña seleccionada es "todas", no pasamos idSucursal */}
      <KPIS
        idSucursal={selectedTab !== "todas" ? sucursales[selectedTab] : null}
      />

      <div className="flex-grow mb-8 grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-5 sm:grid-areas-[overview_categoria]">
        <div className="sm:grid-area-[overview]">
          <TablaGanancias
            idSucursal={
              selectedTab !== "todas" ? sucursales[selectedTab] : null
            }
          />
        </div>
        <div className="sm:grid-area-[categoria]">
          <CategoriaProducto
            idSucursal={
              selectedTab !== "todas" ? sucursales[selectedTab] : null
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-5 grid-rows-[0.9fr] gap-0">
        <div className="col-start-1 col-end-6 row-start-2 row-end-3">
          <Comparativa
            idSucursal={
              selectedTab !== "todas" ? sucursales[selectedTab] : null
            }
          />
        </div>
      </div>
    </div>
  );
};

export default ReporteVentas;
