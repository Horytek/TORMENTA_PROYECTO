import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  assignDeliveryPedido,
  createDeliveryPedido,
  getDeliveryAdminToken,
  listDeliveryPedidos,
  listDeliveryRepartidores,
  patchDeliveryPedidoAdmin,
} from "@/features/platform/api/delivery";
import { EmptyState } from "@/features/platform/ui/EmptyState";
import { FilterBar } from "@/features/platform/ui/FilterBar";
import { KpiStrip } from "@/features/platform/ui/KpiStrip";
import { StatusChip } from "@/features/platform/ui/StatusChip";
import { PlatformMapPanel, LIMA_POINTS } from "@/features/platform/maps/PlatformMapPanel";
import { DeliveryAdminShell, deliveryErr } from "./delivery/DeliveryAdminShell";

type Pedido = {
  id_pedido: number;
  recojo: string;
  entrega: string;
  detalle?: string | null;
  estado: string;
  id_repartidor?: number | null;
};
type Repartidor = { id_repartidor: number; nombre: string; telefono?: string; activo: number };

const STATUSES = ["solicitado", "asignado", "en_camino", "entregado", "cancelado"];
const QUICK = ["en_camino", "entregado", "cancelado"] as const;

export default function DeliveryAdminPage() {
  const [session, setSession] = useState(Boolean(getDeliveryAdminToken()));
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");
  const [assignFor, setAssignFor] = useState<number | null>(null);
  const [pickRep, setPickRep] = useState<number | "">("");
  const [recojo, setRecojo] = useState("");
  const [entrega, setEntrega] = useState("");
  const [detalle, setDetalle] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [p, r] = await Promise.all([listDeliveryPedidos(), listDeliveryRepartidores()]);
      if (!p.success) throw new Error(p.message || "Sin acceso");
      setPedidos(p.data || []);
      setRepartidores((r.data || []).filter((x: Repartidor) => Number(x.activo) === 1));
    } catch (e: unknown) {
      setError(deliveryErr(e, "Error al cargar Delivery"));
      setSession(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session) return;
    void load();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 8000);
    return () => window.clearInterval(id);
  }, [session]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pedidos.filter((p) => {
      if (statusFilter !== "all" && p.estado !== statusFilter) return false;
      if (!q) return true;
      return (
        String(p.id_pedido).includes(q) ||
        p.recojo.toLowerCase().includes(q) ||
        p.entrega.toLowerCase().includes(q) ||
        (p.detalle || "").toLowerCase().includes(q)
      );
    });
  }, [pedidos, query, statusFilter]);

  const kpis = useMemo(() => {
    const count = (s: string) => pedidos.filter((p) => p.estado === s).length;
    return [
      { label: "Solicitados", value: count("solicitado") },
      { label: "En ruta", value: count("asignado") + count("en_camino") },
      { label: "Entregados", value: count("entregado") },
      { label: "Repartidores", value: repartidores.length },
    ];
  }, [pedidos, repartidores]);

  if (!session) return <Navigate to="/login?mode=delivery" replace />;

  if (loading && pedidos.length === 0) {
    return (
      <DeliveryAdminShell title="Pedidos" onLogout={() => setSession(false)}>
        <p className="text-sm text-black/50">Cargando…</p>
      </DeliveryAdminShell>
    );
  }

  if (error) {
    return (
      <DeliveryAdminShell title="Pedidos" onLogout={() => setSession(false)}>
        <p className="text-sm text-destructive">{error}</p>
      </DeliveryAdminShell>
    );
  }

  return (
    <DeliveryAdminShell
      title="Pedidos"
      subtitle="Asigna encargos y sigue el estado en vivo"
      onLogout={() => setSession(false)}
    >
      <KpiStrip items={kpis} />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-4">
          <form
            className="grid gap-2 rounded-lg border border-black/10 bg-white/70 p-3 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await createDeliveryPedido({
                  recojo: recojo.trim(),
                  entrega: entrega.trim(),
                  detalle: detalle.trim() || undefined,
                });
                if (!res.success) throw new Error(res.message);
                toast.success(`Pedido #${res.data.id_pedido} creado`);
                setRecojo("");
                setEntrega("");
                setDetalle("");
                await load();
              } catch (err: unknown) {
                toast.error(deliveryErr(err, "No se pudo crear"));
              }
            }}
          >
            <p className="text-[13px] font-medium sm:col-span-2">Nuevo pedido</p>
            <Input
              placeholder="Recojo"
              value={recojo}
              onChange={(e) => setRecojo(e.target.value)}
              required
            />
            <Input
              placeholder="Entrega"
              value={entrega}
              onChange={(e) => setEntrega(e.target.value)}
              required
            />
            <Input
              className="sm:col-span-2"
              placeholder="Detalle (opcional)"
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
            />
            <Button
              type="submit"
              className="border-0 bg-[var(--platform-accent)] text-white hover:opacity-90 sm:col-span-2"
            >
              Crear pedido
            </Button>
          </form>

          <FilterBar
            query={query}
            onQueryChange={setQuery}
            placeholder="Buscar recojo, entrega o #"
            activeStatus={statusFilter}
            onStatusChange={setStatusFilter}
            statuses={STATUSES}
          />

          {filtered.length === 0 ? (
            <EmptyState title="Sin pedidos" body="No hay pedidos con ese filtro." />
          ) : (
            <ul className="space-y-2">
              {filtered.map((p) => (
                <li
                  key={p.id_pedido}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-black/10 bg-white/70 px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      #{p.id_pedido} · {p.recojo} → {p.entrega}
                    </p>
                    {p.detalle ? (
                      <p className="text-[12px] text-black/45">{p.detalle}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusChip status={p.estado} />
                    {p.estado === "solicitado" ? (
                      assignFor === p.id_pedido ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            className="rounded border px-2 py-1 text-sm"
                            value={pickRep}
                            onChange={(e) =>
                              setPickRep(e.target.value ? Number(e.target.value) : "")
                            }
                          >
                            <option value="">Repartidor…</option>
                            {repartidores.map((r) => (
                              <option key={r.id_repartidor} value={r.id_repartidor}>
                                {r.nombre}
                              </option>
                            ))}
                          </select>
                          <Button
                            size="sm"
                            className="h-8"
                            disabled={!pickRep}
                            onClick={async () => {
                              try {
                                await assignDeliveryPedido(p.id_pedido, Number(pickRep));
                                toast.success("Asignado");
                                setAssignFor(null);
                                setPickRep("");
                                await load();
                              } catch (err: unknown) {
                                toast.error(deliveryErr(err, "Error"));
                              }
                            }}
                          >
                            Confirmar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8"
                            onClick={() => setAssignFor(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => setAssignFor(p.id_pedido)}
                        >
                          Asignar
                        </Button>
                      )
                    ) : null}
                    {QUICK.filter((s) => s !== p.estado).map((estado) => (
                      <Button
                        key={estado}
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px] capitalize"
                        onClick={async () => {
                          try {
                            await patchDeliveryPedidoAdmin(p.id_pedido, { estado });
                            toast.success(`Pedido → ${estado}`);
                            await load();
                          } catch (err: unknown) {
                            toast.error(deliveryErr(err, "Error"));
                          }
                        }}
                      >
                        {estado.replace("_", " ")}
                      </Button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <PlatformMapPanel
          title="Mapa operativo"
          points={LIMA_POINTS.slice(0, Math.min(6, Math.max(2, pedidos.length)))}
        />
      </div>
    </DeliveryAdminShell>
  );
}
