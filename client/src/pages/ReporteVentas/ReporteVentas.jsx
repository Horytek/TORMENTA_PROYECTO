import React, { useState, useEffect } from "react";
import axios from "@/api/axios";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import { Divider, Tabs, Tab, Spinner, Select, SelectItem, Button, ScrollShadow, Tooltip } from "@heroui/react";
import TablaGanancias from "./ComponentsReporte/Overview";
import CategoriaProducto from "./ComponentsReporte/CategoriaProducto";
import KPIS from "./ComponentsReporte/KPIS";
import Comparativa from "./ComponentsReporte/Comparativa";
import TendenciaVentas from "./ComponentsReporte/TendenciaVentas";

import { MdClear, MdToday } from "react-icons/md";
import { ActionButton } from "@/components/Buttons/Buttons";
import { exportHtmlToPdf } from '@/utils/pdf/exportHtmlToPdf';
import { getVentasPDF } from '@/services/reporte.services';
import { generateReportePDF } from '@/utils/pdf/ReportePDFGenerator';

const ReporteVentas = () => {
  const [selectedTab, setSelectedTab] = useState("todas");
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState("executive");

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
        //console.error("Error al cargar sucursales:", error);
        setSucursales([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSucursales();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // Derivar rango de fechas según filtros (mes / semana)
  const buildDateRange = () => {
    const year = selectedYear[0];
    const month = selectedMonth[0];
    const week = selectedWeek[0];
    if (!year) return {};
    // Si no hay mes => todo el año
    if (!month) {
      return {
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`
      };
    }
    const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
    // Semana específica
    if (week && week !== 'all') {
      const n = Number(week.replace(/\D+/g, '')) || 1;
      const startDay = (n - 1) * 7 + 1;
      const endDay = Math.min(n * 7, daysInMonth);
      return {
        startDate: `${year}-${month}-${String(startDay).padStart(2, '0')}`,
        endDate: `${year}-${month}-${String(endDay).padStart(2, '0')}`
      };
    }
    // Todo el mes
    return {
      startDate: `${year}-${month}-01`,
      endDate: `${year}-${month}-${String(daysInMonth).padStart(2, '0')}`
    };
  };

  const handleExportPdf = async () => {
    try {
      const { startDate, endDate } = buildDateRange();
      const params = {
        startDate,
        endDate,
        id_sucursal: selectedTab !== 'todas' ? selectedTab : undefined,
        limit: 500
      };
      const data = await getVentasPDF(params); // obtiene ventas filtradas
      const ventas = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);

      const sucursalName = selectedTab !== 'todas'
        ? sucursales.find(s => s.id_sucursal === selectedTab)?.nombre
        : 'Todas las sucursales';

      const html = generateReportePDF(ventas, { startDate, endDate, sucursalName }, reportType);
      await exportHtmlToPdf(html, `reporte_ventas_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      //.error('Error exportando PDF:', e);
      alert('Error al exportar PDF.');
    }
  };


  return (
    <ScrollShadow hideScrollBar className="h-[calc(100vh-40px)] w-full">
      <div className="min-h-screen bg-[#F3F4F6] dark:bg-[#09090b] py-6 px-4 sm:px-6 print:p-0 print:bg-white font-inter">
        <div className="max-w-[1920px] mx-auto space-y-6 print:space-y-4">

          {/* Header & Controls */}
          <div className="flex flex-col gap-6 print:hidden">
            {/* Title & Top Actions */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h1 className="font-extrabold text-3xl text-slate-800 dark:text-white tracking-tight mb-1">
                  Reporte de Ventas
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm max-w-2xl">
                  Analiza el rendimiento de ventas, tendencias y productos por sucursal.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Report Type & PDF Export */}
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 p-1 shadow-sm">
                  <Select
                    className="min-w-[180px]"
                    classNames={{
                      trigger: "bg-transparent shadow-none border-none data-[hover=true]:bg-slate-50",
                      value: "text-slate-700 dark:text-slate-200 font-medium text-sm"
                    }}
                    selectedKeys={[reportType]}
                    onSelectionChange={(keys) => setReportType(Array.from(keys)[0])}
                    size="sm"
                  >
                    <SelectItem key="executive" value="executive">Resumen Ejecutivo</SelectItem>
                    <SelectItem key="detailed" value="detailed">Detalle de Operaciones</SelectItem>
                    <SelectItem key="clients" value="clients">Análisis de Clientes</SelectItem>
                  </Select>
                  <div className="h-5 w-[1px] bg-slate-200 dark:bg-zinc-700 mx-1"></div>
                  <Button
                    isIconOnly
                    variant="light"
                    onPress={handleExportPdf}
                    className="text-slate-500 hover:text-blue-600"
                    size="sm"
                  >
                    <MdToday className="text-xl" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Filters Row: Tabs + Date Selects */}
            <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
              {/* Tabs - Now cleaner without box */}
              <Tabs
                aria-label="Sucursales"
                selectedKey={selectedTab}
                onSelectionChange={setSelectedTab}
                classNames={{
                  tabList: "bg-white dark:bg-zinc-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm gap-2",
                  cursor: "w-full bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20",
                  tab: "h-9 px-4 text-slate-500 dark:text-slate-400 data-[selected=true]:text-white font-semibold text-sm transition-all",
                  tabContent: "group-data-[selected=true]:text-white"
                }}
                variant="light"
              >
                <Tab key="todas" title="Todas las Sucursales" />
                {Array.isArray(sucursales) &&
                  sucursales.map((sucursal) => (
                    <Tab
                      key={sucursal.id_sucursal}
                      title={sucursal.nombre}
                    />
                  ))}
              </Tabs>

              {/* Date Filters - Clean Row */}
              <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-zinc-800 p-1 rounded-xl border border-slate-200 dark:border-zinc-700 shadow-sm">
                {/* Semana */}
                <div className="w-32">
                  <Select
                    placeholder="Semana"
                    selectedKeys={selectedWeek}
                    onSelectionChange={(keys) => setSelectedWeek(Array.from(keys))}
                    isDisabled={!selectedMonth.length}
                    classNames={{
                      trigger: "bg-transparent shadow-none border-none hover:bg-slate-50 h-9",
                      value: "text-xs font-medium"
                    }}
                    size="sm"
                  >
                    <SelectItem key="all" value="all">Todo el mes</SelectItem>
                    {weeks.map((week) => (
                      <SelectItem key={week} value={week}>{week}</SelectItem>
                    ))}
                  </Select>
                </div>
                <div className="w-[1px] h-5 bg-slate-200 dark:bg-zinc-700"></div>

                {/* Mes */}
                <div className="w-32">
                  <Select
                    placeholder="Mes"
                    selectedKeys={selectedMonth}
                    onSelectionChange={(keys) => {
                      setSelectedMonth(Array.from(keys));
                      setSelectedWeek([]);
                    }}
                    classNames={{
                      trigger: "bg-transparent shadow-none border-none hover:bg-slate-50 h-9",
                      value: "text-xs font-medium"
                    }}
                    size="sm"
                  >
                    {months.map((month) => (
                      <SelectItem key={month.key} value={month.key}>{month.name}</SelectItem>
                    ))}
                  </Select>
                </div>
                <div className="w-[1px] h-5 bg-slate-200 dark:bg-zinc-700"></div>

                {/* Año */}
                <div className="w-24">
                  <Select
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
                      trigger: "bg-transparent shadow-none border-none hover:bg-slate-50 h-9",
                      value: "text-xs font-medium"
                    }}
                    size="sm"
                  >
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </Select>
                </div>

                <div className="flex gap-1 ml-1 pl-1 border-l border-slate-200 dark:border-zinc-700">
                  <Tooltip content="Limpiar" closeDelay={0}>
                    <Button isIconOnly size="sm" variant="light" onPress={handleClearFilters} className="text-slate-400 hover:text-rose-500">
                      <MdClear className="text-lg" />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Hoy" closeDelay={0}>
                    <Button isIconOnly size="sm" variant="light" onPress={handleTodayFilters} className="text-slate-400 hover:text-blue-500">
                      <MdToday className="text-lg" />
                    </Button>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>

          {/* KPIS Section */}
          <div className="print:mb-4">
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

          {/* Charts Layout - Optimized 8/4 Split */}
          <div className="grid grid-cols-12 gap-6 w-full">
            {/* Left Column: Primary Charts (Time & Comparison) */}
            <div className="col-span-12 xl:col-span-8 flex flex-col gap-6 print:break-inside-avoid">
              <TendenciaVentas
                year={selectedYear[0] || undefined}
                month={selectedMonth[0] || undefined}
                week={selectedWeek.length && selectedWeek[0] !== "all" ? selectedWeek[0] : undefined}
              />
              <Comparativa
                idSucursal={selectedTab !== "todas" ? selectedTab : null}
              />
            </div>

            {/* Right Column: Secondary Metrics (Distribution, Rankings, Summary) */}
            <div className="col-span-12 xl:col-span-4 flex flex-col gap-6 print:break-inside-avoid">
              <TablaGanancias
                idSucursal={selectedTab !== "todas" ? selectedTab : null}
                year={selectedYear[0] || undefined}
                month={selectedMonth[0] || undefined}
                week={selectedWeek.length && selectedWeek[0] !== "all" ? selectedWeek[0] : undefined}
              />

              <CategoriaProducto
                idSucursal={selectedTab !== "todas" ? selectedTab : null}
                year={selectedYear[0] || undefined}
                month={selectedMonth[0] || undefined}
                week={selectedWeek.length && selectedWeek[0] !== "all" ? selectedWeek[0] : undefined}
              />
            </div>
          </div>
        </div>
      </div>
    </ScrollShadow>
  );
};

export default ReporteVentas;