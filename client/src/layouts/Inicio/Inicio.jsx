import { Modal, ModalContent, ModalHeader, ModalBody, Card, CardHeader, CardBody, Avatar, Button, Divider, Chip, Tooltip, ScrollShadow } from "@heroui/react";
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


// Card para productos con menor stock
function StockCard({ productos }) {
  return (
    <Card className="relative overflow-hidden rounded-2xl border-1 shadow-xl bg-white dark:bg-zinc-900 transition-all flex flex-col h-full min-h-[340px]">
      {/* Fondo decorativo más sutil */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-100/60 to-pink-200/40 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-orange-100/40 to-red-100/30 rounded-full blur-xl"></div>
      </div>
      <CardHeader className="flex items-center gap-3 mb-1 bg-transparent">
        <div className="p-2 rounded-lg bg-gradient-to-br from-rose-400/80 to-pink-500/80 shadow">
          <AlertTriangle className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Stock Crítico</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Productos con menor stock (filtrado)
          </p>
        </div>
      </CardHeader>
      <CardBody className="py-3 px-4 flex-1 flex flex-col">
        <span className="text-[11px] text-rose-500 mb-2 font-medium">
          * Se actualiza en tiempo real (solo filtra por sucursal)
        </span>
        <ScrollShadow hideScrollBar className="flex-1 min-h-[120px] max-h-[220px]">
          {productos.length > 0 ? (
            <ul className="divide-y divide-rose-50 dark:divide-rose-900">
              {productos.map((prod, idx) => {
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
                  <li key={prod.nombre} className="py-2 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{prod.nombre}</span>
                        <Chip color={chipColor} variant="flat" className="font-bold text-xs px-2 py-0.5">
                          {prod.stock} und.
                        </Chip>
                      </div>
                      {/* Indicador de stock simple */}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-block w-2 h-2 rounded-full ${urgencyColor}`}></span>
                        <span className="text-xs text-zinc-400">{Number(prod.stock) <= 3 ? "Muy bajo" : Number(prod.stock) <= 5 ? "Bajo" : "Moderado"}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-6 text-center bg-white/60 dark:bg-zinc-800/60 rounded-xl">
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
    <Card className="relative overflow-hidden rounded-2xl border-1 shadow-xl bg-white dark:bg-zinc-900 transition-all flex flex-col h-full min-h-[340px]">
      {/* Fondo decorativo elegante y sutil */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-6 -left-6 w-28 h-28 bg-gradient-to-br from-blue-400/30 to-indigo-600/20 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-gradient-to-tr from-cyan-400/20 to-blue-500/10 rounded-full blur-xl"></div>
      </div>
      <CardHeader className="flex items-center gap-3 mb-1 bg-transparent">
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
      <CardBody className="py-3 px-4 flex-1 flex flex-col">
        <span className="text-[11px] text-blue-600 mb-2 font-medium">
          * Se actualiza en tiempo real (solo filtra por sucursal y tiempo)
        </span>
        <ScrollShadow hideScrollBar className="flex-1 min-h-[120px] max-h-[220px]">
          {sucursales.length > 0 ? (
            <ul className="divide-y divide-blue-50 dark:divide-blue-900">
              {sucursales.map((branch, index) => {
                const salesValue = branch.ventas || branch.sales || 0;
                const maxSales = 15000;
                const percentage = (Number(salesValue) / maxSales) * 100;
                return (
                  <li key={branch.nombre || branch.name} className="py-2 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${gradients[index % gradients.length]} shadow`}
                          ></span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                            {branch.nombre || branch.name}
                          </span>
                        </div>
                        <Chip color="primary" variant="flat" className="font-bold text-xs px-2 py-0.5">
                          S/. {(branch.ventas || branch.sales || 0).toLocaleString()}
                        </Chip>
                      </div>
                      {/* Indicador de rendimiento simple */}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-zinc-400">{Math.round(percentage)}% del objetivo</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-6 text-center bg-white/60 dark:bg-zinc-800/60 rounded-xl">
              <p className="text-zinc-500 dark:text-zinc-400">No hay datos disponibles para esta sucursal</p>
            </div>
          )}
        </ScrollShadow>
        <div className="flex items-center justify-between mt-5 p-2 rounded-xl bg-gradient-to-r from-zinc-100/80 to-zinc-50/80 dark:from-zinc-800/80 dark:to-zinc-700/80 backdrop-blur-sm border border-white/40 dark:border-zinc-600/40">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">Promedio general</span>
          <Chip color="success" variant="flat" className="font-bold text-xs px-3 py-1">
            S/. {promedioGeneral?.toLocaleString()}
          </Chip>
        </div>
      </CardBody>
    </Card>
  );
}

function NotasPendientesModal({ open, onClose, notas }) {
  // Separar las notas por tipo
  const notasFaltaSalida = notas.filter(n => n.tipo === "Falta salida");
  const notasFaltaIngreso = notas.filter(n => n.tipo === "Falta ingreso");

  // Función para formatear la fecha
  const formatFecha = (fecha) => {
    if (!fecha) return "";
    try {
      // Intenta parsear la fecha como ISO o yyyy-MM-dd
      const dateObj = new Date(fecha);
      if (isNaN(dateObj)) return fecha;
      return format(dateObj, "dd/MM/yyyy", { locale: es });
    } catch {
      return fecha;
    }
  };


  return (
    <Modal isOpen={open} onClose={onClose} size="md">
      <ModalContent>
        <ModalHeader className="flex items-center gap-2">
          <AlertTriangle className="text-rose-500" />
          Notas pendientes
        </ModalHeader>
        <ModalBody>
          <Tabs aria-label="Notas pendientes" variant="underlined" className="mb-2">
            <Tab key="falta-salida" title="Falta Nota de Salida">
              {notasFaltaSalida.length === 0 ? (
                <div className="p-6 text-center text-zinc-500">
                  No hay notas de ingreso pendientes de salida.
                </div>
              ) : (
                <ScrollShadow hideScrollBar className="max-h-[320px]">
                  <ul className="divide-y divide-rose-50 dark:divide-rose-900">
                    {notasFaltaSalida.map((nota) => (
                      <li key={nota.id_nota} className="py-3 flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                              {nota.documento || "Sin documento"}
                            </span>
                            <span className="text-xs text-zinc-400">{formatFecha(nota.fecha)}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-zinc-500">
                              Origen: <b>{nota.id_almacenO}</b> &rarr; Destino: <b>{nota.id_almacenD}</b>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-zinc-400">{nota.concepto}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </ScrollShadow>
              )}
            </Tab>
            <Tab key="falta-ingreso" title="Falta Nota de Ingreso">
              {notasFaltaIngreso.length === 0 ? (
                <div className="p-6 text-center text-zinc-500">
                  No hay notas de salida pendientes de ingreso.
                </div>
              ) : (
                <ScrollShadow hideScrollBar className="max-h-[320px]">
                  <ul className="divide-y divide-rose-50 dark:divide-rose-900">
                    {notasFaltaIngreso.map((nota) => (
                      <li key={nota.id_nota} className="py-3 flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                              {nota.documento || "Sin documento"}
                            </span>
                            <span className="text-xs text-zinc-400">{formatFecha(nota.fecha)}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-zinc-500">
                              Origen: <b>{nota.id_almacenO}</b> &rarr; Destino: <b>{nota.id_almacenD}</b>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-zinc-400">{nota.concepto}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </ScrollShadow>
              )}
            </Tab>
          </Tabs>
        </ModalBody>
      </ModalContent>
    </Modal>
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

  const { productos: productosMenorStock } = useProductosMenorStock(selectedSucursal, selectedTab);
  const { sucursales: sucursalesDesempeno, promedioGeneral } = useDesempenoSucursales(selectedTab, selectedSucursal);

  useEffect(() => {
    const fetchUserRol = async () => {
      const storedUser = localStorage.getItem("usuario");
      if (storedUser) {
        try {
          const response = await axios.get("/dashboard/usuarioRol", {
            params: { usuario: storedUser }
          });
          if (response.data && response.data.rol_id) {
            setUserRol(response.data.rol_id);
          }
        } catch (error) {
          console.error("Error al obtener rol de usuario:", error);
        }
      }
    };
    fetchUserRol();
  }, []);

  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        const response = await axios.get("/dashboard/sucursales");
        if (response.data && response.data.data) {
          setSucursales(response.data.data);
        }
      } catch (error) {
        console.error(error);
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
const almacenId = sucursales.find(s => s.id.toString() === selectedSucursal)?.almacen_n || "%";

const { cantidadPendientes, totalNotas, notasPendientes, loading: loadingPendientes } = useNotasPendientes({
  almacen: almacenId,
});

// Calcula el porcentaje de notas pendientes respecto al total de ingresos
const porcentajePendientes =
  totalNotas && totalNotas > 0
    ? (cantidadPendientes / totalNotas) * 100
    : 0;

  
  return (
    <div className="relative items-center justify-between bg-white">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-900 via-blue-500 to-cyan-400 transform-gpu">
            Dashboard de inicio
          </h1>
          <p
            className="text-small text-default-400"
            style={{ fontSize: "16px", userSelect: "none", marginTop: "10px" }}
          >
            Visualiza el dashboard general de ventas por periodos de tiempo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {userRol === ADMIN_ROL && (
            <>
              <Select
                className="w-64"
                selectedKeys={new Set([selectedSucursal])}
                onSelectionChange={(keys) => {
                  const firstKey = keys.values().next().value || "";
                  setSelectedSucursal(firstKey);
                }}
                placeholder="Seleccionar sucursal"
                classNames={{
                  trigger: "bg-gray-200 text-gray-700 hover:bg-gray-300",
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
              >
                <MdDeleteForever style={{ fontSize: "20px" }} />
                Limpiar
              </Button>
            </>
          )}
        </div>
      </header>
      <div className="max-w-md">
        <Divider className="my-3" />
      </div>
      <div style={{ marginTop: "15px" }}>
        <main>
          <Tabs
            selectedKey={selectedTab}
            onSelectionChange={setSelectedTab}
          >
            <Tab key="24h" title="Ult. 24hrs" />
            <Tab key="semana" title="Ult. Semana" />
            <Tab key="mes" title="Ult. mes" />
            <Tab key="anio" title="Ult. año" />
          </Tabs>
          <div className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
  );
}

export default Inicio;