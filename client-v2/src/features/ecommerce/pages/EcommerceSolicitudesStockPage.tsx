import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Clock,
  MapPin,
  Package,
  User,
  XCircle,
} from "lucide-react";
import {
  adminAprobarSolicitud,
  adminCancelarSolicitud,
  adminEnRevisionSolicitud,
  adminGetSolicitud,
  adminListSolicitudes,
  adminRechazarSolicitud,
  adminStatsSolicitudes,
} from "../api/ecommerce";
import { AdminBranchFilterBar, useScopedSucursalId } from "../components/admin/AdminBranchFilterBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Solicitud = {
  id_solicitud: number;
  codigo: string;
  estado: string;
  producto_nombre?: string;
  sucursal_nombre?: string;
  nombre_cliente?: string;
  cantidad_solicitada: number;
  cantidad_aprobada?: number | null;
  attrs_json?: Record<string, unknown>;
  created_at?: string;
  expires_at?: string | null;
  comentario_cliente?: string | null;
  motivo_rechazo?: string | null;
  inventario?: {
    fisico: number;
    reservado: number;
    comprometido: number;
    disponible: number;
  };
  stock_sistema?: number | null;
  stock_fisico?: number | null;
  observacion_stock?: string | null;
  disponibilidad_config?: { reserva_al_aprobar?: boolean; validez_confirmacion_min?: number };
};

const KPI = [
  { key: "pendiente", label: "Pendientes" },
  { key: "en_revision", label: "En revisión" },
  { key: "aprobada", label: "Aprobadas" },
  { key: "rechazada", label: "Rechazadas" },
  { key: "expirada", label: "Expiradas" },
  { key: "total", label: "Total" },
] as const;

const TONE: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-900",
  en_revision: "bg-sky-100 text-sky-900",
  aprobada: "bg-emerald-100 text-emerald-900",
  rechazada: "bg-red-100 text-red-800",
  expirada: "bg-stone-100 text-stone-600",
  cancelada: "bg-stone-200 text-stone-700",
};

function estadoLabel(estado: string) {
  return estado.replace(/_/g, " ").toUpperCase();
}

function attrsLines(attrs?: Record<string, unknown> | null) {
  if (!attrs || typeof attrs !== "object") return [];
  return Object.entries(attrs).map(([k, v]) => `${k}: ${String(v)}`);
}

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

/** Alineado a Tailwind `lg` (1024px): lista+detalle vs sheet móvil. */
function useIsCompactLayout() {
  const [compact, setCompact] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 1024 : true
  );
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1023px)");
    const onChange = () => setCompact(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return compact;
}

type DetailFormProps = {
  detail: Solicitud;
  stockFisico: string;
  setStockFisico: (v: string) => void;
  obs: string;
  setObs: (v: string) => void;
  qtyAprobar: string;
  setQtyAprobar: (v: string) => void;
  crearReserva: boolean;
  setCrearReserva: (v: boolean) => void;
  motivo: string;
  setMotivo: (v: string) => void;
  comentario: string;
  setComentario: (v: string) => void;
  onAprobar: () => void;
  onRechazar: () => void;
  onCancelar: () => void;
  aprobarPending: boolean;
  rechazarPending: boolean;
  cancelPending: boolean;
  stickyActions?: boolean;
};

function SolicitudDetailForm({
  detail,
  stockFisico,
  setStockFisico,
  obs,
  setObs,
  qtyAprobar,
  setQtyAprobar,
  crearReserva,
  setCrearReserva,
  motivo,
  setMotivo,
  comentario,
  setComentario,
  onAprobar,
  onRechazar,
  onCancelar,
  aprobarPending,
  rechazarPending,
  cancelPending,
  stickyActions = false,
}: DetailFormProps) {
  const editable = detail.estado === "pendiente" || detail.estado === "en_revision";
  const sys = detail.inventario?.disponible;
  const fis = stockFisico === "" ? null : Number(stockFisico);
  const diff = sys != null && fis != null && Number.isFinite(fis) && Number(sys) !== Number(fis);

  const actions = editable ? (
    <div className={cn("flex flex-col gap-2", stickyActions && "sm:flex-row")}>
      <Button
        className="h-12 w-full sm:flex-1 bg-emerald-700 hover:bg-emerald-800 text-base"
        disabled={aprobarPending}
        onClick={onAprobar}
      >
        <CheckCircle2 className="size-4 mr-1.5" />
        Confirmar disponibilidad
      </Button>
      <Button
        variant="destructive"
        className="h-12 w-full sm:flex-1 text-base"
        disabled={rechazarPending}
        onClick={onRechazar}
      >
        <XCircle className="size-4 mr-1.5" />
        No disponible
      </Button>
      <Button
        variant="outline"
        className="h-11 w-full sm:w-auto"
        disabled={cancelPending}
        onClick={onCancelar}
      >
        Cancelar solicitud
      </Button>
    </div>
  ) : null;

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className={cn("space-y-4", stickyActions && "pb-4")}>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full", TONE[detail.estado])}>
              {estadoLabel(detail.estado)}
            </span>
            <span className="font-mono text-xs text-stone-500">#{detail.codigo}</span>
          </div>
          <h2 className="text-lg font-semibold leading-snug">{detail.producto_nombre}</h2>
          <div className="flex flex-col gap-1.5 text-sm text-stone-600">
            <p className="flex items-center gap-2">
              <User className="size-4 text-stone-400 shrink-0" />
              {detail.nombre_cliente || "Cliente"}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="size-4 text-stone-400 shrink-0" />
              {detail.sucursal_nombre || "Sucursal"}
            </p>
            <p className="flex items-center gap-2">
              <Package className="size-4 text-stone-400 shrink-0" />
              Cantidad solicitada: <strong>{detail.cantidad_solicitada}</strong>
            </p>
          </div>
        </div>

        {attrsLines(detail.attrs_json).length > 0 && (
          <ul className="rounded-xl border border-stone-200 bg-stone-50/80 px-3 py-2.5 text-sm space-y-1">
            {attrsLines(detail.attrs_json).map((l) => (
              <li key={l} className="text-stone-700">
                {l}
              </li>
            ))}
          </ul>
        )}

        <div className="rounded-xl bg-stone-50 border border-stone-100 p-3 text-sm grid grid-cols-2 gap-2">
          <div className="col-span-2 font-medium text-stone-700 mb-0.5">Inventario registrado</div>
          <div>
            Físico: <strong>{detail.inventario?.fisico ?? "—"}</strong>
          </div>
          <div>
            Reservado: <strong>{detail.inventario?.reservado ?? "—"}</strong>
          </div>
          <div>
            Comprometido: <strong>{detail.inventario?.comprometido ?? "—"}</strong>
          </div>
          <div>
            Disponible: <strong>{detail.inventario?.disponible ?? "—"}</strong>
          </div>
        </div>

        {editable && (
          <>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="stock-fisico">Stock físico confirmado</Label>
                <Input
                  id="stock-fisico"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className="h-11 text-base"
                  value={stockFisico}
                  onChange={(e) => setStockFisico(e.target.value)}
                />
                {diff && (
                  <p className="text-xs text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    Hay diferencia entre el stock registrado ({sys}) y el físico ({fis}).
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="obs-stock">Observación</Label>
                <Textarea
                  id="obs-stock"
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  rows={2}
                  className="text-base"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qty-aprobar">Cantidad a aprobar</Label>
                <Input
                  id="qty-aprobar"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={detail.cantidad_solicitada}
                  className="h-11 text-base"
                  value={qtyAprobar}
                  onChange={(e) => setQtyAprobar(e.target.value)}
                />
              </div>
              <label className="flex items-start gap-3 text-sm min-h-11 py-1">
                <input
                  type="checkbox"
                  className="mt-1 size-4"
                  checked={crearReserva}
                  onChange={(e) => setCrearReserva(e.target.checked)}
                />
                <span>Crear reserva temporal al aprobar</span>
              </label>
            </div>

            {!stickyActions && actions}

            <div className="space-y-2 border-t border-stone-100 pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Si no hay stock</p>
              <div className="space-y-1.5">
                <Label htmlFor="motivo-rechazo">Motivo de rechazo</Label>
                <select
                  id="motivo-rechazo"
                  className="w-full border border-stone-200 rounded-md h-11 px-3 text-sm bg-white"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                >
                  <option value="agotado">Agotado</option>
                  <option value="no_disponible_sucursal">No disponible en esta sucursal</option>
                  <option value="variante_no_disponible">Variante no disponible</option>
                  <option value="cantidad_insuficiente">Cantidad insuficiente</option>
                  <option value="error_inventario">Error de inventario</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comentario-cliente">Comentario para el cliente</Label>
                <Textarea
                  id="comentario-cliente"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  rows={2}
                  className="text-base"
                />
              </div>
            </div>
          </>
        )}

        {detail.estado === "aprobada" && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-900">
            Disponibilidad confirmada
            {detail.expires_at && <> hasta {new Date(detail.expires_at).toLocaleString()}</>}.
            Cantidad: {detail.cantidad_aprobada ?? detail.cantidad_solicitada}
          </div>
        )}
        {detail.estado === "rechazada" && (
          <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-900">
            Rechazada{detail.motivo_rechazo ? `: ${detail.motivo_rechazo}` : ""}.
            {detail.comentario_cliente && <p className="mt-1 text-red-800">{detail.comentario_cliente}</p>}
          </div>
        )}
        {(detail.estado === "expirada" || detail.estado === "cancelada") && (
          <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 text-sm text-stone-600">
            Esta solicitud está {detail.estado.replace("_", " ")} y ya no admite acciones.
          </div>
        )}
      </div>

      {stickyActions && actions && (
        <div className="sticky bottom-0 -mx-4 sm:-mx-6 mt-auto border-t border-stone-200 bg-white/95 backdrop-blur px-4 sm:px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {actions}
        </div>
      )}
    </div>
  );
}

export default function EcommerceSolicitudesStockPage() {
  const qc = useQueryClient();
  const idSucursal = useScopedSucursalId();
  const isCompact = useIsCompactLayout();
  const [filtro, setFiltro] = useState("pendiente");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [stockFisico, setStockFisico] = useState("");
  const [obs, setObs] = useState("");
  const [qtyAprobar, setQtyAprobar] = useState("");
  const [crearReserva, setCrearReserva] = useState(true);
  const [motivo, setMotivo] = useState("agotado");
  const [comentario, setComentario] = useState("");

  const statsQ = useQuery({
    queryKey: ["ecom-sol-stats", idSucursal],
    queryFn: () => adminStatsSolicitudes(idSucursal),
  });
  const listQ = useQuery({
    queryKey: ["ecom-sol-list", idSucursal, filtro],
    queryFn: () =>
      adminListSolicitudes({
        estado: filtro || null,
        id_sucursal: idSucursal,
        limit: 80,
      }),
  });
  const detailQ = useQuery({
    queryKey: ["ecom-sol-detail", selectedId],
    queryFn: () => adminGetSolicitud(selectedId!),
    enabled: Boolean(selectedId),
  });

  const stats = (statsQ.data?.data || {}) as Record<string, number>;
  const rows = (listQ.data?.data || []) as Solicitud[];
  const detail = detailQ.data?.data as Solicitud | undefined;

  useEffect(() => {
    if (!detail) return;
    setStockFisico(
      detail.stock_fisico != null
        ? String(detail.stock_fisico)
        : detail.inventario?.disponible != null
          ? String(detail.inventario.disponible)
          : ""
    );
    setQtyAprobar(String(detail.cantidad_aprobada || detail.cantidad_solicitada || 1));
    setCrearReserva(detail.disponibilidad_config?.reserva_al_aprobar !== false);
    setObs(detail.observacion_stock || "");
  }, [detail?.id_solicitud]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["ecom-sol-stats"] });
    qc.invalidateQueries({ queryKey: ["ecom-sol-list"] });
    qc.invalidateQueries({ queryKey: ["ecom-sol-detail"] });
  };

  const revisionMut = useMutation({
    mutationFn: (id: number) => adminEnRevisionSolicitud(id),
    onSuccess: () => {
      toast.success("En revisión");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const aprobarMut = useMutation({
    mutationFn: () =>
      adminAprobarSolicitud(selectedId!, {
        cantidad_aprobada: Number(qtyAprobar) || undefined,
        stock_sistema: detail?.inventario?.disponible,
        stock_fisico: stockFisico === "" ? null : Number(stockFisico),
        observacion_stock: obs || null,
        crear_reserva: crearReserva,
      }),
    onSuccess: () => {
      toast.success("Disponibilidad confirmada");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rechazarMut = useMutation({
    mutationFn: () =>
      adminRechazarSolicitud(selectedId!, {
        motivo_rechazo: motivo,
        comentario_cliente: comentario || null,
        stock_sistema: detail?.inventario?.disponible,
        stock_fisico: stockFisico === "" ? null : Number(stockFisico),
        observacion_stock: obs || null,
      }),
    onSuccess: () => {
      toast.success("Solicitud rechazada");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelMut = useMutation({
    mutationFn: () => adminCancelarSolicitud(selectedId!, { motivo: "Cancelada por staff" }),
    onSuccess: () => {
      toast.success("Solicitud cancelada");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openVerify = (s: Solicitud) => {
    setSelectedId(s.id_solicitud);
    if (s.estado === "pendiente") revisionMut.mutate(s.id_solicitud);
  };

  const closeDetail = () => setSelectedId(null);

  const formProps: Omit<DetailFormProps, "detail" | "stickyActions"> | null = detail
    ? {
        stockFisico,
        setStockFisico,
        obs,
        setObs,
        qtyAprobar,
        setQtyAprobar,
        crearReserva,
        setCrearReserva,
        motivo,
        setMotivo,
        comentario,
        setComentario,
        onAprobar: () => aprobarMut.mutate(),
        onRechazar: () => rechazarMut.mutate(),
        onCancelar: () => cancelMut.mutate(),
        aprobarPending: aprobarMut.isPending,
        rechazarPending: rechazarMut.isPending,
        cancelPending: cancelMut.isPending,
      }
    : null;

  const listPanel = (
    <div className="space-y-3">
      {listQ.isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-stone-100 animate-pulse" />
          ))}
        </div>
      )}
      {!listQ.isLoading && rows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-200 p-10 text-center text-sm text-stone-500">
          No hay solicitudes en este filtro.
        </div>
      )}
      {rows.map((s) => {
        const actionable = s.estado === "pendiente" || s.estado === "en_revision";
        return (
          <button
            key={s.id_solicitud}
            type="button"
            onClick={() => openVerify(s)}
            className={cn(
              "w-full text-left rounded-2xl border bg-white p-4 sm:p-5 space-y-2.5 transition active:scale-[0.99]",
              "min-h-[7.5rem] touch-manipulation",
              selectedId === s.id_solicitud
                ? "border-teal-600 ring-2 ring-teal-100 shadow-sm"
                : "border-stone-200 hover:border-teal-400 hover:shadow-sm"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full", TONE[s.estado])}>
                {estadoLabel(s.estado)}
              </span>
              <span className="text-xs text-stone-400 flex items-center gap-1 shrink-0">
                <Clock className="size-3.5" /> {timeAgo(s.created_at)}
              </span>
            </div>
            <div className="font-mono text-[11px] text-stone-400">#{s.codigo}</div>
            <div className="font-semibold text-[15px] leading-snug text-stone-900">
              {s.producto_nombre || `Producto #${s.id_solicitud}`}
            </div>
            <ul className="text-sm text-stone-600 space-y-0.5">
              {attrsLines(s.attrs_json).map((l) => (
                <li key={l}>{l}</li>
              ))}
              <li>Cantidad: {s.cantidad_solicitada}</li>
            </ul>
            <div className="text-xs text-stone-500 flex items-center gap-1.5 pt-0.5">
              <User className="size-3.5 shrink-0" />
              <span className="truncate">
                {s.nombre_cliente || "Cliente"} · {s.sucursal_nombre || "Sucursal"}
              </span>
            </div>
            {actionable && (
              <div className="pt-1">
                <span className="inline-flex items-center justify-center h-10 w-full sm:w-auto sm:px-4 rounded-xl bg-teal-600 text-white text-sm font-semibold">
                  Verificar stock
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4 p-3 sm:p-6 max-w-6xl mx-auto pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <ClipboardList className="size-5 shrink-0" />
            <span className="truncate">Solicitudes de stock</span>
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Confirma disponibilidad física. No es un pedido ni una venta.
          </p>
        </div>
        <AdminBranchFilterBar />
      </div>

      {/* KPIs = único filtro (evita pills duplicadas en móvil) */}
      <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {KPI.map(({ key, label }) => {
          const active = key === "total" ? filtro === "" : filtro === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFiltro(key === "total" ? "" : key)}
              className={cn(
                "rounded-xl border px-2.5 py-2.5 sm:px-3 text-left min-h-[4.25rem] touch-manipulation transition",
                active ? "border-teal-600 bg-teal-50 shadow-sm" : "border-stone-200 bg-white active:bg-stone-50"
              )}
            >
              <div className="text-[10px] sm:text-xs text-stone-500 leading-tight">{label}</div>
              <div className="text-xl font-semibold tabular-nums mt-0.5">{stats[key] ?? 0}</div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-stone-500">
          {listQ.isLoading ? "Cargando…" : `${rows.length} solicitud${rows.length === 1 ? "" : "es"}`}
        </p>
        <button
          type="button"
          className="text-xs text-stone-500 underline lg:hidden"
          onClick={() => setFiltro("cancelada")}
        >
          Ver canceladas
        </button>
      </div>

      {/* Desktop: lista + detalle lado a lado */}
      <div className="hidden lg:grid lg:grid-cols-2 gap-4 items-start">
        {listPanel}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 min-h-[28rem] sticky top-4">
          {!selectedId && (
            <div className="h-full min-h-[24rem] flex flex-col items-center justify-center text-center px-6">
              <ClipboardList className="size-10 text-stone-300 mb-3" />
              <p className="text-sm font-medium text-stone-700">Selecciona una solicitud</p>
              <p className="text-sm text-stone-500 mt-1">
                Toca una tarjeta de la izquierda para verificar el stock físico.
              </p>
            </div>
          )}
          {selectedId && detailQ.isLoading && (
            <div className="space-y-3">
              <div className="h-8 w-40 rounded bg-stone-100 animate-pulse" />
              <div className="h-24 rounded-xl bg-stone-100 animate-pulse" />
              <div className="h-40 rounded-xl bg-stone-100 animate-pulse" />
            </div>
          )}
          {selectedId && detailQ.isError && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
              No se pudo cargar el detalle. Intenta de nuevo.
              <Button variant="outline" className="mt-3 w-full" onClick={() => detailQ.refetch()}>
                Reintentar
              </Button>
            </div>
          )}
          {detail && formProps && <SolicitudDetailForm detail={detail} {...formProps} />}
        </div>
      </div>

      {/* Móvil / tablet: solo lista; detalle en Sheet a pantalla completa */}
      <div className="lg:hidden">{listPanel}</div>

      <Sheet
        open={isCompact && selectedId != null}
        onOpenChange={(open) => !open && closeDetail()}
      >
        <SheetContent
          side="right"
          className="w-full max-w-none sm:max-w-lg p-0 flex flex-col gap-0"
        >
          <SheetHeader className="px-4 pt-4 pb-3 border-b border-stone-100 text-left space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeDetail}
                className="size-10 -ml-1 inline-flex items-center justify-center rounded-xl hover:bg-stone-100 touch-manipulation"
                aria-label="Volver a la lista"
              >
                <ArrowLeft className="size-5" />
              </button>
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-base truncate">Verificar stock</SheetTitle>
                <SheetDescription className="text-xs truncate">
                  {detail?.codigo ? `#${detail.codigo}` : "Cargando solicitud…"}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-4 flex flex-col min-h-0">
            {detailQ.isLoading && (
              <div className="space-y-3">
                <div className="h-8 w-48 rounded bg-stone-100 animate-pulse" />
                <div className="h-28 rounded-xl bg-stone-100 animate-pulse" />
                <div className="h-40 rounded-xl bg-stone-100 animate-pulse" />
              </div>
            )}
            {detailQ.isError && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
                No se pudo cargar el detalle.
                <Button variant="outline" className="mt-3 w-full h-11" onClick={() => detailQ.refetch()}>
                  Reintentar
                </Button>
              </div>
            )}
            {detail && formProps && (
              <SolicitudDetailForm detail={detail} {...formProps} stickyActions />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
