import React, { useState, useEffect } from "react";
import axios from "@/api/axios";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import { Divider, Tabs, Tab, Spinner, Select, SelectItem, Button, ScrollShadow, Tooltip } from "@heroui/react";
import TablaGanancias from "./ComponentsReporte/Overview";
import CategoriaProducto from "./ComponentsReporte/CategoriaProducto";
import KPIS from "./ComponentsReporte/KPIS";
import Comparativa from "./ComponentsReporte/Comparativa";
import TendenciaVentas from "./ComponentsReporte/TendenciaVentas";
import TopProductosMargen from "./ComponentsReporte/TopProductosMargen";
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
      <div className="min-h-screen py-6 px-2 sm:px-6 print:p-0 print:bg-white">
        <div className="max-w-[1600px] mx-auto space-y-4 print:space-y-4">

          {/* Compact Header */}
          <div className="print:hidden">
            <h1 className="font-extrabold text-3xl text-blue-900 dark:text-blue-100 tracking-tight mb-1">
              Reporte de Ventas
            </h1>
            <p className="text-sm text-blue-700/80 dark:text-blue-300/80 mb-3">
              Analiza el rendimiento de ventas y productos por sucursal.
            </p>

            {/* Tabs and Actions in one row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 mb-3">
              <div className="bg-white/90 dark:bg-[#18192b] rounded-xl shadow-sm border border-blue-100 dark:border-zinc-700 p-2 flex-1">
                {/* Evita desbordes en móvil con scroll horizontal */}
                <div className="overflow-x-auto -mx-2 px-2">
                  <Tabs
                    aria-label="Sucursales"
                    selectedKey={selectedTab}
                    onSelectionChange={setSelectedTab}
                    classNames={{
                      tabList: "gap-1 min-w-max",
                      cursor: "bg-blue-50 dark:bg-blue-900/30 rounded-lg",
                      tab: "h-9 px-3 text-blue-600 dark:text-blue-200 data-[selected=true]:text-blue-900 dark:data-[selected=true]:text-blue-100 font-medium text-sm",
                      tabContent: "group-data-[selected=true]:font-bold"
                    }}
                    variant="light"
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
              </div>

              {/* Acciones: Exportar PDF + Excel (SUNAT) con props */}
              <div className="flex items-center gap-3 w-full lg:w-auto">
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-1">
                    <Select
                      className="min-w-[180px] h-8 px-2 text-sm bg-transparent border-none focus:ring-0 text-gray-700 dark:text-gray-200 font-medium cursor-pointer outline-none"
                      selectedKeys={[reportType]}
                      onSelectionChange={(keys) => setReportType(Array.from(keys)[0])}
                      size="sm"
                      variant="bordered"
                    >
                      <SelectItem key="executive" value="executive">Resumen Ejecutivo</SelectItem>
                      <SelectItem key="detailed" value="detailed">Detalle de Operaciones</SelectItem>
                      <SelectItem key="clients" value="clients">Análisis de Clientes</SelectItem>
                    </Select>
                  <div className="h-4 w-[1px] bg-gray-300 dark:bg-zinc-600 mx-1"></div>
                  <ActionButton
                    color="blue"
                    icon={MdToday}
                    onClick={handleExportPdf}
                    size="sm"
                    className="h-8 px-3 font-semibold rounded-md border-0 shadow-none bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-200"
                    style={{ boxShadow: "none", border: "none" }}
                  >
                    PDF
                  </ActionButton>
                </div>
              </div>
            </div>

            {/* Compact Filters */}
            <div className="bg-white/90 dark:bg-[#18192b] rounded-xl shadow-sm border border-blue-100 dark:border-zinc-700 p-2.5">
              {/* Etiqueta */}
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-200 text-xs font-medium mb-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>Filtros:</span>
              </div>

              {/* Contenedor con scroll horizontal para pantallas pequeñas */}
              <div className="overflow-x-auto -mx-1 px-1">
                <div className="grid grid-cols-[repeat(3,minmax(110px,1fr))] sm:grid-cols-[repeat(5,minmax(110px,1fr))] gap-2 min-w-[380px]">
                  {/* Semana */}
                  <Select
                    className="w-full"
                    isDisabled={!selectedMonth.length}
                    placeholder="Semana"
                    selectedKeys={selectedWeek}
                    onSelectionChange={(keys) => setSelectedWeek(Array.from(keys))}
                    classNames={{
                      trigger: "bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 h-8",
                      value: "text-xs"
                    }}
                    size="sm"
                    variant="bordered"
                  >
                    <SelectItem key="all" value="all">Todo el mes</SelectItem>
                    {weeks.map((week) => (
                      <SelectItem key={week} value={week}>{week}</SelectItem>
                    ))}
                  </Select>

                  {/* Mes */}
                  <Select
                    className="w-full"
                    placeholder="Mes"
                    selectedKeys={selectedMonth}
                    onSelectionChange={(keys) => {
                      setSelectedMonth(Array.from(keys));
                      setSelectedWeek([]);
                    }}
                    classNames={{
                      trigger: "bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 h-8",
                      value: "text-xs"
                    }}
                    size="sm"
                    variant="bordered"
                  >
                    {months.map((month) => (
                      <SelectItem key={month.key} value={month.key}>{month.name}</SelectItem>
                    ))}
                  </Select>

                  {/* Año */}
                  <Select
                    className="w-full"
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
                      trigger: "bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 h-8",
                      value: "text-xs"
                    }}
                    size="sm"
                    variant="bordered"
                  >
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </Select>

                  {/* Limpiar */}
                  <Tooltip content="Limpiar filtros" placement="top">
                    <Button
                      isIconOnly
                      variant="flat"
                      onPress={handleClearFilters}
                      className="h-8 w-full rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-900/20 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition"
                      size="sm"
                    >
                      <MdClear className="text-base" />
                    </Button>
                  </Tooltip>

                  {/* Hoy */}
                  <Tooltip content="Ir a hoy" placement="top">
                    <Button
                      isIconOnly
                      variant="flat"
                      onPress={handleTodayFilters}
                      className="h-8 w-full rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition"
                      size="sm"
                    >
                      <MdToday className="text-base" />
                    </Button>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>

          {/* KPIS */}
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

          {/* Tendencia de Ventas */}
          <div className="w-full print:break-inside-avoid">
            <TendenciaVentas
              year={selectedYear[0] || undefined}
              month={selectedMonth[0] || undefined}
              week={selectedWeek.length && selectedWeek[0] !== "all" ? selectedWeek[0] : undefined}
            />
          </div>

          {/* Desglose Detallado - Grid con altura uniforme */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 print:grid-cols-2 print:gap-4">
            <div className="flex print:break-inside-avoid">
              <TablaGanancias
                idSucursal={selectedTab !== "todas" ? selectedTab : null}
                year={selectedYear[0] || undefined}
                month={selectedMonth[0] || undefined}
                week={selectedWeek.length && selectedWeek[0] !== "all" ? selectedWeek[0] : undefined}
              />
            </div>

            <div className="flex print:break-inside-avoid">
              <CategoriaProducto
                idSucursal={selectedTab !== "todas" ? selectedTab : null}
                year={selectedYear[0] || undefined}
                month={selectedMonth[0] || undefined}
                week={selectedWeek.length && selectedWeek[0] !== "all" ? selectedWeek[0] : undefined}
              />
            </div>

            <div className="flex print:break-inside-avoid">
              <TopProductosMargen
                year={selectedYear[0] || undefined}
                month={selectedMonth[0] || undefined}
                week={selectedWeek.length && selectedWeek[0] !== "all" ? selectedWeek[0] : undefined}
              />
            </div>
          </div>

          {/* Comparativa */}
          <div className="w-full print:break-inside-avoid">
            <Comparativa
              idSucursal={selectedTab !== "todas" ? selectedTab : null}
            />
          </div>
        </div>
      </div>
    </ScrollShadow>
  );
};

export default ReporteVentas;