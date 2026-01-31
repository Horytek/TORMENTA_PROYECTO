import React, { useEffect, useState, useRef, useMemo } from "react";
import { Bell, X, LogIn, PlusCircle, Edit, Trash2, AlertTriangle, Info, CheckCircle, Filter, ChevronDown, Calendar } from "lucide-react";
import { getNotificaciones } from "@/services/dashboard.services";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Button,
  Tabs,
  Tab,
  Input,
  Spinner,
  Badge
} from "@heroui/react";
import { format, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";

const LIMIT = 20;

export default function UserNotifications({ open, onClose }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, login, changes, errors
  const [search, setSearch] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const mounted = useRef(true);

  // Normaliza la forma de la respuesta
  const normalizeItems = (resp) => {
    if (Array.isArray(resp)) return resp;
    if (Array.isArray(resp?.data?.data)) return resp.data.data;
    if (Array.isArray(resp?.data?.notificaciones)) return resp.data.notificaciones;
    if (Array.isArray(resp?.data)) return resp.data;
    return [];
  };

  const fetchNotifications = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const currentOffset = isLoadMore ? offset : 0;
      const resp = await getNotificaciones(LIMIT, currentOffset);
      const items = normalizeItems(resp);

      if (mounted.current) {
        if (isLoadMore) {
          setNotificaciones(prev => [...prev, ...items]);
          setOffset(prev => prev + LIMIT);
        } else {
          setNotificaciones(items);
          setOffset(LIMIT);
        }

        // Si recibimos menos del límite, no hay más datos
        setHasMore(items.length === LIMIT);
      }
    } catch (e) {
      if (mounted.current) setError(e?.message ?? "No se pudieron cargar las notificaciones");
    } finally {
      if (mounted.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    mounted.current = true;
    if (!open) return;

    // Reset y carga inicial
    setOffset(0);
    setHasMore(true);
    fetchNotifications(false);

    // Polling simple solo si no estamos viendo historial antiguo?
    // Si paginamos, el polling es complicado. Lo desactivamos para evitar duplicados/saltos extraños
    // o solo hacemos polling de la primera página. Por simplicidad, refresh manual o al reabrir.

    return () => {
      mounted.current = false;
    };
  }, [open]);

  const handleClose = (internalClose) => {
    try { internalClose?.(); } catch { }
    onClose?.();
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchNotifications(true);
    }
  };

  // Filtrado y búsqueda (Client side sobre lo cargado)
  const filteredNotifications = useMemo(() => {
    return notificaciones.filter(n => {
      const matchesSearch =
        n.descripcion?.toLowerCase().includes(search.toLowerCase()) ||
        n.nombre_usuario?.toLowerCase().includes(search.toLowerCase()) ||
        n.accion?.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (filter === "all") return true;
      if (filter === "login") return n.accion === "LOGIN_OK" || n.accion === "LOGOUT";
      if (filter === "changes") return ["INSERT", "UPDATE", "DELETE"].some(a => n.accion?.includes(a));
      if (filter === "errors") return n.accion?.includes("ERROR") || n.accion?.includes("FAIL");

      return true;
    });
  }, [notificaciones, filter, search]);

  // Agrupación por fechas
  const groupedNotifications = useMemo(() => {
    const groups = {};
    filteredNotifications.forEach(n => {
      const date = new Date(n.fecha);
      let key = format(date, "yyyy-MM-dd");

      if (isToday(date)) key = "Hoy";
      else if (isYesterday(date)) key = "Ayer";
      else key = format(date, "d 'de' MMMM", { locale: es });

      if (!groups[key]) groups[key] = [];
      groups[key].push(n);
    });
    return groups;
  }, [filteredNotifications]);

  // Helpers de UI
  const getIcon = (accion) => {
    if (accion === "LOGIN_OK") return <LogIn className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    if (accion === "LOGOUT") return <LogOutIcon className="w-4 h-4 text-slate-500" />;
    if (accion?.includes("INSERT")) return <PlusCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    if (accion?.includes("UPDATE")) return <Edit className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    if (accion?.includes("DELETE")) return <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
    if (accion?.includes("ERROR") || accion?.includes("FAIL")) return <AlertTriangle className="w-4 h-4 text-rose-600" />;
    return <Info className="w-4 h-4 text-slate-400" />;
  };

  const getBgColor = (accion) => {
    if (accion === "LOGIN_OK") return "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20";
    if (accion === "LOGOUT") return "bg-slate-50 dark:bg-slate-900/10 border-slate-100 dark:border-slate-800";
    if (accion?.includes("INSERT")) return "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20";
    if (accion?.includes("UPDATE")) return "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20";
    if (accion?.includes("DELETE")) return "bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/20";
    if (accion?.includes("ERROR") || accion?.includes("FAIL")) return "bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/20";
    return "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700";
  };

  const getTitle = (n) => {
    if (n.accion === "LOGIN_OK") return "Inicio de sesión";
    if (n.accion === "LOGOUT") return "Cierre de sesión";
    if (n.accion?.includes("INSERT")) return "Nuevo registro";
    if (n.accion?.includes("UPDATE")) return "Actualización";
    if (n.accion?.includes("DELETE")) return "Eliminación";
    if (n.accion?.includes("Product created")) return "Producto Creado";
    return n.accion || "Notificación";
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    return format(new Date(dateStr), "HH:mm");
  };

  return (
    <Drawer
      isOpen={open}
      onOpenChange={(v) => { if (!v) onClose?.(); }}
      placement="right"
      size="md"
      className="z-[12000]"
      overlayClassName="bg-black/35 backdrop-blur-[2px]"
      motionProps={{
        variants: {
          enter: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
          exit: { opacity: 0, x: 100, transition: { duration: 0.2, ease: "easeIn" } },
        }
      }}
    >
      <DrawerContent>
        {(internalClose) => (
          <>
            <DrawerHeader className="flex flex-col gap-4 px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl sticky top-0 z-20">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-bold text-base text-slate-800 dark:text-white leading-tight">
                      Notificaciones
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                      <p className="text-xs font-medium text-slate-500 dark:text-zinc-500">
                        Sistema en línea
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  onPress={() => handleClose(internalClose)}
                  className="text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-3 items-center w-full mt-1">
                <Input
                  placeholder="Buscar evento..."
                  size="sm"
                  variant="bordered"
                  startContent={<Filter className="w-3.5 h-3.5 text-slate-400" />}
                  value={search}
                  onValueChange={setSearch}
                  classNames={{
                    inputWrapper: "bg-white dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-700 shadow-sm hover:border-indigo-400 transition-colors h-9",
                    input: "text-xs",
                  }}
                  className="w-full sm:max-w-[180px]"
                />

                <div className="flex-1 w-full overflow-x-auto scrollbar-hide">
                  <Tabs
                    aria-label="Filtros"
                    size="sm"
                    variant="light"
                    color="primary"
                    selectedKey={filter}
                    onSelectionChange={setFilter}
                    classNames={{
                      base: "w-full",
                      tabList: "w-full bg-slate-100/50 dark:bg-zinc-800/50 p-1 gap-1 rounded-lg",
                      cursor: "bg-white dark:bg-zinc-700 shadow-sm rounded-md",
                      tab: "h-7 px-2 text-slate-500 dark:text-zinc-400 text-[11px] font-medium",
                      tabContent: "group-data-[selected=true]:text-slate-800 dark:group-data-[selected=true]:text-white"
                    }}
                  >
                    <Tab key="all" title="Todas" />
                    <Tab key="login" title="Accesos" />
                    <Tab key="changes" title="Cambios" />
                    <Tab key="errors" title="Alertas" />
                  </Tabs>
                </div>
              </div>
            </DrawerHeader>

            <DrawerBody className="p-0 bg-slate-50/50 dark:bg-black">
              {loading && !loadingMore ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-20">
                  <Spinner size="lg" color="primary" />
                  <p className="text-xs text-slate-400 font-medium animate-pulse">Sincronizando actividad...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                  <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mb-3">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <p className="text-slate-700 dark:text-zinc-300 font-medium text-sm">Error de conexión</p>
                  <p className="text-slate-400 text-xs mt-1">{error}</p>
                  <Button size="sm" variant="flat" color="primary" onPress={() => fetchNotifications(false)} className="mt-4">
                    Reintentar
                  </Button>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4 text-slate-300 dark:text-zinc-700">
                    <Bell className="w-8 h-8 opacity-50" />
                  </div>
                  <h4 className="text-slate-800 dark:text-slate-200 font-medium text-sm mb-1">Sin notificaciones</h4>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 max-w-[200px]">
                    No se encontraron eventos recientes con los filtros actuales.
                  </p>
                </div>
              ) : (
                <div className="pb-6">
                  {Object.entries(groupedNotifications).map(([dateLabel, items]) => (
                    <div key={dateLabel} className="mb-2">
                      <div className="sticky top-0 z-10 bg-slate-50/95 dark:bg-black/95 backdrop-blur-sm px-6 py-2 border-b border-slate-100 dark:border-zinc-900 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{dateLabel}</span>
                        <span className="ml-auto text-[10px] bg-slate-200 dark:bg-zinc-800 text-slate-500 px-1.5 py-0.5 rounded-full font-medium">
                          {items.length}
                        </span>
                      </div>

                      <div className="px-3 pt-2 space-y-2">
                        {items.map((n) => (
                          <div
                            key={n.id_log}
                            className={`p-3 rounded-xl border transition-all duration-200 hover:shadow-sm hover:scale-[1.01] group bg-white dark:bg-zinc-900/50 ${getBgColor(n.accion)}`}
                          >
                            <div className="flex gap-3">
                              <div className="mt-0.5 shrink-0">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white dark:bg-zinc-900 shadow-sm border border-slate-100 dark:border-zinc-800`}>
                                  {getIcon(n.accion)}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                  <p className="text-xs font-bold text-slate-700 dark:text-zinc-200 truncate">
                                    {getTitle(n)}
                                  </p>
                                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                    {formatTime(n.fecha)}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-2">
                                  {n.descripcion || "Actividad registrada en el sistema."}
                                </p>

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-zinc-800/80 border border-slate-100 dark:border-zinc-800">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.4)]" />
                                    <span className="text-[10px] font-medium text-slate-600 dark:text-zinc-400">
                                      {n.nombre_usuario || "Sistema"}
                                    </span>
                                  </div>
                                  {n.id_modulo && (
                                    <div className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[9px] font-medium text-slate-500 dark:text-zinc-500 uppercase tracking-wide">
                                      MOD {n.id_modulo}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Load More Trigger */}
                  {hasMore && (
                    <div className="px-6 py-4 flex justify-center mt-2">
                      <Button
                        size="sm"
                        variant="flat"
                        color="default"
                        isLoading={loadingMore}
                        onPress={handleLoadMore}
                        className="w-full text-slate-500 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm hover:border-indigo-300 dark:hover:border-zinc-600 transition-all font-medium py-5"
                      >
                        {loadingMore ? "Cargando..." : "Cargar eventos anteriores"}
                      </Button>
                    </div>
                  )}

                  {!hasMore && notificaciones.length > 0 && (
                    <div className="px-6 py-8 text-center">
                      <p className="text-[10px] uppercase tracking-widest text-slate-300 dark:text-zinc-700 font-bold">
                        Fin del historial
                      </p>
                    </div>
                  )}
                </div>
              )}
            </DrawerBody>

            <DrawerFooter className="px-6 py-3 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 z-20">
              <div className="flex justify-between items-center w-full text-xs text-slate-400">
                <span>
                  {loading ? "Sincronizando..." : `${notificaciones.length} eventos cargados`}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="light" onPress={handleClose} className="text-slate-400 hover:text-slate-600">
                    Cerrar
                  </Button>
                </div>
              </div>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

// Icono extra para logout
function LogOutIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  )
}