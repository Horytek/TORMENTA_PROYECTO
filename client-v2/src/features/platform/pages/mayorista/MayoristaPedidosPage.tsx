import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  listMayoristaPedidos,
  updateMayoristaPedidoEstado,
} from "@/features/platform/api/mayorista";
import { EmptyState } from "@/features/platform/ui/EmptyState";
import { FilterBar } from "@/features/platform/ui/FilterBar";
import { KpiStrip } from "@/features/platform/ui/KpiStrip";
import { StatusChip } from "@/features/platform/ui/StatusChip";
import { MayoristaAdminShell, mayoristaErr } from "./MayoristaAdminShell";

type Pedido = {
  id_pedido: number;
  estado: string;
  total: number;
  razon_social: string;
  email: string;
  tienda_slug: string;
  creado_en: string;
  notas?: string | null;
};

const STATUSES = ["borrador", "enviado", "confirmado", "rechazado", "despachado"];
const ACTIONS = ["confirmado", "rechazado", "despachado"] as const;

export default function MayoristaPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listMayoristaPedidos();
      if (!res.success) throw new Error(res.message || "Sin acceso");
      setPedidos(res.data || []);
    } catch (e: unknown) {
      setError(mayoristaErr(e, "Error al cargar pedidos"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pedidos.filter((p) => {
      if (statusFilter !== "all" && p.estado !== statusFilter) return false;
      if (!q) return true;
      return (
        String(p.id_pedido).includes(q) ||
        p.razon_social.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.tienda_slug.toLowerCase().includes(q)
      );
    });
  }, [pedidos, query, statusFilter]);

  const kpis = useMemo(() => {
    const count = (s: string) => pedidos.filter((p) => p.estado === s).length;
    const openTotal = pedidos
      .filter((p) => p.estado === "enviado" || p.estado === "confirmado")
      .reduce((acc, p) => acc + Number(p.total || 0), 0);
    return [
      { label: "Enviados", value: count("enviado") },
      { label: "Confirmados", value: count("confirmado") },
      { label: "Despachados", value: count("despachado") },
      {
        label: "Abierto S/",
        value: openTotal.toLocaleString("es-PE", { maximumFractionDigits: 0 }),
        hint: "Enviado + confirmado",
      },
    ];
  }, [pedidos]);

  return (
    <MayoristaAdminShell
      title="Pedidos B2B"
      subtitle="Cola de pedidos de tus portales. Confirma, rechaza o marca despacho."
    >
      {loading ? <p className="text-sm text-black/50">Cargando…</p> : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {!loading && !error ? (
        <>
          <KpiStrip items={kpis} />
          <FilterBar
            query={query}
            onQueryChange={setQuery}
            placeholder="Buscar pedido, comprador o portal…"
            activeStatus={statusFilter}
            onStatusChange={setStatusFilter}
            statuses={STATUSES}
          />
          {filtered.length === 0 ? (
            <EmptyState
              title="Sin pedidos en esta vista"
              body="Cuando un comprador ordene en /b2b/{slug}, aparece aquí."
            />
          ) : (
            <ul className="divide-y divide-black/8 border-y border-black/8">
              {filtered.map((p) => (
                <li
                  key={p.id_pedido}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium tracking-tight">
                      #{p.id_pedido} · {p.razon_social}
                    </p>
                    <p className="mt-0.5 text-[13px] text-black/50">
                      {p.email} · /b2b/{p.tienda_slug} · S/{" "}
                      {Number(p.total).toLocaleString("es-PE", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <div className="mt-2">
                      <StatusChip status={p.estado} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ACTIONS.map((estado) => (
                      <Button
                        key={estado}
                        size="sm"
                        variant="outline"
                        className="h-8 border-black/15 bg-white/70 text-[12px] capitalize"
                        disabled={p.estado === estado}
                        onClick={async () => {
                          try {
                            await updateMayoristaPedidoEstado(p.id_pedido, estado);
                            toast.success(`Pedido #${p.id_pedido} → ${estado}`);
                            await load();
                          } catch (err: unknown) {
                            toast.error(mayoristaErr(err, "No se pudo actualizar"));
                          }
                        }}
                      >
                        {estado}
                      </Button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </MayoristaAdminShell>
  );
}
