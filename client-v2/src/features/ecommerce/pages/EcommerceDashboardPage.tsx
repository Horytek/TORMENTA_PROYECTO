import { useQuery } from "@tanstack/react-query";
import { ecommerceDashboard } from "../api/ecommerce";
import { Link } from "react-router-dom";

export default function EcommerceDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["ecom-dashboard"],
    queryFn: ecommerceDashboard,
  });
  const stats = data?.data?.stats;
  const recientes = data?.data?.recientes || [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-stone-500 text-sm mt-1">Resumen de tu tienda online.</p>
      </div>
      {isLoading ? (
        <p className="text-sm text-stone-400">Cargando…</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Productos", value: stats?.productos ?? 0 },
            { label: "Órdenes", value: stats?.ordenes_aprobadas ?? 0 },
            { label: "Ventas", value: `S/ ${Number(stats?.ventas || 0).toFixed(2)}` },
            { label: "Stock bajo", value: stats?.stock_bajo ?? 0 },
          ].map((c) => (
            <div key={c.label} className="rounded-xl border border-stone-200 bg-white p-4">
              <div className="text-[11px] uppercase tracking-wider text-stone-400">{c.label}</div>
              <div className="text-xl font-semibold mt-1">{c.value}</div>
            </div>
          ))}
        </div>
      )}
      <div className="rounded-xl border border-stone-200 bg-white">
        <div className="px-4 py-3 border-b border-stone-100 flex justify-between items-center">
          <h2 className="font-medium text-sm">Órdenes recientes</h2>
          <Link to="/ecommerce-admin/ordenes" className="text-xs text-teal-700 hover:underline">
            Ver todas
          </Link>
        </div>
        <ul className="divide-y divide-stone-100">
          {recientes.length === 0 && (
            <li className="px-4 py-6 text-sm text-stone-400">Aún no hay órdenes.</li>
          )}
          {recientes.map((o: { id_orden: number; codigo: string; estado: string; total: number; email_comprador?: string }) => (
            <li key={o.id_orden} className="px-4 py-3 flex justify-between text-sm">
              <span>
                <span className="font-medium">{o.codigo}</span>
                <span className="text-stone-400 ml-2">{o.email_comprador}</span>
              </span>
              <span>
                <span className="text-stone-500 mr-3">{o.estado}</span>
                S/ {Number(o.total).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
