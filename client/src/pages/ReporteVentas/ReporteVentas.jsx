import React, { useState, useEffect } from "react";
import axios from "@/api/axios";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import { Divider, Tabs, Tab, Spinner, Select, SelectItem, Button, ScrollShadow } from "@heroui/react";
import TablaGanancias from "./ComponentsReporte/Overview";
import CategoriaProducto from "./ComponentsReporte/CategoriaProducto";
import KPIS from "./ComponentsReporte/KPIS";
import Comparativa from "./ComponentsReporte/Comparativa";
import TendenciaVentas from "./ComponentsReporte/TendenciaVentas";
import TopProductosMargen from "./ComponentsReporte/TopProductosMargen";
import { MdClear, MdToday } from "react-icons/md";

const ReporteVentas = () => {
  const [selectedTab, setSelectedTab] = useState("todas");
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const defaultYear = today.getFullYear().toString();
  const defaultMonth = String(today.getMonth() + 1).padStart(2, "0");
  const defaultDay = today.getDate();
  const defaultWeek = `Semana ${Math.ceil(defaultDay / 7)}`;

  const [selectedYear, setSelectedYear] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState([]);

  const years = Array.from({ length: new Date().getFullYear() - 2020 + 1 }, (_, i) => (2020 + i).toString());
  const months = [
    { key: "01", name: "Enero" },
    { key: "02", name: "Febrero" },
    { key: "03", name: "Marzo" },
    { key: "04", name: "Abril" },
    { key: "05", name: "Mayo" },
    { key: "06", name: "Junio" },
    { key: "07", name: "Julio" },
    { key: "08", name: "Agosto" },
    { key: "09", name: "Septiembre" },
    { key: "10", name: "Octubre" },
    { key: "11", name: "Noviembre" },
    { key: "12", name: "Diciembre" },
  ];
  const weeks = ["Semana 1", "Semana 2", "Semana 3", "Semana 4", "Semana 5"];

  // Limpiar todos los filtros (sin selección)
const handleClearFilters = () => {
  setSelectedYear([]);
  setSelectedMonth([]);
  setSelectedWeek([]);
};
  

  // Seleccionar los filtros en base a la fecha actual
const handleTodayFilters = () => {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const diasEnMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const weekNumber = Math.ceil(now.getDate() / 7);
  const maxWeek = Math.ceil(diasEnMes / 7);
  const week = `Semana ${Math.min(weekNumber, maxWeek)}`;

  const validYear = years.includes(year) ? year : "";
  const validMonth = months.some(m => m.key === month) ? month : "";
  const validWeek = weeks.includes(week) ? week : weeks[weeks.length - 1];

  setSelectedYear(validYear ? [validYear] : []);
  setSelectedMonth(validMonth ? [validMonth] : []);
  setSelectedWeek(validWeek ? [validWeek] : []);
};


  // Permite seleccionar programáticamente los filtros (puedes usarla donde quieras)
  const setSelects = (year, month, week) => {
    setSelectedYear(year || "");
    setSelectedMonth(month || "");
    setSelectedWeek(week || "");
  };

  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        const response = await axios.get("/reporte/sucursales");
        if (response.data.code === 1) {
          const filteredSucursales = response.data.data.filter(
            (sucursal) => sucursal.id_sucursal !== 5
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
  <ScrollShadow hideScrollBar className="h-[calc(100vh-40px)] w-full">
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 py-8 px-2 sm:px-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/90 rounded-2xl shadow border border-blue-100 p-8 mb-2">
          <h3 className="text-3xl font-extrabold text-blue-900 mb-1 tracking-tight">Reporte de ventas en sucursales</h3>
          <p className="text-base text-blue-700/80">Visualiza el análisis de ventas y productos de las sucursales.</p>
        </div>

        {/* Filtros */}
        <div className="bg-white/80 rounded-xl shadow-sm border border-blue-100 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <Tabs
              aria-label="Tabs variants"
              selectedKey={selectedTab}
              onSelectionChange={setSelectedTab}
              classNames={{
                tabList: "bg-transparent",
                tab: "text-blue-700 data-[selected=true]:bg-blue-100 data-[selected=true]:text-blue-900 rounded-lg px-4 py-2 font-semibold",
              }}
            >
              <Tab key="todas" title="Todas" />
              {Array.isArray(sucursales) &&
                sucursales.map((sucursal) => (
                  <Tab
                    key={sucursal.id_sucursal}
                    title={sucursal.nombre}
                  />
                ))}
            </Tabs>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {/* Select de semanas */}
            <Select
              className="w-[130px]"
              isDisabled={!selectedMonth.length}
              placeholder="Semana"
              selectedKeys={selectedWeek}
              onSelectionChange={(keys) => setSelectedWeek(Array.from(keys))}
              classNames={{
                trigger: "bg-blue-50 border-blue-200 text-blue-900",
              }}
            >
              <SelectItem key="all" value="all">
                Todo el mes
              </SelectItem>
              {weeks.map((week) => (
                <SelectItem key={week} value={week}>
                  {week}
                </SelectItem>
              ))}
            </Select>
            {/* Select de meses */}
            <Select
              className="w-[130px]"
              placeholder="Mes"
              selectedKeys={selectedMonth}
              onSelectionChange={(keys) => {
                setSelectedMonth(Array.from(keys));
                setSelectedWeek([]);
              }}
              classNames={{
                trigger: "bg-blue-50 border-blue-200 text-blue-900",
              }}
            >
              {months.map((month) => (
                <SelectItem key={month.key} value={month.key}>
                  {month.name}
                </SelectItem>
              ))}
            </Select>
            {/* Select de años */}
            <Select
              className="w-[110px]"
              placeholder="Año"
              selectedKeys={selectedYear}
              onSelectionChange={(keys) => {
                setSelectedYear(Array.from(keys));
                if (!keys.size) {
                  setSelectedMonth([]);
                  setSelectedWeek([]);
                }
              }}
              classNames={{
                trigger: "bg-blue-50 border-blue-200 text-blue-900",
              }}
            >
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </Select>
            {/* Botón limpiar */}
            <Button
              isIconOnly
              variant="flat"
              color="danger"
              onPress={handleClearFilters}
              title="Limpiar filtros"
              className="bg-rose-50 hover:bg-rose-100 text-rose-600"
            >
              <MdClear className="text-xl" />
            </Button>
            {/* Botón hoy */}
            <Button
              isIconOnly
              variant="flat"
              color="primary"
              onPress={handleTodayFilters}
              title="Ir a hoy"
              className="bg-blue-50 hover:bg-blue-100 text-blue-700"
            >
              <MdToday className="text-xl" />
            </Button>
          </div>
        </div>

        {/* KPIS */}
        <div className="mb-2">
          <KPIS
            idSucursal={selectedTab !== "todas" ? selectedTab : null}
            periodoTexto={
              (selectedYear[0] === new Date().getFullYear().toString() &&
                !selectedMonth.length &&
                (!selectedWeek.length || selectedWeek[0] === "all"))
                ? "vs. mes anterior"
                : selectedWeek.length && selectedWeek[0] !== "all"
                ? "vs semana anterior"
                : "vs. mes anterior"
            }
            year={selectedYear[0] || undefined}
            month={selectedMonth[0] || undefined}
            week={selectedWeek.length && selectedWeek[0] !== "all" ? selectedWeek[0] : undefined}
          />
        </div>

        {/* Parte superior: TablaGanancias y CategoriaProducto */}
        <div className="grid grid-cols-1 sm:grid-cols-[3fr_1fr] gap-6">
          <div className="h-full">
            <TablaGanancias
              idSucursal={selectedTab !== "todas" ? selectedTab : null}
              className="p-6 bg-white rounded-xl shadow-sm h-full"
              year={selectedYear[0] || undefined}
              month={selectedMonth[0] || undefined}
              week={selectedWeek.length && selectedWeek[0] !== "all" ? selectedWeek[0] : undefined}
            />
          </div>
          <div className="h-full">
            <CategoriaProducto
              idSucursal={selectedTab !== "todas" ? selectedTab : null}
              className="p-6 bg-white rounded-xl shadow-sm h-full"
              year={selectedYear[0] || undefined}
              month={selectedMonth[0] || undefined}
              week={selectedWeek.length && selectedWeek[0] !== "all" ? selectedWeek[0] : undefined}
            />
          </div>
        </div>

        {/* Parte inferior: TendenciaVentas y TopProductosMargen */}
        <div className="col-span-full grid grid-cols-[3fr_1fr] gap-6">
          <div className="rounded-xl p-1 h-full">
            <TendenciaVentas
              year={selectedYear[0] || undefined}
              month={selectedMonth[0] || undefined}
              week={selectedWeek.length && selectedWeek[0] !== "all" ? selectedWeek[0] : undefined}
            />
          </div>
          <div className="rounded-xl p-1 h-full">
            <TopProductosMargen
              year={selectedYear[0] || undefined}
              month={selectedMonth[0] || undefined}
              week={selectedWeek.length && selectedWeek[0] !== "all" ? selectedWeek[0] : undefined}
            />
          </div>
        </div>

        {/* Comparativa */}
        <div className="grid grid-cols-5 grid-rows-[0.9fr] gap-0">
          <div className="col-start-1 col-end-6 row-start-2 row-end-3 pl-4">
            <Comparativa
              idSucursal={selectedTab !== "todas" ? selectedTab : null}
            />
          </div>
        </div>
      </div>
    </div>
  </ScrollShadow>
);
};

export default ReporteVentas;