import React, { useEffect, useState, useRef } from "react";
import { Bell, X } from "lucide-react";
import { getNotificaciones } from "@/services/dashboard.services";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Chip,
  Button,
} from "@heroui/react";

export default function UserNotifications({ open, onClose }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  // Normaliza la forma de la respuesta (array directo, data, data.data, etc.)
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

    return () => {
      mounted.current = false;
    };
  }, [open]);

  // Cierre consistente: cierra el Drawer y sincroniza el estado del padre
  const handleClose = (internalClose) => {
    try { internalClose?.(); } catch {}
    onClose?.();
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
            {/* Header sticky con glass + gradiente */}
            <DrawerHeader
              className="
                sticky top-0 z-10
                px-6 py-4
                border-b border-blue-100/50 dark:border-zinc-700/50
                bg-gradient-to-r from-white/85 via-blue-50/70 to-white/85
                dark:from-zinc-900/85 dark:via-zinc-900/80 dark:to-zinc-900/85
                backdrop-blur-xl
                rounded-t-2xl
              "
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/15 to-cyan-400/15 border border-blue-200/50 dark:border-zinc-700/60 shadow-sm">
                  <Bell className="text-blue-600 dark:text-blue-300 w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-[18px] tracking-tight text-blue-900 dark:text-blue-100">
                      Notificaciones
                    </h3>
                    <Chip
                      color="primary"
                      size="sm"
                      className="font-semibold"
                      variant="flat"
                    >
                      {notificaciones.length}
                    </Chip>
                  </div>
                  <p className="text-[12px] text-blue-600/70 dark:text-blue-300/70 mt-0.5">
                    Actualizaciones recientes de tu actividad en el sistema
                  </p>
                </div>

                <Button
                  isIconOnly
                  variant="light"
                  color="danger"
                  size="sm"
                  className="rounded-full shadow hover:shadow-md"
                  onPress={() => handleClose(internalClose)}
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DrawerHeader>

            {/* Cuerpo con fondo sutil y timeline */}
            <DrawerBody className="flex-1 overflow-y-auto px-6 py-6 bg-gradient-to-br from-white/95 via-blue-50/65 to-blue-100/50 dark:from-zinc-900/90 dark:via-zinc-900/85 dark:to-zinc-900/80">
              {loading ? (
                <div className="text-center text-gray-400 py-16 text-base">Cargando...</div>
              ) : error ? (
                <div className="text-center text-red-500 py-16 text-base">{error}</div>
              ) : notificaciones.length === 0 ? (
                <div className="text-center py-14">
                  <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/15 to-cyan-400/15 border border-blue-200/50 dark:border-zinc-700/60 flex items-center justify-center">
                    <Bell className="w-6 h-6 text-blue-500 dark:text-blue-300" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-zinc-300">
                    No hay notificaciones recientes.
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {/* Línea del timeline */}
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-blue-200/70 via-blue-200/40 to-transparent dark:from-zinc-600/60 dark:via-zinc-600/40" />
                  <ul className="space-y-3">
                    {notificaciones.map((n) => (
                      <li
                        key={n.id}
                        className="
                          relative pl-8 pr-2
                          group
                        "
                      >
                        {/* Punto del timeline */}
                        <span
                          className="
                            absolute left-3 top-4 -translate-x-1/2
                            w-2.5 h-2.5 rounded-full
                            bg-blue-500 ring-2 ring-white dark:ring-zinc-900
                            group-hover:scale-110 transition
                          "
                        />
                        <div
                          className="
                            bg-white/90 dark:bg-zinc-800/70
                            border border-blue-100/60 dark:border-zinc-700/60
                            rounded-xl px-4 py-3
                            text-[15px] text-blue-900 dark:text-blue-100
                            shadow-sm hover:shadow-lg
                            hover:border-blue-200/80 dark:hover:border-zinc-600
                            transition-all duration-200
                          "
                        >
                          <span className="font-semibold block leading-snug">
                            {n.mensaje}
                          </span>
                          <span className="text-[11px] text-blue-500 dark:text-blue-300 mt-1 block">
                            {n.fecha ? new Date(n.fecha).toLocaleString("es-PE") : ""}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </DrawerBody>

            <DrawerFooter
              className="
                px-6 py-4
                bg-white/85 dark:bg-zinc-900/85
                border-t border-blue-100/50 dark:border-zinc-700/50
                rounded-b-2xl
                flex justify-end
              "
            >
              <Button
                size="sm"
                variant="flat"
                color="danger"
                onPress={() => handleClose(internalClose)}
              >
                Cerrar
              </Button>
            </DrawerFooter>

            <style>{`
              .animate-fade-in { animation: fade-in .3s ease; }
              @keyframes fade-in { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }
            `}</style>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}