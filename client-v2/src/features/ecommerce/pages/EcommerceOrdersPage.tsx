import { useQuery } from "@tanstack/react-query";
import { ecommerceListOrdenes } from "../api/ecommerce";

export default function EcommerceOrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["ecom-ordenes"],
    queryFn: ecommerceListOrdenes,
  });
  const ordenes = data?.data || [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Órdenes</h1>
        <p className="text-stone-500 text-sm mt-1">Pedidos del storefront pagados con Mercado Pago.</p>
      </div>
      <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-stone-500">
            <tr>
              <th className="px-4 py-2 font-medium">Código</th>
              <th className="px-4 py-2 font-medium">Estado</th>
              <th className="px-4 py-2 font-medium">Comprador</th>
              <th className="px-4 py-2 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-stone-400">
                  Cargando…
                </td>
              </tr>
            )}
            {!isLoading && ordenes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-stone-400">
                  Sin órdenes todavía.
                </td>
              </tr>
            )}
            {ordenes.map(
              (o: {
                id_orden: number;
                codigo: string;
                estado: string;
                email_comprador?: string;
                total: number;
              }) => (
                <tr key={o.id_orden}>
                  <td className="px-4 py-3 font-medium">{o.codigo}</td>
                  <td className="px-4 py-3 capitalize">{o.estado}</td>
                  <td className="px-4 py-3 text-stone-500">{o.email_comprador || "—"}</td>
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
