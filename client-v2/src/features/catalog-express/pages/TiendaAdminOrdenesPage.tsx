import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";
import { adminListPedidos } from "../api/catalogoPublico";
import { cn } from "@/lib/utils";

const PAGO_FILTERS = [
  { value: "", label: "Todos los pagos" },
  { value: "pending", label: "Pendiente" },
  { value: "approved", label: "Aprobado" },
  { value: "rejected", label: "Rechazado" },
  { value: "cancelled", label: "Cancelado" },
];

const PAGO_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  cancelled: "bg-stone-100 text-stone-600",
};

type Pedido = {
  id_pedido: number;
  codigo: string;
  estado: string;
  total: number;
  mp_status?: string | null;
  mp_payment_id?: string | null;
  comprador_email?: string;
  comprador_nombre?: string;
  created_at?: string;
  paid_at?: string | null;
  id_venta?: number | null;
};

export default function TiendaAdminOrdenesPage() {
  const [mpStatus, setMpStatus] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["tienda-admin-ordenes", mpStatus],
    queryFn: () => adminListPedidos(mpStatus ? { mp_status: mpStatus } : undefined),
  });

  const ordenes = (data || []) as Pedido[];

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight flex items-center gap-2">
            <ShoppingBag className="size-6" /> Órdenes
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Estado de pago Mercado Pago y vínculo a venta ERP.
          </p>
        </div>
        <select
          className="h-10 rounded-md border border-stone-200 px-2 text-sm bg-white"
          value={mpStatus}
          onChange={(e) => setMpStatus(e.target.value)}
        >
          {PAGO_FILTERS.map((f) => (
            <option key={f.value || "all"} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs text-stone-500">
            <tr>
              <th className="px-3 py-2">Código</th>
              <th className="px-3 py-2">Cliente</th>
              <th className="px-3 py-2">Pago MP</th>
              <th className="px-3 py-2">Fulfillment</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Venta</th>
            </tr>
          </thead>
          <tbody>
            {ordenes.map((o) => (
              <tr key={o.id_pedido} className="border-t border-stone-100">
                <td className="px-3 py-2 font-mono text-xs">
                  {o.codigo}
                  {o.mp_payment_id && (
                    <div className="text-[10px] text-stone-400 mt-0.5">MP {o.mp_payment_id}</div>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div>{o.comprador_nombre || "—"}</div>
                  <div className="text-[11px] text-stone-400">{o.comprador_email}</div>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                      PAGO_STYLE[o.mp_status || ""] || "bg-stone-100 text-stone-600"
                    )}
                  >
                    {o.mp_status || "—"}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs">{o.estado}</td>
                <td className="px-3 py-2 whitespace-nowrap">S/ {Number(o.total).toFixed(2)}</td>
                <td className="px-3 py-2 text-xs font-mono">{o.id_venta ? `#${o.id_venta}` : "—"}</td>
              </tr>
            ))}
            {!isLoading && ordenes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-stone-400 text-sm">
                  Sin órdenes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
