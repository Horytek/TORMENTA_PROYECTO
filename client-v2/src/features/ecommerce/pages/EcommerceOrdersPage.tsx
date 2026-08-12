import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";
import { ecommerceListOrdenes } from "../api/ecommerce";
import { useEcommerceAuthStore } from "../store/useEcommerceAuthStore";
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
  const { data, isLoading } = useQuery({
    queryKey: ["ecom-ordenes", tid],
    queryFn: ecommerceListOrdenes,
    enabled: Boolean(tid),
  });
  const ordenes = data?.data || [];
  const [estado, setEstado] = useState<string>("all");

  const filtradas = useMemo(() => {
    if (estado === "all") return ordenes;
    return ordenes.filter((o: { estado: string }) => o.estado === estado);
  }, [ordenes, estado]);

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Órdenes</h1>
          <p className="text-stone-500 text-sm mt-1">
            Pago (Mercado Pago) y estado de retiro en tienda.
          </p>
        </div>
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

      {/* Móvil: cards */}
      <div className="sm:hidden space-y-3">
        {isLoading && <p className="text-stone-400 text-sm px-1">Cargando…</p>}
        {!isLoading && filtradas.length === 0 && (
          <div className="rounded-xl border border-stone-200 bg-white py-12 text-center">
            <ShoppingBag className="size-8 mx-auto text-stone-200 mb-2" />
            <p className="text-stone-400 text-sm">Sin órdenes todavía.</p>
          </div>
        )}
        {filtradas.map(
          (o: {
            id_orden: number;
            codigo: string;
            estado: string;
            estado_fulfillment?: string;
            email_comprador?: string;
            total: number;
            created_at?: string;
          }) => (
            <article
              key={o.id_orden}
              className="rounded-xl border border-stone-200 bg-white p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-mono text-sm font-semibold truncate">{o.codigo}</p>
                <p className="text-sm font-semibold tabular-nums shrink-0">
                  S/ {Number(o.total).toFixed(2)}
                </p>
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
          )
        )}
      </div>

      {/* Desktop: tabla */}
      <div className="hidden sm:block rounded-xl border border-stone-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-stone-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Código</th>
              <th className="px-4 py-2.5 font-medium">Pago MP</th>
              <th className="px-4 py-2.5 font-medium">Retiro</th>
              <th className="px-4 py-2.5 font-medium">Comprador</th>
              <th className="px-4 py-2.5 font-medium">Fecha</th>
              <th className="px-4 py-2.5 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-stone-400">
                  Cargando…
                </td>
              </tr>
            )}
            {!isLoading && filtradas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <ShoppingBag className="size-8 mx-auto text-stone-200 mb-2" />
                  <p className="text-stone-400">Sin órdenes todavía.</p>
                </td>
              </tr>
            )}
            {filtradas.map(
              (o: {
                id_orden: number;
                codigo: string;
                estado: string;
                estado_fulfillment?: string;
                email_comprador?: string;
                total: number;
                created_at?: string;
              }) => (
                <tr key={o.id_orden}>
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
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
