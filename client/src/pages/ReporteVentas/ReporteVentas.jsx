import React, { useState } from "react";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import { SlOptionsVertical } from "react-icons/sl";
import { LuRefreshCcw } from "react-icons/lu";
import { AiOutlineCalendar } from "react-icons/ai";
import { Input, Divider, Select, Tabs, Tab } from "@nextui-org/react";
import TablaGanancias from "./ComponentsReporte/Overview";
import "./ReporteVentas.css";
import CategoriaProducto from "./ComponentsReporte/CategoriaProducto";
import KPIS from "./ComponentsReporte/KPIS";
import Comparativa from "./ComponentsReporte/Comparativa";
import DatePicker from "react-datepicker";
import { ButtonSearch } from "@/components/Buttons/Buttons/";
import "react-datepicker/dist/react-datepicker.css";

const ReporteVentas = () => {
  const [ventas, setVentas] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleSearch = () => {
    console.log("Buscando ventas...");
    setVentas([]);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const CustomInput = ({ value, onClick }) => (
    <button
      className="example-custom-input"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        border: "1px solid gray",
        padding: "5px",
        borderRadius: "5px",
      }}
    >
      <AiOutlineCalendar style={{ marginRight: "5px" }} />
      {value}
    </button>
  );

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
                  onClick={handleRefresh}
                  style={{
                    fontSize: "20px",
                    marginRight: "5px",
                    cursor: "pointer",
                    animation: "spin 2s linear infinite",
                  }}
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
            <div className="icon-tormenta" style={{ position: "relative" }}>
              <SlOptionsVertical
                style={{ fontSize: "20px", cursor: "pointer" }}
                onClick={toggleMenu}
              />
              {menuVisible && (
                <div className="menu-tormenta">
                  <ul>
                    <li>Excel Reporte</li>
                  </ul>
                </div>
              )}
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
          <Tabs variant="underlined" aria-label="Tabs variants">
            <Tab key="all" title="@Todos" />
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
          >
            <div
              className="flex-grow"
              style={{ display: "flex", alignItems: "center" }}
            >
              <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
                Selecciona el mes y año
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginLeft: "20px",
                }}
              >
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  className="border-gray-300 rounded-lg shadow-lg bg-white"
                  customInput={<CustomInput />}
                  renderMonthContent={(
                    month,
                    shortMonth,
                    longMonth,
                    day
                  ) => {
                    const fullYear = new Date(day).getFullYear();
                    const tooltipText = `Tooltip for month: ${longMonth} ${fullYear}`;
                    return <span title={tooltipText}>{shortMonth}</span>;
                  }}
                  showMonthYearPicker
                  dateFormat="MM/yyyy"
                  style={{ width: "200px" }}
                />
                <ButtonSearch style={{ marginLeft: "10px" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-grow" style={{ marginBottom: "15px" }}>
        <div className="container-kpis">
          <div className="kpis">
            <KPIS />
          </div>
        </div>
      </div>
      <div
        className="flex-grow container-overview"
        style={{ marginBottom: "30px" }}
      >
        <div className="overview">
          <TablaGanancias />
        </div>
        <div className="categoria">
          <CategoriaProducto />
        </div>
      </div>
      <div className="container-comparativa">
        <div className="comparativa">
          <Comparativa />
        </div>
      </div>
    </div>
  );
};

export default ReporteVentas;
