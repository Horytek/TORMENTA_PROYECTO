import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";
import { ecommerceListOrdenes } from "../api/ecommerce";

export default function EcommerceOrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["ecom-ordenes"],
    queryFn: ecommerceListOrdenes,
  });
  const ordenes = data?.data || [];
  const [estado, setEstado] = useState<string>("all");

  const filtradas = useMemo(() => {
    if (estado === "all") return ordenes;
    return ordenes.filter((o: { estado: string }) => o.estado === estado);
  }, [ordenes, estado]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Órdenes</h1>
          <p className="text-stone-500 text-sm mt-1">Pedidos del storefront pagados con Mercado Pago.</p>
        </div>
        <select
          className="h-9 rounded-md border border-stone-200 px-2 text-sm"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
        >
          <option value="all">Todos</option>
          <option value="pending">pending</option>
          <option value="approved">approved</option>
          <option value="rejected">rejected</option>
          <option value="cancelled">cancelled</option>
        </select>
      </div>
      <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-stone-500">
            <tr>
              <th className="px-4 py-2 font-medium">Código</th>
              <th className="px-4 py-2 font-medium">Estado</th>
              <th className="px-4 py-2 font-medium">Comprador</th>
              <th className="px-4 py-2 font-medium">Fecha</th>
              <th className="px-4 py-2 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-stone-400">
                  Cargando…
                </td>
              </tr>
            )}
            {!isLoading && filtradas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
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
                email_comprador?: string;
                total: number;
                created_at?: string;
              }) => (
                <tr key={o.id_orden}>
                  <td className="px-4 py-3 font-medium">{o.codigo}</td>
                  <td className="px-4 py-3 capitalize">{o.estado}</td>
                  <td className="px-4 py-3 text-stone-500">{o.email_comprador || "—"}</td>
                  <td className="px-4 py-3 text-stone-400 text-xs">
                    {o.created_at ? new Date(o.created_at).toLocaleString("es-PE") : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">S/ {Number(o.total).toFixed(2)}</td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
