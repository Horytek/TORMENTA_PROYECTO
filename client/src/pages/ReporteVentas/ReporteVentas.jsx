import React, { useState, useEffect } from "react";
import axios from "@/api/axios";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import { Divider, Tabs, Tab, Spinner } from "@nextui-org/react";
import TablaGanancias from "./ComponentsReporte/Overview";
import CategoriaProducto from "./ComponentsReporte/CategoriaProducto";
import KPIS from "./ComponentsReporte/KPIS";
import Comparativa from "./ComponentsReporte/Comparativa";

const ReporteVentas = () => {
  const [selectedTab, setSelectedTab] = useState("todas");
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        const response = await axios.get('/reporte/sucursales');
        if (response.data.code === 1) {
          const filteredSucursales = response.data.data.filter(
            sucursal => sucursal.id_sucursal !== 5
          );
          setSucursales(filteredSucursales || []);
        }
      } catch (error) {
        console.error("Error al cargar sucursales:", error);
        setSucursales([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSucursales();
  }, []);

  return (
    <div>
      <Breadcrumb
        paths={[
          { name: "Inicio", href: "/inicio" },
          { name: "Ventas", href: "/ventas" },
          { name: "Reporte", href: "/reportes" },
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
              Reporte de ventas en sucursales
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
          {loading ? (
            <Spinner />
          ) : (
            <Tabs
              variant="underlined"
              aria-label="Tabs variants"
              selectedKey={selectedTab}
              onSelectionChange={setSelectedTab}
            >
              <Tab key="todas" title="Todas" />
              {Array.isArray(sucursales) && sucursales.map((sucursal) => (
                <Tab 
                  key={sucursal.id_sucursal} 
                  title={sucursal.nombre} // Changed from nombre_sucursal to nombre
                />
              ))}
            </Tabs>
          )}
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
        idSucursal={selectedTab !== "todas" ? selectedTab : null}
      />

      <div className="flex-grow mb-8 grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-5 sm:grid-areas-[overview_categoria]">
        <div className="sm:grid-area-[overview]">
          <TablaGanancias
            idSucursal={
              selectedTab !== "todas" ? selectedTab : null
            }
          />
        </div>
        <div className="sm:grid-area-[categoria]">
          <CategoriaProducto
            idSucursal={
              selectedTab !== "todas" ? selectedTab : null
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-5 grid-rows-[0.9fr] gap-0">
        <div className="col-start-1 col-end-6 row-start-2 row-end-3">
          <Comparativa
            idSucursal={
              selectedTab !== "todas" ? selectedTab : null
            }
          />
        </div>
      </div>
    </div>
  );
};

export default ReporteVentas;
