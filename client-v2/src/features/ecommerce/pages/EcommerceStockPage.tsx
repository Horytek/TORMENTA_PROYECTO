import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Warehouse } from "lucide-react";
import { adminListStock } from "../api/ecommerce";
import { useEcommerceAuthStore } from "../store/useEcommerceAuthStore";
import { AdminBranchFilterBar, useScopedSucursalId } from "../components/admin/AdminBranchFilterBar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Row = {
  id_producto: number;
  producto: string;
  sku: string | null;
  sku_producto: string | null;
  talla: string | null;
  color: string | null;
  sucursal: string;
  disponible: number;
  reservado: number;
  total: number;
  estado: "ok" | "bajo" | "agotado";
};

const ESTADO_CLASS: Record<string, string> = {
  ok: "bg-emerald-50 text-emerald-800",
  bajo: "bg-amber-50 text-amber-800",
  agotado: "bg-red-50 text-red-700",
};

export default function EcommerceStockPage() {
  const tid = useEcommerceAuthStore((s) => s.user?.id_tienda);
  const id_sucursal = useScopedSucursalId();
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["ecom-stock", tid, id_sucursal, q, estado],
    queryFn: () =>
      adminListStock({
        q: q || undefined,
        id_sucursal,
        estado: estado || undefined,
      }),
    enabled: Boolean(tid),
  });
  const rows = (data?.data || []) as Row[];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Stock</h1>
          <p className="text-stone-500 text-sm mt-1">Consulta de inventario. Los ajustes se hacen en Inventario.</p>
        </div>
        <AdminBranchFilterBar />
      </div>
      <div className="flex flex-wrap gap-2">
        <Input
          className="max-w-xs"
          placeholder="Buscar producto o SKU"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="h-9 rounded-md border border-stone-200 px-2 text-sm"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
        >
          <option value="">Todos</option>
          <option value="ok">OK</option>
          <option value="bajo">Stock bajo</option>
          <option value="agotado">Agotado</option>
        </select>
      </div>
      {isLoading ? (
        <p className="text-sm text-stone-400">Cargando…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center">
          <Warehouse className="size-8 mx-auto text-stone-300 mb-3" />
          <p className="font-medium">Sin filas de stock</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-stone-400 border-b">
              <tr>
                <th className="px-3 py-2">Producto</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Variante</th>
                <th className="px-3 py-2">Sucursal</th>
                <th className="px-3 py-2 text-right">Disp.</th>
                <th className="px-3 py-2 text-right">Res.</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r, i) => (
                <tr key={`${r.id_producto}-${r.sku}-${r.sucursal}-${i}`}>
                  <td className="px-3 py-2 font-medium">{r.producto}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.sku || r.sku_producto || "—"}</td>
                  <td className="px-3 py-2 text-stone-500">
                    {[r.talla, r.color].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="px-3 py-2">{r.sucursal}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.disponible}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.reservado}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.total}</td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                        ESTADO_CLASS[r.estado]
                      )}
                    >
                      {r.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
