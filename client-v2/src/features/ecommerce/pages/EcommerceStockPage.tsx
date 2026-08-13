import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Warehouse } from "lucide-react";
import { adminListStock } from "../api/ecommerce";
import { useEcommerceAuthStore } from "../store/useEcommerceAuthStore";
import { AdminBranchFilterBar, useScopedSucursalId } from "../components/admin/AdminBranchFilterBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 50;

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

function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
        ESTADO_CLASS[estado] || "bg-stone-100 text-stone-600"
      )}
    >
      {estado}
    </span>
  );
}

function varianteLabel(r: Row) {
  return [r.talla, r.color].filter(Boolean).join(" · ") || "—";
}

export default function EcommerceStockPage() {
  const tid = useEcommerceAuthStore((s) => s.user?.id_tienda);
  const id_sucursal = useScopedSucursalId();
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [estado, setEstado] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setQDebounced(q.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(0);
  }, [id_sucursal, estado]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["ecom-stock", tid, id_sucursal, qDebounced, estado, page],
    queryFn: () =>
      adminListStock({
        q: qDebounced || undefined,
        id_sucursal,
        estado: estado || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
    enabled: Boolean(tid),
  });
  const rows = (data?.data || []) as Row[];
  const total = Number(data?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Stock</h1>
          <p className="text-stone-500 text-sm mt-1">
            Consulta de inventario. Los ajustes se hacen en Inventario.
          </p>
        </div>
        <AdminBranchFilterBar />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Input
          className="w-full sm:max-w-xs min-h-11"
          placeholder="Buscar producto o SKU"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="w-full sm:w-auto min-h-11 rounded-md border border-stone-200 px-3 text-sm bg-white"
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
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-stone-200 bg-white">
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
                    <td className="px-3 py-2 text-stone-500">{varianteLabel(r)}</td>
                    <td className="px-3 py-2">{r.sucursal}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.disponible}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.reservado}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.total}</td>
                    <td className="px-3 py-2">
                      <EstadoBadge estado={r.estado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {rows.map((r, i) => (
              <div
                key={`${r.id_producto}-${r.sku}-${r.sucursal}-${i}`}
                className="rounded-xl border border-stone-200 bg-white p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{r.producto}</p>
                    <p className="text-[11px] text-stone-400 font-mono mt-0.5">
                      {r.sku || r.sku_producto || "—"}
                    </p>
                  </div>
                  <EstadoBadge estado={r.estado} />
                </div>
                <p className="text-xs text-stone-500 mt-2">
                  {r.sucursal}
                  {varianteLabel(r) !== "—" ? ` · ${varianteLabel(r)}` : ""}
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center rounded-lg bg-stone-50 py-2">
                  <div>
                    <p className="text-[10px] uppercase text-stone-400">Disp.</p>
                    <p className="text-sm font-semibold tabular-nums">{r.disponible}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-stone-400">Res.</p>
                    <p className="text-sm font-semibold tabular-nums">{r.reservado}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-stone-400">Total</p>
                    <p className="text-sm font-semibold tabular-nums">{r.total}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-stone-600">
                Página {page + 1} de {totalPages} · {total} filas
                {isFetching ? " · …" : ""}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-11"
                  disabled={page <= 0 || isFetching}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="size-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-11"
                  disabled={page >= totalPages - 1 || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                  <ChevronRight className="size-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
