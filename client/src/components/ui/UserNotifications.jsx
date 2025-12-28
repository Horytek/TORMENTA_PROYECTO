import React, { useEffect, useState, useRef, useMemo } from "react";
import { Bell, X, LogIn, PlusCircle, Edit, Trash2, AlertTriangle, Info, CheckCircle, Filter } from "lucide-react";
import { getNotificaciones } from "@/services/dashboard.services";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Chip,
  Button,
  Tabs,
  Tab,
  Input
} from "@heroui/react";

export default function UserNotifications({ open, onClose }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, login, changes, errors
  const [search, setSearch] = useState("");
  const mounted = useRef(true);

  // Normaliza la forma de la respuesta
  const normalizeItems = (resp) => {
    if (Array.isArray(resp)) return resp;
    if (Array.isArray(resp?.data?.data)) return resp.data.data;
    if (Array.isArray(resp?.data?.notificaciones)) return resp.data.notificaciones;
    if (Array.isArray(resp?.data)) return resp.data;
    return [];
  };

  useEffect(() => {
    mounted.current = true;
    if (!open) return;

    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await getNotificaciones();
        const items = normalizeItems(resp);
        if (mounted.current) setNotificaciones(items);
      } catch (e) {
        if (mounted.current) setError(e?.message ?? "No se pudieron cargar las notificaciones");
      } finally {
        if (mounted.current) setLoading(false);
      }
    };

    fetch();

    // Polling simple cada 30s para "simular" tiempo real sin sockets complejos
    const interval = setInterval(fetch, 30000);

    return () => {
      mounted.current = false;
      clearInterval(interval);
    };
  }, [open]);

  const handleClose = (internalClose) => {
    try { internalClose?.(); } catch { }
    onClose?.();
  };

  // Filtrado y búsqueda
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

  // Helpers de UI
  const getIcon = (accion) => {
    if (accion === "LOGIN_OK") return <LogIn className="w-4 h-4 text-green-500" />;
    if (accion === "LOGOUT") return <LogOutIcon className="w-4 h-4 text-gray-500" />;
    if (accion?.includes("INSERT")) return <PlusCircle className="w-4 h-4 text-blue-500" />;
    if (accion?.includes("UPDATE")) return <Edit className="w-4 h-4 text-amber-500" />;
    if (accion?.includes("DELETE")) return <Trash2 className="w-4 h-4 text-red-500" />;
    if (accion?.includes("ERROR")) return <AlertTriangle className="w-4 h-4 text-red-600" />;
    return <Info className="w-4 h-4 text-blue-400" />;
  };

  const getTitle = (n) => {
    if (n.accion === "LOGIN_OK") return "Inicio de sesión";
    if (n.accion === "LOGOUT") return "Cierre de sesión";
    if (n.accion?.includes("INSERT")) return "Nuevo registro";
    if (n.accion?.includes("UPDATE")) return "Actualización";
    if (n.accion?.includes("DELETE")) return "Eliminación";
    return n.accion || "Notificación";
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Hace un momento";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays === 1) return "Ayer";
    return date.toLocaleDateString("es-PE", { day: '2-digit', month: 'short' });
  };

  return (
    <Drawer
      isOpen={open}
      onOpenChange={(v) => { if (!v) onClose?.(); }}
      placement="right"
      size="md"
      className="z-[12000]"
      overlayClassName="bg-black/35 backdrop-blur-[2px]"
    >
      <DrawerContent>
        {(internalClose) => (
          <>
            <DrawerHeader className="flex flex-col gap-4 px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl sticky top-0 z-10">
              {/* --- FILA SUPERIOR: Título y Botón Cerrar --- */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-slate-300">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-bold text-base text-slate-800 dark:text-white leading-tight">
                      Notificaciones
                    </h3>
                    <p className="text-xs font-medium text-slate-400 dark:text-zinc-500">
                      Actividad reciente del sistema
                    </p>
                  </div>
                </div>
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  onPress={() => handleClose(internalClose)}
                  className="text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* --- FILA INFERIOR: Buscador y Tabs unificados --- */}
              <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
                <Input
                  placeholder="Buscar..."
                  size="sm"
                  variant="bordered"
                  startContent={<Filter className="w-3.5 h-3.5 text-slate-400" />}
                  value={search}
                  onValueChange={setSearch}
                  classNames={{
                    inputWrapper: "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 shadow-sm hover:border-indigo-400 transition-colors h-9",
                    input: "text-xs",
                  }}
                  className="w-full sm:max-w-[200px]"
                />

                <Tabs
                  aria-label="Filtros"
                  size="sm"
                  variant="light"
                  color="primary"
                  selectedKey={filter}
                  onSelectionChange={setFilter}
                  classNames={{
                    base: "w-full sm:w-auto",
                    tabList: "w-full sm:w-auto bg-slate-100/50 dark:bg-zinc-800/50 p-1 gap-1 rounded-lg",
                    cursor: "bg-white dark:bg-zinc-700 shadow-sm rounded-md",
                    tab: "h-7 px-3 text-slate-500 dark:text-zinc-400 text-[11px] font-medium",
                    tabContent: "group-data-[selected=true]:text-slate-800 dark:group-data-[selected=true]:text-white"
                  }}
                >
                  <Tab key="all" title="Todas" />
                  <Tab key="login" title="Accesos" />
                  <Tab key="changes" title="Cambios" />
                  <Tab key="errors" title="Alertas" />
                </Tabs>
              </div>
            </DrawerHeader>

            <DrawerBody className="p-0 bg-white dark:bg-zinc-950">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-400 font-medium">Cargando actividad...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <p className="text-red-500 text-xs font-medium">{error}</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 text-slate-300 dark:text-zinc-700">
                    <Bell className="w-8 h-8" />
                  </div>
                  <h4 className="text-slate-800 dark:text-slate-200 font-medium text-sm mb-1">Sin notificaciones</h4>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 max-w-[200px]">
                    No hay actividad reciente que coincida con tus filtros.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-zinc-900">
                  {filteredNotifications.map((n) => (
                    <div
                      key={n.id_log}
                      className="px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-zinc-900/50 transition-colors group relative"
                    >
                      <div className="flex gap-4">
                        <div className="mt-0.5 shrink-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 flex items-center justify-center">
                            {getIcon(n.accion)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                              {getTitle(n)}
                            </p>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0 font-medium bg-slate-50 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md">
                              {formatTime(n.fecha)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 mb-2 leading-relaxed">
                            {n.descripcion || "Sin descripción"}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-600" />
                              {n.nombre_usuario || "Sistema"}
                            </span>
                            {n.id_modulo && (
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                • Módulo {n.id_modulo}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DrawerBody>

            <DrawerFooter className="px-6 py-3 border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <div className="flex justify-between items-center w-full text-xs text-gray-400">
                <span>Mostrando últimos 50 eventos</span>
                <Button size="sm" variant="light" onPress={handleClose}>
                  Cerrar
                </Button>
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