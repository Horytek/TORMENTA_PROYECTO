import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Bell, CheckCheck, ShoppingBag } from "lucide-react";
import {
  buyerLeerNotificacion,
  buyerLeerTodasNotificaciones,
  buyerListNotificaciones,
  type BuyerNotificacion,
} from "../../api/ecommerce";
import { comprarSolicitudAlCarrito } from "../../utils/comprarSolicitudAlCarrito";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Props = {
  slug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enabled: boolean;
};

function timeAgo(iso?: string) {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "Ahora";
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h} h`;
  return `Hace ${Math.floor(h / 24)} d`;
}

function isAprobadaVigente(n: BuyerNotificacion) {
  if (n.tipo !== "solicitud_aprobada") return false;
  const exp = n.payload?.expires_at;
  if (!exp) return true;
  return new Date(exp).getTime() > Date.now();
}

export function StoreNotificationsSheet({ slug, open, onOpenChange, enabled }: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const listQ = useQuery({
    queryKey: ["buyer-notificaciones", slug],
    queryFn: () => buyerListNotificaciones(slug),
    enabled: enabled && open && Boolean(slug),
  });

  const rows = (listQ.data?.data || []) as BuyerNotificacion[];

  const leerMut = useMutation({
    mutationFn: (id: number) => buyerLeerNotificacion(slug, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["buyer-notificaciones", slug] });
      qc.invalidateQueries({ queryKey: ["buyer-notif-unread", slug] });
    },
  });

  const leerTodasMut = useMutation({
    mutationFn: () => buyerLeerTodasNotificaciones(slug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["buyer-notificaciones", slug] });
      qc.invalidateQueries({ queryKey: ["buyer-notif-unread", slug] });
    },
  });

  const comprarMut = useMutation({
    mutationFn: async (n: BuyerNotificacion) => {
      if (!n.leida) await buyerLeerNotificacion(slug, n.id_notificacion);
      return comprarSolicitudAlCarrito(slug, n.ref_id);
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["buyer-notificaciones", slug] });
      qc.invalidateQueries({ queryKey: ["buyer-notif-unread", slug] });
      toast.success(res.alreadyInCart ? "Ya está en tu carrito" : "Listo para comprar");
      onOpenChange(false);
      navigate(`/tienda/${slug}/carrito`);
    },
    onError: (e: Error) => toast.error(e.message || "No se pudo ir a comprar"),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="vitrina w-full max-w-none sm:max-w-md p-0 flex flex-col gap-0 bg-[var(--vitrina-elevated)]"
      >
        <SheetHeader className="px-4 pt-5 pb-3 border-b store-hairline text-left space-y-1">
          <div className="flex items-center justify-between gap-2 pr-8">
            <SheetTitle className="text-base flex items-center gap-2">
              <Bell className="size-4" /> Notificaciones
            </SheetTitle>
            {rows.some((r) => !r.leida) && (
              <button
                type="button"
                className="text-xs store-muted inline-flex items-center gap-1 hover:underline"
                disabled={leerTodasMut.isPending}
                onClick={() => leerTodasMut.mutate()}
              >
                <CheckCheck className="size-3.5" /> Marcar leídas
              </button>
            )}
          </div>
          <SheetDescription className="text-xs store-muted">
            Seguimiento de tus solicitudes de stock.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {listQ.isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-black/5 dark:bg-white/5 animate-pulse" />
              ))}
            </div>
          )}
          {!listQ.isLoading && rows.length === 0 && (
            <div className="rounded-xl border store-hairline border-dashed p-8 text-center text-sm store-muted">
              Aún no tienes notificaciones.
            </div>
          )}
          {rows.map((n) => {
            const aprobada = isAprobadaVigente(n);
            return (
              <article
                key={n.id_notificacion}
                className={cn(
                  "rounded-xl border store-hairline p-3.5 space-y-2 transition",
                  !n.leida ? "bg-[color-mix(in_srgb,var(--vitrina-accent)_8%,transparent)]" : "bg-transparent"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className={cn("text-sm leading-snug", !n.leida && "font-semibold")}>{n.titulo}</p>
                  <span className="text-[10px] store-muted shrink-0 whitespace-nowrap">
                    {timeAgo(n.created_at)}
                  </span>
                </div>
                {n.cuerpo && <p className="text-xs store-muted leading-relaxed">{n.cuerpo}</p>}
                {n.payload?.expires_at && n.tipo === "solicitud_aprobada" && (
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    Válido hasta {new Date(n.payload.expires_at).toLocaleString()}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {aprobada && (
                    <Button
                      size="sm"
                      className="h-9 gap-1.5"
                      style={{ background: "var(--vitrina-accent)" }}
                      disabled={comprarMut.isPending}
                      onClick={() => comprarMut.mutate(n)}
                    >
                      <ShoppingBag className="size-3.5" />
                      Ir a comprar
                    </Button>
                  )}
                  {(n.tipo === "solicitud_rechazada" || n.tipo === "solicitud_expirada") &&
                    n.payload?.id_producto && (
                      <Button size="sm" variant="outline" className="h-9" asChild>
                        <Link
                          to={`/tienda/${slug}/producto/${n.payload.id_producto}`}
                          onClick={() => {
                            if (!n.leida) leerMut.mutate(n.id_notificacion);
                            onOpenChange(false);
                          }}
                        >
                          Ver producto
                        </Link>
                      </Button>
                    )}
                  {!n.leida && !aprobada && (
                    <button
                      type="button"
                      className="text-xs underline store-muted"
                      onClick={() => leerMut.mutate(n.id_notificacion)}
                    >
                      Marcar leída
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div className="border-t store-hairline px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Link
            to={`/tienda/${slug}/cuenta/solicitudes`}
            className="text-sm font-medium underline underline-offset-2"
            style={{ color: "var(--vitrina-accent)" }}
            onClick={() => onOpenChange(false)}
          >
            Ver todas mis solicitudes
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
