import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ScanLine,
  Search,
  Package,
  Clock,
  CheckCircle2,
  MapPin,
  User,
  Mail,
  Phone,
  Trash2,
} from "lucide-react";
import {
  pickupListOrdenes,
  pickupPatchEstado,
  pickupGetOrden,
} from "../api/ecommerce";
import { useEcommerceAuthStore } from "../store/useEcommerceAuthStore";
import { useBorrarOrdenes } from "../hooks/useBorrarOrdenes";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { formatPen } from "../types/storefront";
import { AttrsSnapshotText } from "../components/AttrsSnapshotText";
import { AdminBranchFilterBar, useScopedSucursalId } from "../components/admin/AdminBranchFilterBar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const FILTROS = [
  { value: "", label: "Todos" },
  { value: "pago_pendiente", label: "Pago pendiente" },
  { value: "pago_confirmado", label: "Confirmados" },
  { value: "preparando", label: "Preparando" },
  { value: "listo_recoger", label: "Listos" },
  { value: "en_camino", label: "En camino" },
  { value: "entregado", label: "Entregados" },
];

const ESTADO_META: Record<
  string,
  { label: string; className: string }
> = {
  pendiente_confirmacion: {
    label: "Pendiente",
    className: "bg-stone-100 text-stone-700",
  },
  pago_pendiente: {
    label: "Pago pendiente",
    className: "bg-amber-50 text-amber-800 border border-amber-200",
  },
  pago_confirmado: {
    label: "Pago confirmado",
    className: "bg-sky-50 text-sky-800 border border-sky-200",
  },
  preparando: {
    label: "Preparando",
    className: "bg-violet-50 text-violet-800 border border-violet-200",
  },
  listo_recoger: {
    label: "Listo para recoger",
    className: "bg-teal-50 text-teal-800 border border-teal-200",
  },
  en_camino: {
    label: "En camino",
    className: "bg-indigo-50 text-indigo-800 border border-indigo-200",
  },
  entregado: {
    label: "Entregado",
    className: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  },
  cancelado: {
    label: "Cancelado",
    className: "bg-red-50 text-red-700 border border-red-200",
  },
};

const METODO_LABEL: Record<string, string> = {
  pickup: "Retiro",
  delivery: "Delivery",
  provincia: "Provincia",
};

const FILTROS_METODO = [
  { value: "", label: "Todos los métodos" },
  { value: "pickup", label: "Retiro" },
  { value: "delivery", label: "Delivery" },
  { value: "provincia", label: "Provincia" },
];

function EstadoBadge({ estado }: { estado: string }) {
  const meta = ESTADO_META[estado] || {
    label: estado,
    className: "bg-stone-100 text-stone-600",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        meta.className
      )}
    >
      {meta.label}
    </span>
  );
}

export default function EcommercePedidosRetiroPage() {
  const tid = useEcommerceAuthStore((s) => s.user?.id_tienda);
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [estado, setEstado] = useState("");
  const [metodo, setMetodo] = useState("");
  const id_sucursal = useScopedSucursalId();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const qc = useQueryClient();
  const borrar = useBorrarOrdenes([["pickup-ordenes"], ["ecom-ordenes"]], (ids) => {
    if (selectedId && ids.includes(selectedId)) setSelectedId(null);
  });

  useEffect(() => {
    const t = window.setTimeout(() => setQDebounced(q.trim()), 280);
    return () => window.clearTimeout(t);
  }, [q]);

  const listQ = useQuery({
    queryKey: ["pickup-ordenes", tid, qDebounced, estado, metodo, id_sucursal],
    queryFn: () =>
      pickupListOrdenes({
        q: qDebounced || undefined,
        estado_fulfillment: estado || undefined,
        fulfillment: metodo || undefined,
        sucursal: id_sucursal || undefined,
      }),
    enabled: Boolean(tid),
  });

  const detailQ = useQuery({
    queryKey: ["pickup-orden", selectedId],
    queryFn: () => pickupGetOrden(selectedId!),
    enabled: Boolean(selectedId),
  });

  const patchMut = useMutation({
    mutationFn: ({
      id,
      estado_fulfillment,
    }: {
      id: number;
      estado_fulfillment: string;
    }) => pickupPatchEstado(id, { estado_fulfillment }),
    onSuccess: (res) => {
      toast.success("Estado actualizado");
      if (res.data?.codigo_retiro) {
        toast.info(`Código retiro: ${res.data.codigo_retiro}`);
      }
      qc.invalidateQueries({ queryKey: ["pickup-ordenes"] });
      if (selectedId) qc.invalidateQueries({ queryKey: ["pickup-orden", selectedId] });
    },
    onError: (e: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message || "Error");
    },
  });

  const kpis = listQ.data?.data?.kpis;
  const ordenes = listQ.data?.data?.ordenes || [];
  const detalle = detailQ.data?.data;

  const kpiCards = useMemo(
    () => [
      {
        label: "Por preparar",
        value: kpis?.pendientes ?? 0,
        icon: Package,
        filter: "pago_confirmado",
      },
      {
        label: "Preparando",
        value: kpis?.preparando ?? 0,
        icon: Clock,
        filter: "preparando",
      },
      {
        label: "Listos / en camino",
        value: (kpis?.listos ?? 0) + (kpis?.en_camino ?? 0),
        icon: CheckCircle2,
        filter: metodo === "delivery" || metodo === "provincia" ? "en_camino" : "listo_recoger",
      },
      {
        label: "Entregados hoy",
        value: kpis?.entregados_hoy ?? 0,
        icon: CheckCircle2,
        filter: "entregado",
      },
    ],
    [kpis, metodo]
  );

  const nextAction = (ef: string, fulfillment?: string) => {
    if (ef === "pago_pendiente") {
      return {
        label: "Confirmar pago (manual)",
        estado: "pago_confirmado",
        hint: "Úsalo si Mercado Pago aún no confirmó el cobro.",
      };
    }
    if (ef === "pago_confirmado") {
      return { label: "Marcar preparando", estado: "preparando" };
    }
    if (ef === "preparando") {
      if (fulfillment === "delivery" || fulfillment === "provincia") {
        return { label: "Marcar en camino", estado: "en_camino" };
      }
      return { label: "Listo para recoger", estado: "listo_recoger" };
    }
    if (ef === "en_camino") {
      return { label: "Marcar entregado", estado: "entregado" };
    }
    return null;
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Pedidos
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Retiro, delivery y envíos a provincia
          </p>
        </div>
        <AdminBranchFilterBar />
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {borrar.selected.length > 0 && (
            <Button
              variant="destructive"
              className="w-full sm:w-auto min-h-11"
              onClick={() => {
                const byId = new Map(
                  ordenes.map((o: Record<string, unknown>) => [
                    Number(o.id_orden),
                    String(o.codigo || ""),
                  ])
                );
                borrar.askDelete(
                  borrar.selected.map((id) => ({
                    id_orden: id,
                    codigo: byId.get(id) || `#${id}`,
                  }))
                );
              }}
            >
              <Trash2 className="size-4 mr-1.5" />
              Borrar ({borrar.selected.length})
            </Button>
          )}
          <Button asChild className="w-full sm:w-auto min-h-11">
            <Link to="/ecommerce-admin/validar-retiro">
              <ScanLine className="size-4 mr-1.5" />
              Recojo
            </Link>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {kpiCards.map((k) => (
          <button
            key={k.label}
            type="button"
            onClick={() => setEstado(k.filter)}
            className={cn(
              "text-left rounded-xl border bg-white p-3 sm:p-4 transition-colors",
              estado === k.filter
                ? "border-stone-900 ring-1 ring-stone-900"
                : "border-stone-200 hover:border-stone-300"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] sm:text-xs uppercase tracking-wide text-stone-500">
                {k.label}
              </p>
              <k.icon className="size-3.5 text-stone-300 shrink-0" />
            </div>
            <p className="text-xl sm:text-2xl font-semibold mt-1 tabular-nums">
              {k.value}
            </p>
          </button>
        ))}
      </div>

      {/* Buscador + filtros */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
          <Input
            placeholder="Buscar código, email, nombre…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 h-11 bg-white"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {FILTROS_METODO.map((e) => (
            <Button
              key={`m-${e.value}`}
              size="sm"
              variant={metodo === e.value ? "default" : "outline"}
              className="shrink-0 rounded-full h-9"
              onClick={() => setMetodo(e.value)}
            >
              {e.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {FILTROS.map((e) => (
            <Button
              key={e.value}
              size="sm"
              variant={estado === e.value ? "default" : "outline"}
              className="shrink-0 rounded-full h-9"
              onClick={() => setEstado(e.value)}
            >
              {e.label}
            </Button>
          ))}
        </div>
      </div>

      {!listQ.isLoading && ordenes.length > 0 && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="text-xs text-stone-500 hover:text-stone-800"
            onClick={() => borrar.toggleAll(ordenes.map((o: Record<string, unknown>) => Number(o.id_orden)))}
          >
            {ordenes.every((o: Record<string, unknown>) =>
              borrar.selected.includes(Number(o.id_orden))
            )
              ? "Quitar selección"
              : "Seleccionar todos"}
          </button>
        </div>
      )}

      {/* Lista */}
      {listQ.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-xl bg-stone-100 animate-pulse"
            />
          ))}
        </div>
      ) : ordenes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-200 bg-white py-16 text-center">
          <Package className="size-8 mx-auto text-stone-300" />
          <p className="mt-3 text-stone-500 text-sm">No hay pedidos con este filtro</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {ordenes.map((o: Record<string, unknown>) => {
            const ef = String(o.estado_fulfillment || "");
            const id = Number(o.id_orden);
            const isSelected = borrar.selected.includes(id);
            return (
              <article
                key={String(o.id_orden)}
                className={cn(
                  "text-left bg-white border rounded-xl p-4 transition-all",
                  isSelected ? "border-stone-900 ring-1 ring-stone-900" : "border-stone-200 hover:border-stone-400"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => borrar.toggle(id)}
                        aria-label={`Seleccionar ${String(o.codigo)}`}
                      />
                      <button
                        type="button"
                        onClick={() => setSelectedId(id)}
                        className="font-semibold font-mono text-sm truncate text-left hover:underline"
                      >
                        {String(o.codigo)}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedId(id)}
                      className="mt-2 w-full text-left"
                    >
                      <div className="flex flex-wrap gap-1.5">
                        <EstadoBadge estado={ef} />
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-stone-100 text-stone-600">
                          {METODO_LABEL[String(o.fulfillment || "pickup")] || String(o.fulfillment)}
                        </span>
                      </div>
                    </button>
                  </div>
                  <div className="flex items-start gap-1 shrink-0">
                    <p className="text-sm font-semibold text-teal-700 tabular-nums pt-0.5">
                      {formatPen(Number(o.total))}
                    </p>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 -mt-1"
                      aria-label={`Borrar ${String(o.codigo)}`}
                      onClick={() =>
                        borrar.askDelete([{ id_orden: id, codigo: String(o.codigo || "") }])
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedId(id)}
                  className="mt-3 w-full text-left space-y-1 text-xs text-stone-500"
                >
                  <p className="truncate flex items-center gap-1.5">
                    <User className="size-3 shrink-0" />
                    {String(o.nombre_comprador || o.email_comprador || "—")}
                  </p>
                  {Boolean(o.sucursal_nombre) && (
                    <p className="truncate flex items-center gap-1.5">
                      <MapPin className="size-3 shrink-0" />
                      {String(o.sucursal_nombre)}
                    </p>
                  )}
                  <p className="text-stone-400">
                    {new Date(String(o.created_at)).toLocaleString("es-PE", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </button>
              </article>
            );
          })}
        </div>
      )}

      {/* Detalle */}
      <Sheet
        open={selectedId != null}
        onOpenChange={(open) => !open && setSelectedId(null)}
      >
        <SheetContent
          side="right"
          className="w-full max-w-none sm:max-w-md p-0 flex flex-col gap-0"
        >
          <SheetHeader className="px-4 sm:px-6 pt-5 pb-4 border-b border-stone-100 text-left space-y-1">
            <SheetTitle className="font-mono text-base sm:text-lg">
              {detalle?.codigo || "Pedido"}
            </SheetTitle>
            <SheetDescription className="sr-only">
              Detalle del pedido para retiro
            </SheetDescription>
            {detalle && (
              <div className="pt-1 flex flex-wrap gap-1.5">
                <EstadoBadge estado={detalle.estado_fulfillment} />
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-stone-100 text-stone-600">
                  {METODO_LABEL[String(detalle.fulfillment || "pickup")] ||
                    String(detalle.fulfillment)}
                </span>
              </div>
            )}
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-5">
            {detailQ.isLoading ? (
              <div className="space-y-3">
                <div className="h-16 rounded-lg bg-stone-100 animate-pulse" />
                <div className="h-24 rounded-lg bg-stone-100 animate-pulse" />
              </div>
            ) : detalle ? (
              <>
                <section className="space-y-2 text-sm">
                  <p className="text-xs uppercase tracking-wide text-stone-400 font-medium">
                    Cliente
                  </p>
                  <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3 space-y-2">
                    {(detalle.nombre_comprador || detalle.email_comprador) && (
                      <p className="flex items-start gap-2">
                        <User className="size-4 mt-0.5 text-stone-400 shrink-0" />
                        <span className="font-medium">
                          {detalle.nombre_comprador || "—"}
                        </span>
                      </p>
                    )}
                    {detalle.email_comprador && (
                      <p className="flex items-start gap-2 text-stone-600">
                        <Mail className="size-4 mt-0.5 text-stone-400 shrink-0" />
                        <span className="break-all">{detalle.email_comprador}</span>
                      </p>
                    )}
                    {detalle.telefono_comprador && (
                      <p className="flex items-start gap-2 text-stone-600">
                        <Phone className="size-4 mt-0.5 text-stone-400 shrink-0" />
                        {detalle.telefono_comprador}
                      </p>
                    )}
                    {(detalle.sucursal_nombre || detalle.pickup_direccion) && (
                      <p className="flex items-start gap-2 text-stone-600">
                        <MapPin className="size-4 mt-0.5 text-stone-400 shrink-0" />
                        <span>
                          {detalle.sucursal_nombre}
                          {detalle.pickup_direccion
                            ? ` · ${detalle.pickup_direccion}`
                            : ""}
                        </span>
                      </p>
                    )}
                    {Number(detalle.costo_envio) > 0 && (
                      <p className="text-stone-600 text-xs pt-1">
                        Envío: {formatPen(Number(detalle.costo_envio))}
                      </p>
                    )}
                    {detalle.entrega_json && (
                      <div className="text-xs text-stone-600 pt-1 space-y-0.5 border-t border-stone-200 mt-2">
                        {detalle.entrega_json.direccion && (
                          <p>Dir: {detalle.entrega_json.direccion}</p>
                        )}
                        {detalle.entrega_json.distrito && (
                          <p>Distrito: {detalle.entrega_json.distrito}</p>
                        )}
                        {detalle.entrega_json.referencia && (
                          <p>Ref: {detalle.entrega_json.referencia}</p>
                        )}
                      </div>
                    )}
                  </div>
                </section>

                {detalle.codigo_retiro && (
                  <section className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-center">
                    <p className="text-xs uppercase tracking-wide text-teal-700">
                      Código de retiro
                    </p>
                    <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-teal-900">
                      {detalle.codigo_retiro}
                    </p>
                  </section>
                )}

                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wide text-stone-400 font-medium">
                      Productos
                    </p>
                    <p className="text-sm font-semibold text-teal-700 tabular-nums">
                      {formatPen(Number(detalle.total))}
                    </p>
                  </div>
                  <ul className="rounded-xl border border-stone-200 divide-y divide-stone-100 overflow-hidden">
                    {(detalle.items || []).map(
                      (it: Record<string, unknown>, i: number) => (
                        <li
                          key={i}
                          className="flex justify-between gap-3 px-3 py-2.5 text-sm bg-white"
                        >
                          <span className="min-w-0">
                            <span className="font-medium">{String(it.nombre)}</span>
                            <span className="text-stone-400"> ×{Number(it.cantidad)}</span>
                            <AttrsSnapshotText snapshot={it.attrs_snapshot} />
                          </span>
                          {it.precio_unitario != null && (
                            <span className="text-stone-500 shrink-0 tabular-nums">
                              {formatPen(
                                Number(it.precio_unitario) * Number(it.cantidad)
                              )}
                            </span>
                          )}
                        </li>
                      )
                    )}
                  </ul>
                </section>

                {Array.isArray(detalle.historial) && detalle.historial.length > 0 && (
                  <section className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-stone-400 font-medium">
                      Historial
                    </p>
                    <ul className="space-y-2 text-xs text-stone-500">
                      {detalle.historial.map(
                        (h: Record<string, unknown>, i: number) => (
                          <li
                            key={i}
                            className="flex gap-2 border-l-2 border-stone-200 pl-3"
                          >
                            <span className="text-stone-400 shrink-0">
                              {new Date(String(h.created_at)).toLocaleString("es-PE", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span>
                              {ESTADO_META[String(h.estado_nuevo)]?.label ||
                                String(h.estado_nuevo)}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </section>
                )}
              </>
            ) : null}
          </div>

          {/* Acciones sticky */}
          {detalle && (
            <div className="border-t border-stone-100 bg-white px-4 sm:px-6 py-4 space-y-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {(() => {
                const action = nextAction(
                  detalle.estado_fulfillment,
                  detalle.fulfillment
                );
                if (!action) {
                  if (detalle.estado_fulfillment === "listo_recoger") {
                    return (
                      <Button asChild className="w-full min-h-12">
                        <Link to="/ecommerce-admin/validar-retiro">
                          <ScanLine className="size-4 mr-1.5" />
                          Ir a recojo
                        </Link>
                      </Button>
                    );
                  }
                  return (
                    <p className="text-center text-sm text-stone-500 py-1">
                      Sin acciones pendientes
                    </p>
                  );
                }
                return (
                  <>
                    {action.hint && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                        {action.hint}
                      </p>
                    )}
                    <Button
                      className="w-full min-h-12"
                      disabled={patchMut.isPending}
                      onClick={() =>
                        patchMut.mutate({
                          id: detalle.id_orden,
                          estado_fulfillment: action.estado,
                        })
                      }
                    >
                      {patchMut.isPending ? "Guardando…" : action.label}
                    </Button>
                  </>
                );
              })()}
              <Button
                type="button"
                variant="outline"
                className="w-full min-h-11 text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => {
                  borrar.askDelete([
                    { id_orden: detalle.id_orden, codigo: String(detalle.codigo || "") },
                  ]);
                  setSelectedId(null);
                }}
              >
                <Trash2 className="size-4 mr-1.5" />
                Borrar pedido
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={borrar.dialog.open}
        onClose={borrar.closeConfirm}
        onConfirm={borrar.dialog.confirm}
        title={borrar.dialog.title}
        description={borrar.dialog.description}
        confirmLabel="Sí, borrar"
        variant="danger"
        isPending={borrar.mut.isPending}
      />
    </div>
  );
}
