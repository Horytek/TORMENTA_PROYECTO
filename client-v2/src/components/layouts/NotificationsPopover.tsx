import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Bell,
  CheckCircle2,
  Info,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Inbox,
  Loader2,
} from "lucide-react";
import {
  getNotificacionesRequest,
  type Notificacion,
} from "@/api/notifications";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/useUserStore";

/** Tiempo relativo en español (sin libs externas). */
function timeAgo(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "hace un momento";
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return `hace ${m} min`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return `hace ${h} h`;
  }
  const days = Math.floor(diff / 86400);
  if (days < 7) return `hace ${days} d`;
  return d.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Mapea acción a un par {icon, color} razonable. */
function visualFor(accion: string | null | undefined): {
  Icon: typeof Info;
  tone: string; // clases tailwind combinadas
} {
  const a = (accion ?? "").toLowerCase();
  if (a.includes("error") || a.includes("fall") || a.includes("rechaz")) {
    return { Icon: XCircle, tone: "text-rose-500 bg-rose-50 dark:bg-rose-950/40" };
  }
  if (a.includes("warn") || a.includes("pendient") || a.includes("alerta")) {
    return {
      Icon: AlertTriangle,
      tone: "text-amber-500 bg-amber-50 dark:bg-amber-950/40",
    };
  }
  if (
    a.includes("create") ||
    a.includes("insert") ||
    a.includes("registr") ||
    a.includes("crear") ||
    a.includes("login") ||
    a.includes("success") ||
    a.includes("exitos")
  ) {
    return {
      Icon: CheckCircle2,
      tone: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40",
    };
  }
  return { Icon: Info, tone: "text-blue-500 bg-blue-50 dark:bg-blue-950/40" };
}

const POLL_INTERVAL_MS = 60_000; // refresco silencioso cada 60 s

interface NotificationsPopoverProps {
  /** No leídos iniciales (controlados desde fuera si quieres). */
  initialUnread?: number;
}

export function NotificationsPopover({ initialUnread = 0 }: NotificationsPopoverProps) {
  const idTenant = useUserStore((s) => s.user?.id_tenant);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unread, setUnread] = useState<number>(initialUnread);
  const pollRef = useRef<number | null>(null);

  const fetchList = useCallback(
    async (showLoading = false) => {
      if (!idTenant) return;
      if (showLoading) setLoading(true);
      setError(null);
      try {
        const data = await getNotificacionesRequest(20, 0);
        setItems(data);
        // "No leídos" = notificaciones de los últimos 10 minutos (heurística MVP)
        const cutoff = Date.now() - 10 * 60 * 1000;
        const fresh = data.filter(
          (n) => new Date(n.fecha).getTime() >= cutoff
        ).length;
        setUnread(fresh);
      } catch (e: any) {
        setError(
          e?.response?.data?.message ??
            e?.message ??
            "No se pudieron cargar las notificaciones."
        );
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [idTenant]
  );

  // Carga inicial + polling silencioso
  useEffect(() => {
    fetchList(true);
    pollRef.current = window.setInterval(() => fetchList(false), POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [fetchList]);

  // Al abrir: marcar como leídos localmente y refrescar al cerrar
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      // Pequeño delay para que el contador se "vacíe" con la apertura
      setUnread(0);
    }
  };

  const empty = useMemo(
    () => !loading && !error && items.length === 0,
    [loading, error, items]
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notificaciones"
          className="relative h-9 w-9 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span
              className={cn(
                "absolute right-2 top-2 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-semibold leading-none ring-2 ring-background",
                unread > 9 ? "bg-rose-500 text-white" : "bg-brand text-white"
              )}
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] p-0 sm:w-[420px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Notificaciones</h3>
            {items.length > 0 && (
              <span className="text-[11px] text-muted-foreground/70">
                ({items.length})
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fetchList(true)}
            disabled={loading}
            aria-label="Refrescar"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[420px] overflow-y-auto">
          {loading && items.length === 0 && (
            <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando notificaciones…
            </div>
          )}

          {error && (
            <div className="px-4 py-6 text-center">
              <XCircle className="mx-auto h-5 w-5 text-rose-500" />
              <p className="mt-2 text-xs text-muted-foreground">{error}</p>
              <button
                type="button"
                onClick={() => fetchList(true)}
                className="mt-3 text-xs font-medium text-brand hover:underline"
              >
                Reintentar
              </button>
            </div>
          )}

          {empty && (
            <div className="px-4 py-10 text-center">
              <Inbox className="mx-auto h-6 w-6 text-muted-foreground/40" />
              <p className="mt-2 text-sm font-medium text-foreground">
                Todo tranquilo por aquí
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                No tienes notificaciones recientes.
              </p>
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <ul className="divide-y divide-border/40">
              {items.map((n) => {
                const { Icon, tone } = visualFor(n.accion);
                return (
                  <li
                    key={n.id_log}
                    className="flex gap-3 px-4 py-3 hover:bg-accent/40"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                        tone
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {n.accion || "Actividad"}
                      </p>
                      {n.descripcion && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {n.descripcion}
                        </p>
                      )}
                      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground/60">
                        {n.nombre_usuario ? `${n.nombre_usuario} · ` : ""}
                        {timeAgo(n.fecha)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/60 px-4 py-2 text-center">
          <span className="text-[11px] text-muted-foreground/70">
            Mostrando las últimas {Math.min(20, items.length)} notificaciones
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}