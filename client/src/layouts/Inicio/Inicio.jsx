import { Modal, ModalContent, ModalHeader, ModalFooter, ModalBody, Card, CardHeader, CardBody, Avatar, Button, Divider, Chip, Tooltip, ScrollShadow } from "@heroui/react";
import { ArrowUp,ArrowDown, ShoppingBag, LayoutGrid, Package, Users, TrendingUp, AlertTriangle } from "lucide-react";
import { RiShoppingBag4Line } from "@remixicon/react";
import { LuShirt } from "react-icons/lu";
import { MdDeleteForever } from "react-icons/md";
import { TiStarburstOutline } from "react-icons/ti";
import { Tabs, Tab, Select, SelectItem } from "@heroui/react";
import useProductSell from "./hooks/product_sell";
import useVentasTotal from "./hooks/ventas_total";
import useDesempenoSucursales from "./hooks/desempeno_sucursal";
import getProductosMenorStock from "./hooks/product_stock";
import { useState, useEffect } from "react";
import axios from "@/api/axios";
import { LineChartComponent } from "./LineChart";
import useNotasPendientes from "./hooks/notas_pendientes";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FaExchangeAlt, FaTrashAlt, FaPlusCircle } from "react-icons/fa";
  // Importa las funciones de registro y anulación
  // (Asegúrate de que las rutas sean correctas en tu proyecto)
import { useNavigate } from "react-router-dom";
import { Info } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import NotasPendientesModal from "./NotasPendientesModal";
import { useUserStore } from "@/store/useStore";
// Card para productos con menor stock
function StockCard({ productos }) {
  return (
    <Card
      className="relative overflow-hidden rounded-2xl shadow-xl
                 bg-white/95 dark:bg-[#151722]/95 backdrop-blur-md
                 border border-rose-100/70 dark:border-rose-900/30
                 transition-all flex flex-col h-full min-h-[340px]"
    >
      <div className="absolute inset-0 pointer-events-none">
        {/* Halos SOLO modo claro (se reducen un poco) */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-100/50 to-pink-200/30 rounded-full blur-2xl dark:hidden"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-orange-100/35 to-red-100/25 rounded-full blur-xl dark:hidden"></div>

        {/* Nueva capa unificada para dark (sin mancha blanca) */}
        <div className="hidden dark:block absolute inset-0 opacity-100 mix-blend-normal
          bg-[radial-gradient(circle_at_82%_28%,rgba(236,72,153,0.18),transparent_58%),radial-gradient(circle_at_18%_85%,rgba(244,63,94,0.14),transparent_62%),radial-gradient(circle_at_50%_50%,rgba(88,34,54,0.10),transparent_70%),linear-gradient(150deg,rgba(244,63,94,0.07),rgba(190,24,93,0.04)_38%,transparent_75%)]">
        </div>

        {/* Textura sutil y borde interior */}
        <div className="hidden dark:block absolute inset-0 opacity-[0.07] mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEiIGhlaWdodD0iMSIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIwLjA1Ii8+PC9zdmc+')]"></div>
        <div className="hidden dark:block absolute inset-0 ring-1 ring-white/5 rounded-2xl"></div>
      </div>

      <CardHeader className="flex items-center gap-3 mb-1 bg-transparent relative z-10">
        <div className="p-2 rounded-lg bg-gradient-to-br from-rose-400/85 to-pink-500/85 shadow">
          <AlertTriangle className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Stock Crítico</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Productos con menor stock (filtrado)
          </p>
        </div>
      </CardHeader>

      <CardBody className="py-3 px-4 flex-1 flex flex-col relative z-10">
        <span className="text-[11px] text-rose-600 dark:text-rose-400 mb-2 font-medium">
          * Se actualiza en tiempo real (solo filtra por sucursal)
        </span>
        <ScrollShadow hideScrollBar className="flex-1 min-h-[120px] max-h-[220px]">
          {/* ...existing list rendering... */}
          {productos.length > 0 ? (
            <ul className="divide-y divide-rose-50 dark:divide-rose-900/35">
              {productos.map((prod, idx) => {
                const key = prod.id ? prod.id : `${prod.nombre}-${idx}`;
                const urgencyLevel = 6 - Number.parseInt(prod.stock);
                const urgencyColor =
                  urgencyLevel > 4
                    ? "bg-red-500/70"
                    : urgencyLevel > 2
                    ? "bg-orange-400/70"
                    : "bg-yellow-400/70";
                const chipColor =
                  urgencyLevel > 4
                    ? "danger"
                    : urgencyLevel > 2
                    ? "warning"
                    : "success";
                return (
                  <li key={key} className="py-2 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {prod.nombre}
                        </span>
                        <Chip
                          color={chipColor}
                          variant="flat"
                          className="font-bold text-xs px-2 py-0.5 backdrop-blur-sm dark:bg-zinc-800/50"
                        >
                          {prod.stock} und.
                        </Chip>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-block w-2 h-2 rounded-full ${urgencyColor}`}></span>
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">
                          {Number(prod.stock) <= 3
                            ? "Muy bajo"
                            : Number(prod.stock) <= 5
                            ? "Bajo"
                            : "Moderado"}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-6 text-center bg-white/60 dark:bg-zinc-800/50 rounded-xl border border-transparent dark:border-white/5">
              <p className="text-zinc-500 dark:text-zinc-400">
                No hay productos con stock crítico en esta sucursal
              </p>
            </div>
          )}
        </ScrollShadow>
      </CardBody>
    </Card>
  );
}

function getPeriodoLabel(tabKey) {
  switch (tabKey) {
    case "24h":
      return "desde ayer";
    case "semana":
      return "vs. semana anterior";
    case "mes":
      return "vs. mes anterior";
    case "anio":
      return "vs. año anterior";
    default:
      return "";
  }
}


// Card para desempeño de sucursales
function PerformanceCard({ sucursales, promedioGeneral }) {
  const gradients = [
    "from-blue-500 via-blue-600 to-indigo-600",
    "from-purple-500 via-violet-600 to-purple-600",
    "from-emerald-500 via-green-600 to-teal-600",
  ];
  return (
    <Card className="relative overflow-hidden rounded-2xl shadow-xl bg-white/95 dark:bg-[#151a26]/95 backdrop-blur-md border border-blue-100/60 dark:border-blue-900/35 transition-all flex flex-col h-full min-h-[340px]">
      <div className="absolute inset-0 pointer-events-none">
        {/* Claro */}
        <div className="absolute -top-6 -left-6 w-28 h-28 bg-gradient-to-br from-blue-400/25 to-indigo-600/15 rounded-full blur-2xl dark:hidden"></div>
        <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-gradient-to-tr from-cyan-400/25 to-blue-500/15 rounded-full blur-xl dark:hidden"></div>

        {/* Dark refinado sin hotspot */}
        <div className="hidden dark:block absolute inset-0 bg-[radial-gradient(circle_at_78%_30%,rgba(56,189,248,0.16),transparent_55%),radial-gradient(circle_at_18%_85%,rgba(99,102,241,0.18),transparent_60%),linear-gradient(155deg,rgba(37,99,235,0.10),rgba(30,64,175,0.05)_55%,transparent_82%)]"></div>
        <div className="hidden dark:block absolute inset-0 opacity-[0.07] mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEiIGhlaWdodD0iMSIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIwLjA1Ii8+PC9zdmc+')]"></div>
        <div className="hidden dark:block absolute inset-0 ring-1 ring-white/5 rounded-2xl"></div>
      </div>

      <CardHeader className="flex items-center gap-3 mb-1 bg-transparent relative z-10">
        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Rendimiento</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Ventas por sucursal en el periodo seleccionado
          </p>
        </div>
      </CardHeader>
      <CardBody className="py-3 px-4 flex-1 flex flex-col relative z-10">
        <span className="text-[11px] text-blue-600 dark:text-blue-400 mb-2 font-medium">
          * Se actualiza en tiempo real (solo filtra por sucursal y tiempo)
        </span>
        {/* ...existing list and footer content sin cambios... */}
        <ScrollShadow hideScrollBar className="flex-1 min-h-[120px] max-h-[220px]">
          {sucursales.length > 0 ? (
            <ul className="divide-y divide-blue-50 dark:divide-blue-900/35">
              {sucursales.map((branch, index) => {
                const salesValue = branch.ventas || branch.sales || 0;
                const maxSales = 15000;
                const percentage = (Number(salesValue) / maxSales) * 100;
                return (
                  <li key={branch.nombre || branch.name} className="py-2 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${gradients[index % gradients.length]} shadow`}></span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                            {branch.nombre || branch.name}
                          </span>
                        </div>
                        <Chip color="primary" variant="flat" className="font-bold text-xs px-2 py-0.5 dark:bg-zinc-800/50">
                          S/. {(branch.ventas || branch.sales || 0).toLocaleString()}
                        </Chip>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">{Math.round(percentage)}% del objetivo</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-6 text-center bg-white/60 dark:bg-zinc-800/55 rounded-xl border border-transparent dark:border-white/5">
              <p className="text-zinc-500 dark:text-zinc-400">No hay datos disponibles para esta sucursal</p>
            </div>
          )}
        </ScrollShadow>
        <div className="flex items-center justify-between mt-5 p-2 rounded-xl bg-gradient-to-r from-zinc-100/80 to-zinc-50/80 dark:from-zinc-800/75 dark:to-zinc-700/70 backdrop-blur-sm border border-white/40 dark:border-zinc-600/40">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">Promedio general</span>
          <Chip color="success" variant="flat" className="font-bold text-xs px-3 py-1 dark:bg-zinc-800/60">
            S/. {promedioGeneral?.toLocaleString()}
          </Chip>
        </div>
      </CardBody>
    </Card>
  );
}

function useProductosMenorStock(selectedSucursal) {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductos = async () => {
      setLoading(true);
      try {
        const params = {
          sucursal: selectedSucursal,
        };
        // Elimina filtros vacíos
        Object.keys(params).forEach(key => {
          if (!params[key]) delete params[key];
        });
        const { productos: productosApi } = await getProductosMenorStock(params);
        setProductos(productosApi || []);
      } catch (error) {
        setProductos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProductos();
  }, [selectedSucursal]);

  return { productos, loading };
}

function MetricCard({ icon, title, value, change, gradient, iconColor, borderColor, periodoLabel }) {
  const isPositive = typeof change === "string"
    ? change.replace("%", "").replace("+", "").trim() !== "" && !change.startsWith("-")
    : change >= 0;

  const esNotasPendientes = title === "Notas Pendientes";

  return (
    <Card
      className={`overflow-hidden border ${borderColor} bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm`}
    >
      <CardBody className="p-6 relative">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50`}></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${iconColor} shadow-lg`}>{icon}</div>
            {!esNotasPendientes && (
              <div className={`flex items-center text-xs font-medium ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"} bg-white/80 dark:bg-zinc-800/80 px-2 py-1 rounded-full backdrop-blur-sm`}>
                {isPositive ? (
                  <ArrowUp className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDown className="h-3 w-3 mr-1" />
                )}
                {change}
                <span className="text-zinc-500 dark:text-zinc-400 ml-1">{periodoLabel}</span>
              </div>
            )}
            {esNotasPendientes && change && (
              <div className={`flex items-center text-xs font-medium ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"} bg-white/80 dark:bg-zinc-800/80 px-2 py-1 rounded-full backdrop-blur-sm`}>
                {change}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">{title}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function Inicio() {
  const ADMIN_ROL = 1;
  const [selectedTab, setSelectedTab] = useState("24h");
  const [selectedSucursal, setSelectedSucursal] = useState("");
  const [sucursales, setSucursales] = useState([]);
  const [userRol, setUserRol] = useState(null);
  const [modalNotasOpen, setModalNotasOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { productos: productosMenorStock } = useProductosMenorStock(selectedSucursal, selectedTab);
  const { sucursales: sucursalesDesempeno, promedioGeneral } = useDesempenoSucursales(selectedTab, selectedSucursal);
  const nombre = useUserStore((state) => state.nombre);

    useEffect(() => {
    const fetchUserRol = async () => {
      if (nombre) {
        try {
          const response = await axios.get("/dashboard/usuarioRol", {
            params: { usuario: nombre },
          });

          if (response.data?.rol_id) {
            setUserRol(response.data.rol_id);
          }
        } catch (error) {
          console.error("Error al obtener rol de usuario:", error);
        }
      }
    };

    fetchUserRol();
  }, [nombre]); // se ejecuta cuando 'nombre' cambia

  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        const response = await axios.get("/dashboard/sucursales");
        const list = response.data?.data || [];
        setSucursales(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error("Error obteniendo sucursales:", error);
        setSucursales([]); // fallback
      }
    };
    fetchSucursales();
  }, []);

  const periodoLabel = getPeriodoLabel(selectedTab);
  const { totalProductsSold, percentageChange: percentageChangeProducts } = useProductSell(selectedTab, selectedSucursal);
  const { ventasTotal, ventasAnterior, percentageChange, totalRegistros } = useVentasTotal(selectedTab, selectedSucursal);
  const cambioNuevosClientes = ventasAnterior > 0
    ? ((totalRegistros - ventasAnterior) / ventasAnterior) * 100
    : (totalRegistros > 0 ? 100 : 0);

  // Simulación de datos para ejemplo visual
  const totalOrders = 300;
  const newCustomers = 8;



  const today = new Date();
  let fechaInicio = `${today.getFullYear()}-01-01`;
  let fechaFin = today.toISOString().slice(0, 10);
  if (selectedTab === "24h") {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    fechaInicio = d.toISOString().slice(0, 10);
  } else if (selectedTab === "semana") {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    fechaInicio = d.toISOString().slice(0, 10);
  } else if (selectedTab === "mes") {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    fechaInicio = d.toISOString().slice(0, 10);
  } else if (selectedTab === "anio") {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    fechaInicio = d.toISOString().slice(0, 10);
  }

// Busca el id de almacén correspondiente a la sucursal seleccionada
//const almacenId = sucursales.find(s => s.id.toString() === selectedSucursal)?.almacen_n || "%";

const { cantidadPendientes, totalNotas, notasPendientes, loading, refetchNotasPendientes } = useNotasPendientes({ idSucursal: selectedSucursal });

// Calcula el porcentaje de notas pendientes respecto al total de ingresos
const porcentajePendientes =
  totalNotas && totalNotas > 0
    ? (cantidadPendientes / totalNotas) * 100
    : 0;

  
  return (
    <div className="min-h-screen py-8 px-2 sm:px-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
<header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/80 dark:bg-zinc-900/80 border border-blue-100 dark:border-zinc-700 rounded-2xl shadow-sm p-6 mb-2 transition-colors">
  <div>
    <h1 className="text-5xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-900 via-blue-500 to-cyan-400 dark:from-blue-200 dark:via-blue-400 dark:to-cyan-300 drop-shadow-md">
      Panel Principal
    </h1>
    <p className="text-base text-blue-700/80 dark:text-blue-200/80 mt-2">
      Visualiza el dashboard general de ventas por periodos de tiempo.
    </p>
  </div>
  <div className="flex items-center gap-3">
    <Select
      className="w-64"
      selectedKeys={new Set([selectedSucursal])}
      onSelectionChange={(keys) => {
        const firstKey = keys.values().next().value || "";
        setSelectedSucursal(firstKey);
      }}
      placeholder="Seleccionar sucursal"
      classNames={{
        trigger: "bg-blue-50 border-blue-100 text-blue-900 shadow-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-blue-200",
      }}
    >
      {sucursales.map((sucursal) => (
        <SelectItem
          key={sucursal.id.toString()}
          value={sucursal.id.toString()}
        >
          {sucursal.nombre}
        </SelectItem>
      ))}
    </Select>
    <Button
      auto
      light
      color="danger"
      onClick={() => setSelectedSucursal("")}
      className="bg-rose-50 hover:bg-rose-100 text-rose-600 shadow-sm dark:bg-rose-950 dark:hover:bg-rose-900 dark:text-rose-300"
    >
      <MdDeleteForever style={{ fontSize: "20px" }} />
      Limpiar
    </Button>
  </div>
</header>
          <div style={{ marginTop: "15px" }}>
            <main>
              <div className="app-panel px-2 py-2 mb-4 flex flex-col">
                <Tabs
                  selectedKey={selectedTab}
                  onSelectionChange={setSelectedTab}
                  classNames={{
                    tabList: "bg-transparent flex gap-2",
                    tab: "rounded-lg px-4 py-2 font-semibold transition-colors text-blue-700 data-[selected=true]:bg-gradient-to-r data-[selected=true]:from-blue-100 data-[selected=true]:to-blue-50 data-[selected=true]:text-blue-900 data-[selected=true]:shadow data-[selected=true]:border data-[selected=true]:border-blue-200",
                  }}
                >
                <Tab key="24h" title="Ult. 24hrs" />
                <Tab key="semana" title="Ult. Semana" />
                <Tab key="mes" title="Ult. mes" />
                <Tab key="anio" title="Ult. año" />
              </Tabs>
            </div>
            <div className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {/* KPIs */}
                <MetricCard
                  icon={<ShoppingBag className="h-6 w-6" />}
                  title="Total Ventas"
                  value={`S/. ${ventasTotal}`}
                  change={`${percentageChange > 0 ? "+" : ""}${percentageChange.toFixed(1)}%`}
                  periodoLabel={periodoLabel}
                  gradient="from-rose-500/20 via-pink-500/10 to-transparent"
                  iconColor="bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400"
                  borderColor="border-rose-200/50 dark:border-rose-800/50"
                />
                <MetricCard
                  icon={<Users className="h-6 w-6" />}
                  title="Nuevos Clientes"
                  value={totalRegistros}
                  change={`${cambioNuevosClientes > 0 ? "+" : ""}${cambioNuevosClientes.toFixed(1)}%`}
                  periodoLabel={periodoLabel}
                  gradient="from-violet-500/20 via-purple-500/10 to-transparent"
                  iconColor="bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400"
                  borderColor="border-violet-200/50 dark:border-violet-800/50"
                />
                <MetricCard
                  icon={<Package className="h-6 w-6" />}
                  title="Productos Vendidos"
                  value={totalProductsSold}
                  change={`${percentageChangeProducts > 0 ? "+" : ""}${percentageChangeProducts.toFixed(1)}%`}
                  periodoLabel={periodoLabel}
                  gradient="from-emerald-500/20 via-green-500/10 to-transparent"
                  iconColor="bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                  borderColor="border-emerald-200/50 dark:border-emerald-800/50"
                />
                <MetricCard
                  icon={
                    <Tooltip content={cantidadPendientes === 0 ? "No hay notas pendientes" : "Ver notas pendientes"}>
                      <span
                        className="cursor-pointer"
                        onClick={() => {
                          if (cantidadPendientes > 0) setModalNotasOpen(true);
                        }}
                      >
                        <LayoutGrid className="h-6 w-6" />
                      </span>
                    </Tooltip>
                  }
                  title="Notas Pendientes"
                  value={cantidadPendientes === 0 ? "Sin pendientes" : cantidadPendientes}
                  change={
                    cantidadPendientes === 0
                      ? ""
                      : `${porcentajePendientes.toFixed(1)}% pendientes`
                  }
                  gradient={
                    cantidadPendientes === 0
                      ? "from-emerald-400/20 via-green-400/10 to-transparent"
                      : "from-rose-500/20 via-pink-500/10 to-transparent"
                  }
                  iconColor={
                    cantidadPendientes === 0
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                      : "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400"
                  }
                  borderColor={
                    cantidadPendientes === 0
                      ? "border-emerald-200/50 dark:border-emerald-800/50"
                      : "border-rose-200/50 dark:border-rose-800/50"
                  }
                />
                <NotasPendientesModal
                  open={modalNotasOpen}
                  onClose={() => setModalNotasOpen(false)}
                  notas={notasPendientes}
                  refetchNotas={refetchNotasPendientes}
                />
              </div>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <StockCard productos={productosMenorStock} />
                <PerformanceCard sucursales={sucursalesDesempeno} promedioGeneral={promedioGeneral} />
              </div>
              <div className="mt-7">
                <LineChartComponent sucursal={selectedSucursal} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default Inicio;