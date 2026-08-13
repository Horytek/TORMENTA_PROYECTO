import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Trash2 } from "lucide-react";
import { ecommerceListOrdenes } from "../api/ecommerce";
import { useEcommerceAuthStore } from "../store/useEcommerceAuthStore";
import { AdminBranchFilterBar, useScopedSucursalId } from "../components/admin/AdminBranchFilterBar";
import { useBorrarOrdenes } from "../hooks/useBorrarOrdenes";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const PAGO_LABEL: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendiente", className: "bg-amber-50 text-amber-800" },
  approved: { label: "Aprobado", className: "bg-emerald-50 text-emerald-700" },
  rejected: { label: "Rechazado", className: "bg-red-50 text-red-700" },
  cancelled: { label: "Cancelado", className: "bg-stone-100 text-stone-600" },
};

const RETIRO_LABEL: Record<string, { label: string; className: string }> = {
  pago_pendiente: { label: "Pago pendiente", className: "bg-amber-50 text-amber-800" },
  pago_confirmado: { label: "Por preparar", className: "bg-sky-50 text-sky-800" },
  preparando: { label: "Preparando", className: "bg-violet-50 text-violet-800" },
  listo_recoger: { label: "Listo retiro", className: "bg-teal-50 text-teal-800" },
  entregado: { label: "Entregado", className: "bg-emerald-50 text-emerald-700" },
  cancelado: { label: "Cancelado", className: "bg-stone-100 text-stone-600" },
};

type OrdenRow = {
  id_orden: number;
  codigo: string;
  estado: string;
  estado_fulfillment?: string;
  email_comprador?: string;
  total: number;
  created_at?: string;
};

function Badge({
  map,
  value,
}: {
  map: Record<string, { label: string; className: string }>;
  value?: string | null;
}) {
  const meta = (value && map[value]) || {
    label: value || "—",
    className: "bg-stone-100 text-stone-600",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap",
        meta.className
      )}
    >
      {meta.label}
    </span>
  );
}

export default function EcommerceOrdersPage() {
  const tid = useEcommerceAuthStore((s) => s.user?.id_tienda);
  const id_sucursal = useScopedSucursalId();
  const { data, isLoading } = useQuery({
    queryKey: ["ecom-ordenes", tid, id_sucursal],
    queryFn: () => ecommerceListOrdenes({ id_sucursal }),
    enabled: Boolean(tid),
  });
  const ordenes: OrdenRow[] = data?.data || [];
  const [estado, setEstado] = useState<string>("all");
  const borrar = useBorrarOrdenes([["ecom-ordenes"], ["pickup-ordenes"]]);

  const filtradas = useMemo(() => {
    if (estado === "all") return ordenes;
    return ordenes.filter((o) => o.estado === estado);
  }, [ordenes, estado]);

  const visibleIds = filtradas.map((o) => o.id_orden);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => borrar.selected.includes(id));
  const someVisibleSelected = visibleIds.some((id) => borrar.selected.includes(id));
  const selectedOnPage = filtradas.filter((o) => borrar.selected.includes(o.id_orden));

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Órdenes</h1>
          <p className="text-stone-500 text-sm mt-1">
            Pago (Mercado Pago) y estado de retiro en tienda.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <AdminBranchFilterBar />
          {selectedOnPage.length > 0 && (
            <Button
              variant="destructive"
              className="min-h-10"
              onClick={() => borrar.askDelete(selectedOnPage)}
            >
              <Trash2 className="size-4" />
              Borrar ({selectedOnPage.length})
            </Button>
          )}
          <select
            className="h-10 rounded-md border border-stone-200 px-2 text-sm bg-white"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            <option value="all">Todos los pagos</option>
            <option value="pending">Pago pendiente</option>
            <option value="approved">Pago aprobado</option>
            <option value="rejected">Rechazado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>

      {filtradas.length > 0 && (
        <div className="sm:hidden">
          <button
            type="button"
            className="text-xs text-stone-500 hover:text-stone-800"
            onClick={() => borrar.toggleAll(visibleIds)}
          >
            {allVisibleSelected ? "Quitar selección" : "Seleccionar todos"}
          </button>
        </div>
      )}

      {/* Móvil: cards */}
      <div className="sm:hidden space-y-3">
        {isLoading && <p className="text-stone-400 text-sm px-1">Cargando…</p>}
        {!isLoading && filtradas.length === 0 && (
          <div className="rounded-xl border border-stone-200 bg-white py-12 text-center">
            <ShoppingBag className="size-8 mx-auto text-stone-200 mb-2" />
            <p className="text-stone-400 text-sm">Sin órdenes todavía.</p>
          </div>
        )}
        {filtradas.map((o) => (
          <article
            key={o.id_orden}
            className={cn(
              "rounded-xl border bg-white p-4 space-y-2",
              borrar.selected.includes(o.id_orden)
                ? "border-stone-900"
                : "border-stone-200"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <label className="flex items-center gap-2 min-w-0">
                <Checkbox
                  checked={borrar.selected.includes(o.id_orden)}
                  onCheckedChange={() => borrar.toggle(o.id_orden)}
                  aria-label={`Seleccionar ${o.codigo}`}
                />
                <p className="font-mono text-sm font-semibold truncate">{o.codigo}</p>
              </label>
              <div className="flex items-center gap-1 shrink-0">
                <p className="text-sm font-semibold tabular-nums">
                  S/ {Number(o.total).toFixed(2)}
                </p>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700"
                  aria-label={`Borrar ${o.codigo}`}
                  onClick={() => borrar.askDelete([o])}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge map={PAGO_LABEL} value={o.estado} />
              <Badge map={RETIRO_LABEL} value={o.estado_fulfillment} />
            </div>
            <p className="text-xs text-stone-500 truncate">{o.email_comprador || "—"}</p>
            {o.created_at && (
              <p className="text-[11px] text-stone-400">
                {new Date(o.created_at).toLocaleString("es-PE")}
              </p>
            )}
          </article>
        ))}
      </div>

      {/* Desktop: tabla */}
      <div className="hidden sm:block rounded-xl border border-stone-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-stone-500">
            <tr>
              <th className="px-4 py-2.5 w-10">
                <Checkbox
                  checked={
                    allVisibleSelected
                      ? true
                      : someVisibleSelected
                        ? "indeterminate"
                        : false
                  }
                  onCheckedChange={() => borrar.toggleAll(visibleIds)}
                  aria-label="Seleccionar todas"
                  disabled={visibleIds.length === 0}
                />
              </th>
              <th className="px-4 py-2.5 font-medium">Código</th>
              <th className="px-4 py-2.5 font-medium">Pago MP</th>
              <th className="px-4 py-2.5 font-medium">Retiro</th>
              <th className="px-4 py-2.5 font-medium">Comprador</th>
              <th className="px-4 py-2.5 font-medium">Fecha</th>
              <th className="px-4 py-2.5 font-medium text-right">Total</th>
              <th className="px-4 py-2.5 w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-stone-400">
                  Cargando…
                </td>
              </tr>
            )}
            {!isLoading && filtradas.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <ShoppingBag className="size-8 mx-auto text-stone-200 mb-2" />
                  <p className="text-stone-400">Sin órdenes todavía.</p>
                </td>
              </tr>
            )}
            {filtradas.map((o) => (
              <tr
                key={o.id_orden}
                className={cn(borrar.selected.includes(o.id_orden) && "bg-stone-50")}
              >
                <td className="px-4 py-3">
                  <Checkbox
                    checked={borrar.selected.includes(o.id_orden)}
                    onCheckedChange={() => borrar.toggle(o.id_orden)}
                    aria-label={`Seleccionar ${o.codigo}`}
                  />
                </td>
                <td className="px-4 py-3 font-medium font-mono text-xs">{o.codigo}</td>
                <td className="px-4 py-3">
                  <Badge map={PAGO_LABEL} value={o.estado} />
                </td>
                <td className="px-4 py-3">
                  <Badge map={RETIRO_LABEL} value={o.estado_fulfillment} />
                </td>
                <td className="px-4 py-3 text-stone-500 max-w-[12rem] truncate">
                  {o.email_comprador || "—"}
                </td>
                <td className="px-4 py-3 text-stone-400 text-xs whitespace-nowrap">
                  {o.created_at ? new Date(o.created_at).toLocaleString("es-PE") : "—"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  S/ {Number(o.total).toFixed(2)}
                </td>
                <td className="px-2 py-3">
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700"
                    aria-label={`Borrar ${o.codigo}`}
                    onClick={() => borrar.askDelete([o])}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
