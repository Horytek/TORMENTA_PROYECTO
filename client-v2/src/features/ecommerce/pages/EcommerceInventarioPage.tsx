import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  adminAjustarInventario,
  adminInventarioMatriz,
  adminInventarioResumen,
  adminListMovimientos,
  adminListSucursales,
} from "../api/ecommerce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 25;

type MatrizRow = {
  id_variante: number;
  id_sucursal: number;
  nombre: string;
  sucursal_nombre: string;
  stock_fisico: number;
  reservado: number;
  comprometido?: number;
  disponible: number;
  sku?: string;
};

function rowKey(r: MatrizRow) {
  return `${r.id_variante}-${r.id_sucursal}`;
}

function StockCell({
  row,
  onStockUpdated,
  onFallbackRefresh,
}: {
  row: MatrizRow;
  onStockUpdated?: (updated: { stock_fisico: number; disponible: number }) => void;
  onFallbackRefresh?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(row.stock_fisico));
  const [saving, setSaving] = useState(false);
  const [localStock, setLocalStock] = useState<number>(Number(row.stock_fisico) || 0);
  const pendingDeltaRef = useRef<number>(0);
  const localRowRef = useRef(row);

  useEffect(() => {
    localRowRef.current = row;
    if (!editing && !saving) setLocalStock(Number(row.stock_fisico) || 0);
  }, [row, editing, saving]);

  const commitToServer = async (delta: number) => {
    const { id_variante, id_sucursal } = localRowRef.current;
    const resp = await adminAjustarInventario({
      id_variante,
      id_sucursal,
      delta,
      motivo: "Ajuste admin",
    });
    return resp?.data?.stock_fisico ?? null;
  };

  const applyDeltaQueued = async (delta: number) => {
    if (delta === 0) return;

    // Optimistic UI: se aplica al instante.
    setLocalStock((s) => Math.max(0, s + delta));

    pendingDeltaRef.current += delta;
    if (saving) return; // ya hay una request en curso: acumulamos delta

    setSaving(true);
    try {
      let lastServerStock: number | null = null;
      // Procesa hasta que la cola esté vacía (si el usuario toca varias veces).
      while (pendingDeltaRef.current !== 0) {
        const netDelta = pendingDeltaRef.current;
        pendingDeltaRef.current = 0;
        const serverStock = await commitToServer(netDelta);
        lastServerStock = typeof serverStock === "number" ? serverStock : lastServerStock;

        if (typeof serverStock === "number") {
          setLocalStock(serverStock);
          const reservado = Number(localRowRef.current.reservado ?? 0);
          const comprometido = Number(localRowRef.current.comprometido ?? 0);
          const disponible = Math.max(0, serverStock - reservado - comprometido);
          onStockUpdated?.({ stock_fisico: serverStock, disponible });
        }
      }

      toast.success("Stock actualizado");
      // onStockUpdated ya actualizó la fila; no invalidamos la lista completa.
    } catch (e) {
      // Si falla, recargamos la fila (la matriz es la fuente de verdad).
      toast.error(e instanceof Error ? e.message : "Error al ajustar");
      setLocalStock(Number(localRowRef.current.stock_fisico) || 0);
      pendingDeltaRef.current = 0;
      onFallbackRefresh?.();
    } finally {
      setSaving(false);
    }
  };

  const applyAbsolute = async () => {
    if (saving) return;
    const nuevo = Math.max(0, Math.floor(Number(draft)));
    if (!Number.isFinite(nuevo)) {
      setDraft(String(localRowRef.current.stock_fisico));
      setEditing(false);
      return;
    }
    const delta = nuevo - Number(localStock);
    if (delta === 0) {
      setEditing(false);
      return;
    }
    // Mientras el input está abierto, el UI se controla con `localStock`.
    setLocalStock(nuevo);
    setEditing(false);
    await applyDeltaQueued(delta);
  };

  if (editing) {
    return (
      <Input
        type="number"
        min={0}
        autoFocus
        disabled={saving}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void applyAbsolute()}
        onKeyDown={(e) => {
          if (e.key === "Enter") void applyAbsolute();
          if (e.key === "Escape") {
            setDraft(String(row.stock_fisico));
            setEditing(false);
          }
        }}
        className="h-9 w-20 text-center"
      />
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="size-9 shrink-0"
        disabled={saving || localStock <= 0}
        onClick={() => void applyDeltaQueued(-1)}
        aria-label="Reducir stock"
      >
        <Minus className="size-4" />
      </Button>
      <button
        type="button"
        disabled={saving}
        onClick={() => {
          setDraft(String(localStock));
          setEditing(true);
        }}
        className="min-w-[2.5rem] h-9 px-2 text-sm font-medium rounded-md hover:bg-stone-100 disabled:opacity-50"
        title="Click para editar cantidad"
      >
        {saving ? "…" : localStock}
      </button>
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="size-9 shrink-0"
        disabled={saving}
        onClick={() => void applyDeltaQueued(1)}
        aria-label="Aumentar stock"
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}

export default function EcommerceInventarioPage() {
  const qc = useQueryClient();
  const [filtroSucursal, setFiltroSucursal] = useState<number | "">("");
  const [busqueda, setBusqueda] = useState("");
  const [busquedaAplicada, setBusquedaAplicada] = useState("");
  const [page, setPage] = useState(0);
  const [movOpen, setMovOpen] = useState(false);
  const queryKeyMatriz = useMemo(() => ["ecom-inv-matriz", filtroSucursal, page, busquedaAplicada] as const, [
    filtroSucursal,
    page,
    busquedaAplicada,
  ]);

  const resumenQ = useQuery({ queryKey: ["ecom-inv-resumen"], queryFn: adminInventarioResumen });
  const sucQ = useQuery({ queryKey: ["ecom-sucursales"], queryFn: adminListSucursales });
  const matrizQ = useQuery({
    queryKey: ["ecom-inv-matriz", filtroSucursal, page, busquedaAplicada],
    queryFn: () =>
      adminInventarioMatriz({
        sucursal: filtroSucursal ? Number(filtroSucursal) : undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        q: busquedaAplicada || undefined,
      }),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
  const movQ = useQuery({ queryKey: ["ecom-inv-mov"], queryFn: () => adminListMovimientos(30) });

  const kpis = resumenQ.data?.data;
  const matriz = (matrizQ.data?.data || []) as MatrizRow[];
  const total = matrizQ.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const movimientos = movQ.data?.data || [];
  const sucursales = sucQ.data?.data || [];

  const refreshMatriz = () => {
    qc.invalidateQueries({ queryKey: queryKeyMatriz });
  };

  const aplicarBusqueda = () => {
    setBusquedaAplicada(busqueda.trim());
    setPage(0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Inventario</h1>
        <p className="text-sm text-stone-500">Stock por sucursal — ajusta con +/− o click en la cantidad</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Agotados", value: kpis?.agotados ?? "—" },
          { label: "Stock bajo", value: kpis?.stock_bajo ?? "—" },
          { label: "Reservado", value: kpis?.reservado_total ?? "—" },
          { label: "En tránsito", value: kpis?.en_transito_total ?? "—" },
          { label: "Transf. pend.", value: kpis?.transferencias_pendientes ?? "—" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-stone-200 bg-white p-4">
            <p className="text-xs text-stone-500">{k.label}</p>
            <p className="text-2xl font-semibold mt-1">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-stone-500 block mb-1">Sucursal</label>
          <select
            className="h-9 rounded-md border border-stone-200 px-2 text-sm min-w-[10rem]"
            value={filtroSucursal}
            onChange={(e) => {
              setFiltroSucursal(e.target.value ? Number(e.target.value) : "");
              setPage(0);
            }}
          >
            <option value="">Todas</option>
            {sucursales.map((s: { id_sucursal: number; nombre: string }) => (
              <option key={s.id_sucursal} value={s.id_sucursal}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[12rem]">
          <label className="text-xs text-stone-500 block mb-1">Buscar producto</label>
          <div className="flex gap-2">
            <Input
              placeholder="Nombre o SKU…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && aplicarBusqueda()}
              className="h-9"
            />
            <Button type="button" variant="outline" size="sm" className="h-9" onClick={aplicarBusqueda}>
              Buscar
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
        {/* Desktop */}
        <div className="hidden lg:block overflow-x-auto">
          {matrizQ.isLoading && matriz.length === 0 ? (
            <p className="p-6 text-sm text-stone-500">Cargando inventario…</p>
          ) : matriz.length === 0 ? (
            <p className="p-6 text-sm text-stone-500">Sin registros para este filtro.</p>
          ) : (
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-stone-50 text-left">
                <tr>
                  <th className="p-3">Producto</th>
                  <th className="p-3">Sucursal</th>
                  <th className="p-3">Físico</th>
                  <th className="p-3">Reservado</th>
                  <th className="p-3">Disponible</th>
                </tr>
              </thead>
              <tbody>
                {matriz.map((r) => (
                  <tr key={rowKey(r)} className="border-t border-stone-100">
                    <td className="p-3">
                      <p className="font-medium">{r.nombre}</p>
                      {r.sku ? <p className="text-xs text-stone-400">{r.sku}</p> : null}
                    </td>
                    <td className="p-3">{r.sucursal_nombre}</td>
                    <td className="p-3">
                      <StockCell
                        row={r}
                        onStockUpdated={(u) => {
                          // Actualizamos solo la fila en caché; evitamos refetch para no recargar toda la página.
                          qc.setQueryData(queryKeyMatriz, (old: any) => {
                            if (!old?.data) return old;
                            const next = old.data.map((it: any) => {
                              if (it.id_variante === r.id_variante && it.id_sucursal === r.id_sucursal) {
                                return { ...it, stock_fisico: u.stock_fisico, disponible: u.disponible };
                              }
                              return it;
                            });
                            return { ...old, data: next };
                          });
                        }}
                        onFallbackRefresh={refreshMatriz}
                      />
                    </td>
                    <td className="p-3">{r.reservado}</td>
                    <td className="p-3 font-medium">{r.disponible}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile */}
        <div className="lg:hidden">
          {matrizQ.isLoading && matriz.length === 0 ? (
            <p className="p-6 text-sm text-stone-500">Cargando inventario…</p>
          ) : matriz.length === 0 ? (
            <p className="p-6 text-sm text-stone-500">Sin registros para este filtro.</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {matriz.map((r) => (
                <div key={rowKey(r)} className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{r.nombre}</p>
                      {r.sku ? <p className="text-xs text-stone-400 mt-0.5">{r.sku}</p> : null}
                      <p className="text-xs store-muted mt-1">Sucursal: {r.sucursal_nombre}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-500">Físico</span>
                      <StockCell
                        row={r}
                        onStockUpdated={(u) => {
                          qc.setQueryData(queryKeyMatriz, (old: any) => {
                            if (!old?.data) return old;
                            const next = old.data.map((it: any) => {
                              if (it.id_variante === r.id_variante && it.id_sucursal === r.id_sucursal) {
                                return { ...it, stock_fisico: u.stock_fisico, disponible: u.disponible };
                              }
                              return it;
                            });
                            return { ...old, data: next };
                          });
                        }}
                        onFallbackRefresh={refreshMatriz}
                      />
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-stone-500">Reservado: {r.reservado}</p>
                      <p className="text-xs font-semibold mt-0.5">Disp.: {r.disponible}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-stone-600">
            Página {page + 1} de {totalPages} · {total} registros
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 0 || matrizQ.isFetching}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="size-4 mr-1" />
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1 || matrizQ.isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
              <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-stone-200 bg-white">
        <button
          type="button"
          className="w-full flex items-center justify-between p-4 text-left font-semibold text-sm"
          onClick={() => setMovOpen((o) => !o)}
        >
          Movimientos recientes
          {movOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
        {movOpen && (
          <ul className="px-4 pb-4 space-y-2 max-h-64 overflow-y-auto text-xs border-t border-stone-100 pt-3">
            {movimientos.length === 0 ? (
              <li className="text-stone-500">Sin movimientos recientes.</li>
            ) : (
              movimientos.map((m: Record<string, unknown>) => (
                <li key={String(m.id_mov)} className="border-b border-stone-100 pb-2">
                  <span className="font-medium">{String(m.tipo)}</span> · {String(m.producto_nombre || "")} ·{" "}
                  {String(m.sucursal_nombre || "")} · qty {String(m.cantidad)}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
