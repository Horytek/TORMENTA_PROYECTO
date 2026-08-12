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
import { useEcommerceAuthStore } from "../store/useEcommerceAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 15;

type MatrizRow = {
  id_producto: number;
  id_variante: number;
  id_sucursal: number;
  nombre: string;
  sucursal_nombre: string;
  stock_fisico: number;
  reservado: number;
  comprometido?: number;
  disponible: number;
  sku?: string;
  talla?: string | null;
  color?: string | null;
};

type ProductGroup = {
  id_producto: number;
  nombre: string;
  sku?: string;
  rows: MatrizRow[];
  totalFisico: number;
  totalReservado: number;
  totalDisponible: number;
};

function rowKey(r: MatrizRow) {
  return `${r.id_variante}-${r.id_sucursal}`;
}

function groupByProducto(rows: MatrizRow[]): ProductGroup[] {
  const map = new Map<number, ProductGroup>();
  for (const r of rows) {
    const id = Number(r.id_producto);
    let g = map.get(id);
    if (!g) {
      g = {
        id_producto: id,
        nombre: r.nombre,
        sku: r.sku,
        rows: [],
        totalFisico: 0,
        totalReservado: 0,
        totalDisponible: 0,
      };
      map.set(id, g);
    }
    g.rows.push(r);
    g.totalFisico += Number(r.stock_fisico) || 0;
    g.totalReservado += Number(r.reservado) || 0;
    g.totalDisponible += Number(r.disponible) || 0;
  }
  return Array.from(map.values());
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

    setLocalStock((s) => Math.max(0, s + delta));
    pendingDeltaRef.current += delta;
    if (saving) return;

    setSaving(true);
    try {
      while (pendingDeltaRef.current !== 0) {
        const netDelta = pendingDeltaRef.current;
        pendingDeltaRef.current = 0;
        const serverStock = await commitToServer(netDelta);

        if (typeof serverStock === "number") {
          setLocalStock(serverStock);
          const reservado = Number(localRowRef.current.reservado ?? 0);
          const comprometido = Number(localRowRef.current.comprometido ?? 0);
          const disponible = Math.max(0, serverStock - reservado - comprometido);
          onStockUpdated?.({ stock_fisico: serverStock, disponible });
        }
      }
      toast.success("Stock actualizado");
    } catch (e) {
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
        className="size-8 shrink-0"
        disabled={saving || localStock <= 0}
        onClick={() => void applyDeltaQueued(-1)}
        aria-label="Reducir stock"
      >
        <Minus className="size-3.5" />
      </Button>
      <button
        type="button"
        disabled={saving}
        onClick={() => {
          setDraft(String(localStock));
          setEditing(true);
        }}
        className="min-w-[2.25rem] h-8 px-2 text-sm font-medium rounded-md hover:bg-stone-100 disabled:opacity-50"
        title="Click para editar cantidad"
      >
        {saving ? "…" : localStock}
      </button>
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="size-8 shrink-0"
        disabled={saving}
        onClick={() => void applyDeltaQueued(1)}
        aria-label="Aumentar stock"
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  );
}

function patchMatrizCache(
  qc: ReturnType<typeof useQueryClient>,
  queryKey: readonly unknown[],
  row: MatrizRow,
  u: { stock_fisico: number; disponible: number }
) {
  qc.setQueryData(queryKey, (old: any) => {
    if (!old?.data) return old;
    const next = old.data.map((it: any) => {
      if (it.id_variante === row.id_variante && it.id_sucursal === row.id_sucursal) {
        return { ...it, stock_fisico: u.stock_fisico, disponible: u.disponible };
      }
      return it;
    });
    return { ...old, data: next };
  });
}

export default function EcommerceInventarioPage() {
  const qc = useQueryClient();
  const tid = useEcommerceAuthStore((s) => s.user?.id_tienda);
  const [filtroSucursal, setFiltroSucursal] = useState<number | "">("");
  const [busqueda, setBusqueda] = useState("");
  const [busquedaAplicada, setBusquedaAplicada] = useState("");
  const [page, setPage] = useState(0);
  const [movOpen, setMovOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const queryKeyMatriz = useMemo(
    () => ["ecom-inv-matriz", tid, filtroSucursal, page, busquedaAplicada] as const,
    [tid, filtroSucursal, page, busquedaAplicada]
  );

  const resumenQ = useQuery({
    queryKey: ["ecom-inv-resumen", tid],
    queryFn: adminInventarioResumen,
    enabled: Boolean(tid),
  });
  const sucQ = useQuery({
    queryKey: ["ecom-sucursales", tid],
    queryFn: () => adminListSucursales(),
    enabled: Boolean(tid),
  });
  const matrizQ = useQuery({
    queryKey: queryKeyMatriz,
    queryFn: () =>
      adminInventarioMatriz({
        sucursal: filtroSucursal ? Number(filtroSucursal) : undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        q: busquedaAplicada || undefined,
      }),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    enabled: Boolean(tid),
  });
  const movQ = useQuery({
    queryKey: ["ecom-inv-mov", tid],
    queryFn: () => adminListMovimientos(30),
    enabled: Boolean(tid),
  });

  const kpis = resumenQ.data?.data;
  const matriz = (matrizQ.data?.data || []) as MatrizRow[];
  const groups = useMemo(() => groupByProducto(matriz), [matriz]);
  const total = matrizQ.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const movimientos = movQ.data?.data || [];
  const sucursales = sucQ.data?.data || [];
  const singleSucursal = Boolean(filtroSucursal);

  const refreshMatriz = () => {
    qc.invalidateQueries({ queryKey: queryKeyMatriz });
  };

  const aplicarBusqueda = () => {
    setBusquedaAplicada(busqueda.trim());
    setPage(0);
  };

  const isOpen = (id: number) => {
    if (singleSucursal) return true;
    if (expanded[id] !== undefined) return expanded[id];
    // Por defecto abierto para ver stock por sucursal sin clicks extra.
    return true;
  };

  const toggleGroup = (id: number) => {
    if (singleSucursal) return;
    setExpanded((prev) => ({ ...prev, [id]: !isOpen(id) }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Inventario</h1>
        <p className="text-sm text-stone-500">
          Stock por producto y sucursal — ajusta con +/− o click en la cantidad
        </p>
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
        {matrizQ.isLoading && groups.length === 0 ? (
          <p className="p-6 text-sm text-stone-500">Cargando inventario…</p>
        ) : groups.length === 0 ? (
          <p className="p-6 text-sm text-stone-500">Sin registros para este filtro.</p>
        ) : (
          <div className="divide-y divide-stone-100">
            {groups.map((g) => {
              const open = isOpen(g.id_producto);
              return (
                <div key={g.id_producto}>
                  <button
                    type="button"
                    className="w-full flex items-start justify-between gap-3 p-3 sm:p-4 text-left hover:bg-stone-50/80"
                    onClick={() => toggleGroup(g.id_producto)}
                    aria-expanded={open}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm sm:text-base">{g.nombre}</p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {g.sku ? `${g.sku} · ` : ""}
                        {g.rows.length} {g.rows.length === 1 ? "sucursal" : "sucursales"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-[11px] uppercase tracking-wide text-stone-400">Total disp.</p>
                        <p className="text-sm font-semibold tabular-nums">{g.totalDisponible}</p>
                      </div>
                      {!singleSucursal ? (
                        open ? (
                          <ChevronUp className="size-4 text-stone-400 mt-1" />
                        ) : (
                          <ChevronDown className="size-4 text-stone-400 mt-1" />
                        )
                      ) : null}
                    </div>
                  </button>

                  {open ? (
                    <div className="px-3 pb-3 sm:px-4 sm:pb-4">
                      {/* Desktop nested table */}
                      <div className="hidden md:block rounded-lg border border-stone-100 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-stone-50 text-left text-xs text-stone-500">
                            <tr>
                              <th className="px-3 py-2 font-medium">Sucursal</th>
                              <th className="px-3 py-2 font-medium">Físico</th>
                              <th className="px-3 py-2 font-medium">Reservado</th>
                              <th className="px-3 py-2 font-medium">Disponible</th>
                            </tr>
                          </thead>
                          <tbody>
                            {g.rows.map((r) => (
                              <tr key={rowKey(r)} className="border-t border-stone-100">
                                <td className="px-3 py-2.5">
                                  <span className="font-medium">{r.sucursal_nombre}</span>
                                </td>
                                <td className="px-3 py-2.5">
                                  <StockCell
                                    row={r}
                                    onStockUpdated={(u) => patchMatrizCache(qc, queryKeyMatriz, r, u)}
                                    onFallbackRefresh={refreshMatriz}
                                  />
                                </td>
                                <td className="px-3 py-2.5 tabular-nums text-stone-600">{r.reservado}</td>
                                <td className="px-3 py-2.5 tabular-nums font-medium">{r.disponible}</td>
                              </tr>
                            ))}
                          </tbody>
                          {!singleSucursal && g.rows.length > 1 ? (
                            <tfoot>
                              <tr className="border-t border-stone-200 bg-stone-50/60 text-xs">
                                <td className="px-3 py-2 font-medium text-stone-500">Total</td>
                                <td className="px-3 py-2 tabular-nums font-semibold">{g.totalFisico}</td>
                                <td className="px-3 py-2 tabular-nums text-stone-600">{g.totalReservado}</td>
                                <td className="px-3 py-2 tabular-nums font-semibold">{g.totalDisponible}</td>
                              </tr>
                            </tfoot>
                          ) : null}
                        </table>
                      </div>

                      {/* Mobile nested cards */}
                      <div className="md:hidden space-y-2">
                        {g.rows.map((r) => (
                          <div
                            key={rowKey(r)}
                            className="rounded-lg border border-stone-100 bg-stone-50/40 p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium truncate">{r.sucursal_nombre}</p>
                              <p className="text-xs text-stone-500 shrink-0">Disp. {r.disponible}</p>
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-stone-500">Físico</span>
                                <StockCell
                                  row={r}
                                  onStockUpdated={(u) => patchMatrizCache(qc, queryKeyMatriz, r, u)}
                                  onFallbackRefresh={refreshMatriz}
                                />
                              </div>
                              <p className="text-xs text-stone-500">Res. {r.reservado}</p>
                            </div>
                          </div>
                        ))}
                        {!singleSucursal && g.rows.length > 1 ? (
                          <p className="text-xs text-stone-500 px-1">
                            Total: {g.totalFisico} físico · {g.totalDisponible} disponible
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-stone-600">
            Página {page + 1} de {totalPages} · {total} productos
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
