import { Card, CardHeader, CardBody, Divider, Chip, Tooltip, ScrollShadow, Select, SelectItem, Tabs, Tab, Button } from "@heroui/react";
import { ArrowUp, ArrowDown, ShoppingBag, LayoutGrid, Package, Users, TrendingUp, AlertTriangle, Monitor, Info } from "lucide-react";
import { MdDeleteForever } from "react-icons/md";
import useProductSell from "./hooks/product_sell";
import useVentasTotal from "./hooks/ventas_total";
import useDesempenoSucursales from "./hooks/desempeno_sucursal";
import getProductosMenorStock from "./hooks/product_stock";
import { useState, useEffect } from "react";
import axios from "@/api/axios";
import { LineChartComponent } from "./LineChart";
import useNotasPendientes from "./hooks/notas_pendientes";
import NotasPendientesModal from "./NotasPendientesModal";
import { QuickActionsCard } from "./QuickActionsCard";
import { RecentTransactionsTable } from "./RecentTransactionsTable";

// --- Components ---

function StockCard({ productos }) {
  return (
    <Card className="h-full border border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden relative group">
      {/* Background Decorator */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50/50 dark:bg-rose-900/10 rounded-full blur-3xl -z-10 pointer-events-none group-hover:bg-rose-100/60 transition-all duration-500"></div>

      <CardHeader className="flex gap-4 px-6 pt-6 pb-2 z-10">
        <div className="p-3 rounded-xl bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-900/20 dark:to-orange-900/20 border border-rose-100 dark:border-rose-800/30 text-rose-600 dark:text-rose-400 shadow-sm">
          <AlertTriangle size={22} className="drop-shadow-sm" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">Stock Crítico</h2>
          <p className="text-xs text-slate-500 font-medium">Atención requerida en inventario</p>
        </div>
      </CardHeader>

      <Divider className="my-2 bg-slate-100 dark:bg-zinc-800/50 mx-6 w-auto" />

      <CardBody className="px-6 pb-6 pt-2 z-10">
        <ScrollShadow hideScrollBar className="max-h-[300px] w-full pr-2">
          {productos.length > 0 ? (
            <ul className="space-y-3">
              {productos.map((prod, idx) => {
                const urgencyLevel = 6 - Number.parseInt(prod.stock);
                const isCritical = urgencyLevel > 4;
                const isWarning = urgencyLevel > 2 && !isCritical;

                const colorClass = isCritical ? "bg-rose-50 text-rose-700 border-rose-200" : isWarning ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-yellow-50 text-yellow-700 border-yellow-200";
                const dotClass = isCritical ? "bg-rose-500" : isWarning ? "bg-orange-500" : "bg-yellow-500";

                return (
                  <li key={idx} className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/50 border border-transparent hover:border-slate-100 dark:hover:border-zinc-700 transition-all duration-200 group/item">
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="font-semibold text-sm text-slate-700 dark:text-slate-200 truncate group-hover/item:text-blue-600 transition-colors">{prod.nombre}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`w-2 h-2 rounded-full ${dotClass} shadow-sm animate-pulse`}></span>
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                          {isCritical ? "Crítico" : "Bajo"}
                        </span>
                      </div>
                    </div>
                    <Chip
                      size="sm"
                      variant="flat"
                      className={`font-bold border ${colorClass} min-w-[60px] justify-center shadow-sm`}
                    >
                      {prod.stock} und.
                    </Chip>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 bg-slate-50/50 dark:bg-zinc-800/30 rounded-xl border border-dashed border-slate-200 dark:border-zinc-700 mx-2">
              <div className="p-4 bg-white dark:bg-zinc-800 rounded-full shadow-sm mb-3">
                <Package size={28} className="text-emerald-500 opacity-80" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">¡Todo en orden!</p>
              <p className="text-xs">No hay alertas de stock</p>
            </div>
          )}
        </ScrollShadow>
      </CardBody>
    </Card>
  );
}

function PerformanceCard({ sucursales, promedioGeneral }) {
  const colors = ["bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-fuchsia-500"];

  return (
    <Card className="h-full border border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden relative group">
      {/* Background Decorator */}
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-50/50 dark:bg-blue-900/10 rounded-full blur-3xl -z-10 pointer-events-none group-hover:bg-blue-100/60 transition-all duration-500"></div>

      <CardHeader className="flex gap-4 px-6 pt-6 pb-2 z-10">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/30 text-blue-600 dark:text-blue-400 shadow-sm">
          <TrendingUp size={22} className="drop-shadow-sm" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">Rendimiento Sucursales</h2>
          <p className="text-xs text-slate-500 font-medium">Comparativa de ventas</p>
        </div>
      </CardHeader>

      <Divider className="my-2 bg-slate-100 dark:bg-zinc-800/50 mx-6 w-auto" />

      <CardBody className="px-6 pb-6 pt-2 z-10">
        <ScrollShadow hideScrollBar className="max-h-[300px] w-full pr-2">
          {sucursales.length > 0 ? (
            <ul className="space-y-5">
              {sucursales.map((branch, index) => {
                const sales = branch.ventas || branch.sales || 0;
                const maxSales = 15000; // Objetivo demo
                const percent = Math.min((sales / maxSales) * 100, 100);
                const barColor = colors[index % colors.length];

                return (
                  <li key={index} className="space-y-2 group/bar">
                    <div className="flex justify-between items-end text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${barColor}`}></div>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover/bar:text-blue-600 transition-colors">{branch.nombre || branch.name}</span>
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-xs">S/. {sales.toLocaleString()}</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 dark:bg-zinc-800/50 rounded-full overflow-hidden shadow-inner">
                      <div
                        className={`h-full rounded-full ${barColor} transition-all duration-1000 ease-out relative`}
                        style={{ width: `${percent}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20"></div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 bg-slate-50/50 dark:bg-zinc-800/30 rounded-xl border border-dashed border-slate-200 dark:border-zinc-700 mx-2">
              <Monitor size={32} className="mb-2 opacity-50" />
              <p className="text-sm">Sin datos de ventas</p>
            </div>
          )}
        </ScrollShadow>
        <div className="mt-6 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white dark:from-zinc-800/50 dark:to-zinc-800/30 p-4 rounded-xl border border-slate-100 dark:border-zinc-700/50 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Promedio General</span>
          <span className="text-lg font-black text-slate-800 dark:text-white tracking-tight">S/. {promedioGeneral?.toLocaleString()}</span>
        </div>
      </CardBody>
    </Card>
  );
}

function MetricCard({ icon, title, value, change, isPositive, extra, bgClass, borderColor }) {
  return (
    <Card className={`border border-slate-200 dark:border-zinc-800 shadow-sm rounded-2xl p-4 overflow-hidden relative group hover:shadow-md transition-all duration-300 ${bgClass || 'bg-white dark:bg-zinc-900'}`}>
      <div className="flex flex-col h-full justify-between gap-4">
        <div className="flex justify-between items-start">
          {/* Icon Box */}
          <div className={`p-3 rounded-2xl bg-white dark:bg-zinc-800 border-2 ${borderColor || 'border-slate-50 dark:border-zinc-700'} shadow-sm`}>
            {icon}
          </div>
          {/* Change Pill */}
          {(change || change === 0) && (
            <div className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm ${isPositive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
              {isPositive ? <ArrowUp size={10} strokeWidth={3} /> : <ArrowDown size={10} strokeWidth={3} />}
              {change}
            </div>
          )}
          {extra}
        </div>

        <div>
          {/* Value */}
          <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none mb-2">{value}</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        </div>
      </div>
    </Card>
  )
}

function getPeriodoLabel(tabKey) {
  switch (tabKey) {
    case "24h": return "vs ayer";
    case "semana": return "vs semana ant.";
    case "mes": return "vs mes ant.";
    case "anio": return "vs año ant.";
    default: return "";
  }
}

function useProductosMenorStock(selectedSucursal) {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductos = async () => {
      setLoading(true);
      try {
        const params = { sucursal: selectedSucursal };
        Object.keys(params).forEach(key => { if (!params[key]) delete params[key]; });
        const { productos: productosApi } = await getProductosMenorStock(params);
        setProductos(productosApi || []);
      } catch (error) { setProductos([]); }
      finally { setLoading(false); }
    };
    fetchProductos();
  }, [selectedSucursal]);

  return { productos, loading };
}

function Inicio() {
  const [selectedTab, setSelectedTab] = useState("24h");
  const [selectedSucursal, setSelectedSucursal] = useState("");
  const [sucursales, setSucursales] = useState([]);
  const [modalNotasOpen, setModalNotasOpen] = useState(false);

  const { productos: productosMenorStock } = useProductosMenorStock(selectedSucursal);
  const { sucursales: sucursalesDesempeno, promedioGeneral } = useDesempenoSucursales(selectedTab, selectedSucursal);

  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        const response = await axios.get("/dashboard/sucursales");
        setSucursales(response.data?.data || []);
      } catch (error) { console.error(error); }
    };
    fetchSucursales();
  }, []);

  const { totalProductsSold, percentageChange: percentageChangeProducts } = useProductSell(selectedTab, selectedSucursal);
  const { ventasTotal, ventasAnterior, percentageChange, totalRegistros } = useVentasTotal(selectedTab, selectedSucursal);
  const cambioNuevosClientes = ventasAnterior > 0 ? ((totalRegistros - ventasAnterior) / ventasAnterior) * 100 : (totalRegistros > 0 ? 100 : 0);

  const { cantidadPendientes, totalNotas, notasPendientes, refetchNotasPendientes } = useNotasPendientes({ idSucursal: selectedSucursal });
  const porcentajePendientes = totalNotas > 0 ? (cantidadPendientes / totalNotas) * 100 : 0;
  const periodoLabel = getPeriodoLabel(selectedTab);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#09090b] p-4 md:p-8 font-inter">
      <div className="max-w-[1920px] mx-auto space-y-8">

        {/* Header Dashboard */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200 dark:border-zinc-800">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">Panel Principal</h1>
            <p className="text-slate-500 font-medium text-base">Visión general del rendimiento de tu negocio.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <Select
              placeholder="Todas las sucursales"
              selectedKeys={selectedSucursal ? [selectedSucursal] : []}
              onSelectionChange={(k) => setSelectedSucursal(Array.from(k)[0] || "")}
              className="w-full sm:w-56"
              size="sm"
              variant="faded"
              startContent={<Monitor size={16} className="text-slate-500" />}
              classNames={{
                trigger: "bg-white dark:bg-zinc-900 shadow-sm border border-slate-200 dark:border-zinc-700 h-10 rounded-xl",
                value: "text-slate-700 dark:text-slate-200"
              }}
            >
              {sucursales.map((s) => <SelectItem key={s.id.toString()} value={s.id.toString()}>{s.nombre}</SelectItem>)}
            </Select>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl p-1 shadow-sm flex items-center">
              <Tabs
                selectedKey={selectedTab}
                onSelectionChange={setSelectedTab}
                color="primary"
                variant="light"
                radius="lg"
                classNames={{
                  tabList: "gap-1",
                  tab: "h-8 px-3 text-xs font-medium",
                  cursor: "shadow-sm bg-blue-500 text-white"
                }}
              >
                <Tab key="24h" title="24H" />
                <Tab key="semana" title="Semana" />
                <Tab key="mes" title="Mes" />
                <Tab key="anio" title="Año" />
              </Tabs>
            </div>

            {selectedSucursal && (
              <Tooltip content="Limpiar filtros">
                <Button isIconOnly color="danger" variant="flat" size="sm" onClick={() => setSelectedSucursal("")} className="rounded-xl">
                  <MdDeleteForever size={18} />
                </Button>
              </Tooltip>
            )}
          </div>
        </header>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard
            icon={<ShoppingBag size={24} className="text-blue-600" />}
            title="Ventas Totales"
            value={`S/. ${ventasTotal}`}
            change={`${percentageChange > 0 ? "+" : ""}${percentageChange.toFixed(1)}%`}
            isPositive={percentageChange >= 0}
            bgClass="bg-blue-50/50 dark:bg-blue-900/10"
            borderColor="border-blue-100 dark:border-blue-900/30"
          />
          <MetricCard
            icon={<Users size={24} className="text-violet-600" />}
            title="Nuevos Clientes"
            value={totalRegistros}
            change={`${cambioNuevosClientes > 0 ? "+" : ""}${cambioNuevosClientes.toFixed(1)}%`}
            isPositive={cambioNuevosClientes >= 0}
            bgClass="bg-violet-50/50 dark:bg-violet-900/10"
            borderColor="border-violet-100 dark:border-violet-900/30"
          />
          <MetricCard
            icon={<Package size={24} className="text-emerald-600" />}
            title="Productos Vendidos"
            value={totalProductsSold}
            change={`${percentageChangeProducts > 0 ? "+" : ""}${percentageChangeProducts.toFixed(1)}%`}
            isPositive={percentageChangeProducts >= 0}
            bgClass="bg-emerald-50/50 dark:bg-emerald-900/10"
            borderColor="border-emerald-100 dark:border-emerald-900/30"
          />
          <MetricCard
            icon={<LayoutGrid size={24} className="text-rose-600" />}
            title="Notas Pendientes"
            value={cantidadPendientes}
            // change={cantidadPendientes === 0 ? "Al día" : `${cantidadPendientes} pendientes`}
            // isPositive={cantidadPendientes === 0} 
            extra={cantidadPendientes === 0 ? (
              <div className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-sm bg-emerald-50 text-emerald-600 border-emerald-100">
                <ArrowUp size={10} /> Al día
              </div>
            ) : (
              <Tooltip content="Ver pendientes">
                <div className="cursor-pointer flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-sm bg-rose-50 text-rose-600 border-rose-100" onClick={() => setModalNotasOpen(true)}>
                  <Info size={12} /> Pendientes
                </div>
              </Tooltip>
            )
            }
            bgClass="bg-rose-50/50 dark:bg-rose-900/10"
            borderColor="border-rose-100 dark:border-rose-900/30"
          />
        </div>

        {/* Charts and Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto">
          <div className="lg:col-span-2 flex flex-col gap-6 h-full">
            <LineChartComponent sucursal={selectedSucursal} />
            <div className="flex-1 min-h-[300px]">
              <RecentTransactionsTable className="h-full" />
            </div>
          </div>
          <div className="space-y-5 flex flex-col h-full">
            <div className="shrink-0"> {/* Quick Actions - Compact */}
              <QuickActionsCard />
            </div>
            <div className="flex-1 min-h-[200px]">
              <StockCard productos={productosMenorStock} />
            </div>
            <div className="flex-1 min-h-[200px]">
              <PerformanceCard sucursales={sucursalesDesempeno} promedioGeneral={promedioGeneral} />
            </div>
          </div>

          <NotasPendientesModal
            open={modalNotasOpen}
            onClose={() => setModalNotasOpen(false)}
            notas={notasPendientes}
            refetchNotas={refetchNotasPendientes}
          />

        </div>
      </div>
    </div>
  );
}

export default Inicio;