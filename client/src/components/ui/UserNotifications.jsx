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
          <DrawerHeader className="flex flex-col gap-4 px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10">
            {/* --- FILA SUPERIOR: Título y Botón Cerrar --- */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
                  <Bell className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <h3 className="font-semibold text-lg leading-none text-gray-900 dark:text-white">
                    Notificaciones
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                    Actividad reciente del sistema
                  </p>
                </div>
              </div>
              <Button
                isIconOnly
                variant="light"
                radius="full"
                size="sm"
                onPress={() => handleClose(internalClose)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* --- FILA INFERIOR: Buscador y Tabs unificados --- */}
            <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
              <Input
                placeholder="Buscar..."
                size="sm"
                radius="lg"
                variant="bordered"
                startContent={<Filter className="w-3.5 h-3.5 text-gray-400" />}
                value={search}
                onValueChange={setSearch}
                classNames={{
                  inputWrapper: "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 shadow-sm hover:border-primary-400 transition-colors",
                  input: "text-sm",
                }}
                className="w-full sm:max-w-[200px]" // Ajustamos el ancho en desktop para que no sea enorme
              />
              
              {/* Tabs con estilo sólido para equilibrar el Input */}
              <Tabs
                aria-label="Filtros"
                size="sm"
                radius="lg"
                variant="solid" 
                color="primary"
                selectedKey={filter}
                onSelectionChange={setFilter}
                classNames={{
                  base: "w-full sm:w-auto",
                  tabList: "w-full sm:w-auto bg-gray-100 dark:bg-zinc-800 p-1 gap-1",
                  cursor: "bg-white dark:bg-zinc-700 shadow-sm", // Efecto tarjeta flotante
                  tab: "h-7 px-3 text-gray-500 dark:text-zinc-400",
                  tabContent: "group-data-[selected=true]:text-gray-900 dark:group-data-[selected=true]:text-white font-medium"
                }}
              >
                <Tab key="all" title="Todas" />
                <Tab key="login" title="Accesos" />
                <Tab key="changes" title="Cambios" />
                <Tab key="errors" title="Alertas" />
              </Tabs>
            </div>
          </DrawerHeader>

            <DrawerBody className="p-0 bg-gray-50/50 dark:bg-zinc-900/50">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">Cargando actividad...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <p className="text-red-500 text-sm">{error}</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-gray-300 dark:text-zinc-600" />
                  </div>
                  <h4 className="text-gray-900 dark:text-gray-100 font-medium mb-1">Sin notificaciones</h4>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-[200px]">
                    No hay actividad reciente que coincida con tus filtros.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {filteredNotifications.map((n) => (
                    <div
                      key={n.id_log}
                      className="p-4 hover:bg-white dark:hover:bg-zinc-800/50 transition-colors group relative"
                    >
                      <div className="flex gap-3">
                        <div className="mt-1 shrink-0">
                          <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 flex items-center justify-center shadow-sm">
                            {getIcon(n.accion)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-0.5">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {getTitle(n)}
                            </p>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                              {formatTime(n.fecha)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-zinc-400 line-clamp-2 mb-1.5">
                            {n.descripcion || "Sin descripción"}
                          </p>
                          <div className="flex items-center gap-2">
                            <Chip size="sm" variant="flat" className="h-5 text-[10px] px-1 bg-gray-100 dark:bg-zinc-800 text-gray-500">
                              {n.nombre_usuario || "Sistema"}
                            </Chip>
                            {n.id_modulo && (
                              <span className="text-[10px] text-gray-400 flex items-center gap-1">
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