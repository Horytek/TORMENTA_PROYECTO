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
import useNuevosClientes from "./hooks/nuevos_clientes";
import NotasPendientesModal from "./NotasPendientesModal";
import { QuickActionsCard } from "./QuickActionsCard";
import { RecentTransactionsTable } from "./RecentTransactionsTable";

// --- Components ---

function StockCard({ productos }) {
  return (
    <Card className="h-full border-none shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] dark:shadow-none bg-white dark:bg-zinc-900 dark:border dark:border-zinc-800 rounded-2xl overflow-hidden">
      <CardHeader className="flex justify-between items-center px-5 py-4 border-b border-slate-50 dark:border-zinc-800/50">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">Stock Crítico</h2>
          <p className="text-[10px] text-slate-400 font-medium">Atención requerida</p>
        </div>
        <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
          <AlertTriangle size={14} strokeWidth={2.5} />
        </div>
      </CardHeader>

      <CardBody className="px-0 py-2">
        <ScrollShadow hideScrollBar className="max-h-[300px] w-full">
          {productos.length > 0 ? (
            <div className="w-full">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] text-slate-400 font-semibold bg-slate-50/50 dark:bg-zinc-800/50 uppercase tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="px-5 py-2">Producto</th>
                    <th className="px-4 py-2 text-center">Stock</th>
                    <th className="px-4 py-2 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/50">
                  {productos.map((prod, idx) => {
                    const urgencyLevel = 6 - Number.parseInt(prod.stock);
                    const isCritical = urgencyLevel > 4;
                    const isWarning = urgencyLevel > 2 && !isCritical;

                    return (
                      <tr key={prod.id || prod.codigo || idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 transition-colors cursor-default group">
                        <td className="px-5 py-2.5 max-w-[140px]">
                          <p className="font-semibold text-slate-700 dark:text-slate-200 truncate group-hover:text-blue-600 transition-colors">{prod.nombre}</p>
                          <p className="text-[9px] text-slate-400">{prod.codigo || 'S/C'}</p>
                        </td>
                        <td className="px-4 py-2.5 text-center font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                          {prod.stock}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md ${isCritical ? "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400" :
                            isWarning ? "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400" :
                              "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400"
                            }`}>
                            {isCritical ? "Crítico" : "Bajo"}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 bg-slate-50/30 mx-4 rounded-xl border border-dashed border-slate-100">
              <Package size={24} className="mb-2 opacity-50" />
              <p className="text-xs font-medium">Todo en orden</p>
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
    <Card className="h-full border-none shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] dark:shadow-none bg-white dark:bg-zinc-900 dark:border dark:border-zinc-800 rounded-2xl overflow-hidden">
      <CardHeader className="flex justify-between items-center px-5 py-4 border-b border-slate-50 dark:border-zinc-800/50">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">Rendimiento</h2>
          <p className="text-[10px] text-slate-400 font-medium">Ventas por sucursal</p>
        </div>
        <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
          <TrendingUp size={14} strokeWidth={2.5} />
        </div>
      </CardHeader>

      <CardBody className="px-5 py-4">
        <ScrollShadow hideScrollBar className="max-h-[300px] w-full">
          {sucursales.length > 0 ? (
            <ul className="space-y-4">
              {sucursales.map((branch, index) => {
                const sales = branch.ventas || branch.sales || 0;
                const maxSales = 15000; // Objetivo demo
                const percent = Math.min((sales / maxSales) * 100, 100);
                const barColor = colors[index % colors.length];

                return (
                  <li key={branch.id || branch.nombre || branch.name || index} className="space-y-1.5 group">
                    <div className="flex justify-between items-end text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 transition-colors">{branch.nombre || branch.name}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100 tabular-nums">S/. {sales.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor} transition-all duration-1000 ease-out`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <p className="text-xs">Sin datos</p>
            </div>
          )}
        </ScrollShadow>
        <div className="mt-5 pt-4 border-t border-slate-50 dark:border-zinc-800 flex justify-between items-center">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Promedio</span>
          <span className="text-sm font-bold text-slate-800 dark:text-white tabular-nums">S/. {promedioGeneral?.toLocaleString()}</span>
        </div>
      </CardBody>
    </Card>
  );
}

function MetricCard({ icon, title, value, change, isPositive, extra, variant = "default" }) {
  const variants = {
    default: "text-slate-600 bg-slate-50 dark:text-slate-300 dark:bg-zinc-800",
    success: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20",
    primary: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20",
    secondary: "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20",
    warning: "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20",
  };

  const iconStyle = variants[variant] || variants.default;

  return (
    <Card className="border border-slate-100 dark:border-zinc-800 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] dark:shadow-none dark:bg-zinc-900 rounded-2xl p-6 h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white">
      <div className="flex flex-col justify-between h-full gap-4">

        {/* Header: Icon & Trend */}
        <div className="flex justify-between items-start">
          <div className={`p-3 rounded-xl ${iconStyle} transition-colors`}>
            {icon}
          </div>
          {(change || change === 0) && (
            <Chip
              size="sm"
              variant="flat"
              color={isPositive ? "success" : "danger"}
              classNames={{
                base: "h-6 px-1",
                content: "font-semibold text-[10px] flex items-center gap-1"
              }}
            >
              {isPositive ? <ArrowUp size={10} strokeWidth={3} /> : <ArrowDown size={10} strokeWidth={3} />}
              {change}
            </Chip>
          )}
          {extra}
        </div>

        {/* Content */}
        <div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight tabular-nums mt-2">
            {value}
          </h3>
          <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">
            {title}
          </p>

          {/* Optional Progress Bar for Visual Flair - Minimal */}
          <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1 mt-4 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${isPositive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-zinc-600'} w-2/3`}></div>
          </div>
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
  const { nuevosClientes, percentageChange: cambioNuevosClientes } = useNuevosClientes(selectedTab, selectedSucursal);

  const { cantidadPendientes, totalNotas, notasPendientes, refetchNotasPendientes } = useNotasPendientes({ idSucursal: selectedSucursal });
  const porcentajePendientes = totalNotas > 0 ? (cantidadPendientes / totalNotas) * 100 : 0;
  const periodoLabel = getPeriodoLabel(selectedTab);

  return (
    <div className="w-full font-inter">
      <div className="w-full space-y-8">

        {/* Header Dashboard */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 mt-2">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Panel Principal</h1>
            <p className="text-slate-500 font-medium text-sm">Visión general del rendimiento de tu negocio.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <Select
              placeholder="Todas las sucursales"
              selectedKeys={selectedSucursal ? [selectedSucursal] : []}
              onSelectionChange={(k) => setSelectedSucursal(Array.from(k)[0] || "")}
              className="w-full sm:w-56"
              size="sm"
              variant="flat"
              startContent={<Monitor size={14} className="text-slate-500" />}
              classNames={{
                trigger: "bg-white dark:bg-zinc-900 shadow-sm hover:bg-slate-50 transition-colors h-9 rounded-lg",
                value: "text-slate-600 dark:text-slate-300 font-medium text-xs scale-100"
              }}
            >
              {sucursales.map((s) => <SelectItem key={s.id.toString()} value={s.id.toString()}>{s.nombre}</SelectItem>)}
            </Select>

            <div className="bg-slate-100/50 dark:bg-zinc-800/50 p-1 rounded-lg">
              <Tabs
                selectedKey={selectedTab}
                onSelectionChange={setSelectedTab}
                color="primary"
                variant="light"
                radius="md"
                classNames={{
                  tabList: "gap-0.5",
                  tab: "h-7 px-3 text-[11px] font-semibold text-slate-500",
                  cursor: "bg-white shadow-sm dark:bg-zinc-700",
                  tabContent: "group-data-[selected=true]:text-slate-800 dark:group-data-[selected=true]:text-white"
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
            icon={<ShoppingBag size={22} />}
            title="Ventas Totales"
            value={`S/. ${ventasTotal}`}
            change={`${percentageChange > 0 ? "+" : ""}${percentageChange.toFixed(1)}%`}
            isPositive={percentageChange >= 0}
            variant="success"
          />
          <MetricCard
            icon={<Users size={22} />}
            title="Nuevos Clientes"
            value={nuevosClientes}
            change={`${cambioNuevosClientes > 0 ? "+" : ""}${cambioNuevosClientes.toFixed(1)}%`}
            isPositive={cambioNuevosClientes >= 0}
            variant="primary"
          />
          <MetricCard
            icon={<Package size={22} />}
            title="Productos Vendidos"
            value={totalProductsSold}
            change={`${percentageChangeProducts > 0 ? "+" : ""}${percentageChangeProducts.toFixed(1)}%`}
            isPositive={percentageChangeProducts >= 0}
            variant="secondary"
          />
          <MetricCard
            icon={<LayoutGrid size={22} />}
            title="Notas Pendientes"
            value={cantidadPendientes}
            variant="warning"
            extra={cantidadPendientes === 0 ? (
              <Chip size="sm" color="success" variant="flat" classNames={{ content: "text-[10px] font-bold" }}>Al día</Chip>
            ) : (
              <Tooltip content="Ver pendientes">
                <Chip
                  size="sm"
                  color="danger"
                  variant="flat"
                  className="cursor-pointer"
                  onClick={() => setModalNotasOpen(true)}
                  classNames={{ content: "text-[10px] font-bold flex gap-1 items-center" }}
                >
                  Pendientes
                </Chip>
              </Tooltip>
            )}
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